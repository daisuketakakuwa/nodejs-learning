import { Profile, Strategy, VerifiedCallback } from "@node-saml/passport-saml";
import express from "express";
import expressSession from "express-session";
import passport from "passport";

const samlAuthRouter = express.Router();

const SAML_ISSUER = "http://localhost:8180";

// 1. passport初期化
samlAuthRouter.use(passport.initialize());
// 2. passportにセッション設定 ※先にexpress-sessionの設定
samlAuthRouter.use(
  expressSession({
    secret: "use-this-secret-to-hash",
    resave: false,
    saveUninitialized: false,
  })
);
samlAuthRouter.use(passport.session());
// 3. SAML IdPの設定
passport.use(
  new Strategy(
    {
      passReqToCallback: true,
      // SP側で「このFormatでUserIDをSAMLレスポンスに含んで欲しい」と指定可能。
      // SP側で指定しなかったら、IdP側で既定のFormatを利用して返される。
      identifierFormat: "urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified",
      // ★SAMLレスポンスには 1.Response自体に対する署名 2.アサーションに対する署名 の2つがある。
      // Keycloakの【Sign assertions】が true の場合、2の署名もつく。
      // 2の署名がない場合は このオプションをfalseにしないとエラーとなる。
      wantAssertionsSigned: true,
      // SAMLレスポンスが送られてくるエンドポイント
      callbackUrl: "http://localhost:4000/auth/callback",
      // SAMLリクエスト送信先
      entryPoint: `${SAML_ISSUER}/auth/realms/User/protocol/saml`,
      // SAMLリクエストを発行/issueする このSPのEntityID
      // -> IdP側でClient作成時に設定したIDがここになる。
      issuer: "auth-with-saml",
      // SAMLリクエストを署名するアルゴリズム?
      signatureAlgorithm: "sha256",
      // SAMLレスポンスを検証するための公開鍵(Keycloak側で生成)
      cert: "MIIClzCCAX8CBgGNHNrdHzANBgkqhkiG9w0BAQsFADAPMQ0wCwYDVQQDDARVc2VyMB4XDTI0MDExODEzNTM0MloXDTM0MDExODEzNTUyMlowDzENMAsGA1UEAwwEVXNlcjCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAKVFh2O1Td5TjF7j3o4wYTS+InrMwslSCOSTqN/7NPbDuE8jwF9XYq/kmI66W2jKPEccLiejCmUemZ8bE8xURG/zAD9ChyWnn3GxBFs0GogN75wl07kotVcKSWrIKt3uETj/Orjn9N2Qp0RjymRhCU+nq0HjXEIREspCmHfWrEO27Idi8vGOXHQD9ghbI6bHlz2etLaymQ5MiB4RKCLEEnUxJKNvC5mGV5orz/bIFIiVl3/FdFtWTVmSby4Dwe/vnuH6zs5vD3P5OZV6LF7oBT6d6e85w/Kn/NlJz/2HZ//t8UfiqJc0J6AmtNKuholN/vQvmB/RNQo9DD6ZL/LjbuMCAwEAATANBgkqhkiG9w0BAQsFAAOCAQEADW9DhMMLRqKTLUIoxpUi7IskRDX/cHC+YmUcVXSY6N7DIt1M38ST2Ee76hI7Ueu1V/5+wwWbz+GDhKzO+qmg7WfC0duU1oNDeinu3O3m3scwVjve/Ch63JtyyTcFwZ5DMCJiOo4n+pbF3ONVNKnjNOgm44HRL+UdsxkBbwcEkciGUq3Qsi3SJQzdiA2TW9QfBLGAjAn+BQLcBf89VWvlaLJsCg7o0U7RRsvirkPbV7vNA9s1xAeFQPN8w5pVFMwEAF7xteioYX/0gT5UryCWlMed4Em7miDh4AXkkAK02EK630XudNoGBC+0DsSfU9tUdUsbIxIDjhzwMognmKUhFQ==",
    },
    // signonVerify
    // - SAMLレスポンス検証後呼ばれる
    (req: express.Request, profile: Profile | null, done: VerifiedCallback) => {
      return done(null, profile);
    },
    // logoutVerify
    (req: express.Request, profile: Profile | null, done: VerifiedCallback) => {}
  )
);

// 4. req.user の登録(シリアライズ) 取得(デシリアライズ)の設定
passport.serializeUser((user: any, done) => {
  // 認証後、セッションへ保存するためのシリアライズ
  done(null, user);
});
passport.deserializeUser((obj: any, done) => {
  // セッションへ保存したUser情報を req.user へ格納するためのデシリアライズ
  done(null, obj);
});

// Callbackエンドポイントに SAMLレスポンスをPOST
// passport.authenticate => IdP側でSAMLレスポンス検証
// ★POSTでSAMLレスポンスが送信されるので、app.use(express.json()); の設定がないと動きがおかしくなる。
// https://github.com/node-saml/passport-saml?tab=readme-ov-file#provide-the-authentication-callback
samlAuthRouter.post("/auth/callback", passport.authenticate("saml", { failureFlash: true }), (req, res) => {
  console.log("captured");
  res.redirect("/");
});

samlAuthRouter.get("/auth/failed", (req, res) => {
  return res.send("auth failed.");
});

//　!!!! 未ログイン状態でCallされるAPIはこれより後ろに !!!!!!
samlAuthRouter.use("*", (req, res, next) => {
  console.log(`authenticated: ${req.isAuthenticated()}`);
  if (req.isAuthenticated()) {
    return next();
  }

  return passport.authenticate("saml")(req, res, next);
});

export default samlAuthRouter;
