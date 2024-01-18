import express from "express";
import expressSession from "express-session";
import { Issuer, Strategy, TokenSet, UserinfoResponse } from "openid-client";
import passport from "passport";

const oidcAuthRouter = express.Router();

const OIDC_ISSUER = "http://localhost:8180";

// アプリ起動時にKeycloackと接続する。
let oidcIssuer: Issuer;

export const discoverOidcIssuer = async () => {
  oidcIssuer = await Issuer.discover(`${OIDC_ISSUER}/auth/realms/user/.well-known/openid-configuration`);
};

// issuer(IdP)との接続確立のために 非同期処理が必要
// -> asyncなミドルウェアを定義する。
// -> 接続を確立したら appオブジェクト に格納しておく。
const setupOidcIssuer = async (req, res, next) => {
  if (req.app.oidcIssuer) {
    return next();
  }

  // Client設定
  const { Client } = oidcIssuer;
  const oidcClient = new Client({
    // Keycloak側で作成
    client_id: "auth-with-oidc",
    client_secret: "8b4b9d1f-8e26-4c6c-8f0e-8a1277a3e787",
    // 認可エンドポイント
    authorization_endpoint: `${OIDC_ISSUER}/auth/realms/user/protocol/openid-connect/auth`,
    // Tokenエンドポイント
    token_endpoint: `${OIDC_ISSUER}/auth/realms/user/protocol/openid-connect/token`,
    userinfo_endpoint: `${OIDC_ISSUER}/auth/realms/user/protocol/openid-connect/userinfo`,
    redirect_uris: ["http://localhost:4000/auth/callback"],
    // 認可コードフロー
    response_types: ["code"],
  });

  // passportに openid-connect を利用して認証するよう設定
  passport.use(
    "oidc",
    new Strategy(
      {
        client: oidcClient,
        // PKCE(Proof Key for Code Exchange)
        // - 認可コードフローを使う上でのオプションの1つ
        // - デジタル署名のような役割
        // - Tokenエンドポイント@Keycloak側で署名の検証が必要
        // usePKCE: true,
        sessionKey: "test-session-key",
      },
      // Tokenエンドポイントよりレスポンスが返ってきたらこの関数が呼び出される。
      async (tokenset: TokenSet, userinfo: UserinfoResponse, done: (err: any, user?: any) => void) => {
        console.log(`token generated: ${tokenset.access_token}`);
        done(null, {
          // APIにはAccessトークンを送信する
          accessToken: tokenset.access_token,
          idToken: tokenset.id_token,
          refreshToken: tokenset.refresh_token,
          ...userinfo,
          // claims: jwt_decode(tokenset.access_token)
        });
      }
    )
  );

  // Expressのappオブジェクトに格納 -> いつでも req.appオブジェクトで参照可能。
  req.app.oidcIssuer = oidcIssuer;
  req.app.oidcClient = oidcClient;

  return next();
};

// 1. passport初期化
oidcAuthRouter.use(passport.initialize());
// 2. passportにセッション設定 ※先にexpress-sessionの設定
oidcAuthRouter.use(
  expressSession({
    secret: "use-this-secret-to-hash",
    resave: false,
    saveUninitialized: false,
  })
);
oidcAuthRouter.use(passport.session());
// 3. IdPとの接続確立
oidcAuthRouter.use(setupOidcIssuer);
// 4. req.user の登録(シリアライズ) 取得(デシリアライズ)の設定
passport.serializeUser((user: any, done) => {
  // 認証後、セッションへ保存するためのシリアライズ
  done(null, user);
});
passport.deserializeUser((obj: any, done) => {
  // セッションへ保存したUser情報を req.user へ格納するためのデシリアライズ
  done(null, obj);
});

oidcAuthRouter.get("/login", passport.authenticate("oidc"));

oidcAuthRouter.get("/auth/callback", (req, res, next) => {
  console.log("captured callback.");
  // 認可コードフローの場合、Tokenエンドポイントへリクエスト
  return passport.authenticate("oidc", {
    successRedirect: "/",
    failureRedirect: "/",
  })(req, res, next);
});

//　!!!! 未ログイン状態でCallされるAPIはこれより後ろに !!!!!!
oidcAuthRouter.use("*", (req, res, next) => {
  console.log(`authenticated: ${req.isAuthenticated()}`);
  if (req.isAuthenticated()) {
    return next();
  }

  return passport.authenticate("oidc")(req, res, next);
});

export default oidcAuthRouter;
