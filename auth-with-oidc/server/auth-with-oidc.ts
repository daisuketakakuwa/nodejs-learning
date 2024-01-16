import express from 'express';
import passport from 'passport';
import session from 'express-session';
import { Strategy as OpenIDConnectStrategy, VerifyCallback } from 'passport-openidconnect';

const router = express.Router();

// セッションの初期化
router.use(session({ secret: 'use-this-secret-to-hash', resave: false, saveUninitialized: true }));

// Passportの初期化とセッションのサポート
router.use(passport.initialize());
router.use(passport.session());

// PassportのOpenID Connect戦略の設定
passport.use(
  new OpenIDConnectStrategy(
    {
      issuer: 'https://KEYCLOAKのURL',
      authorizationURL: 'https://KEYCLOAKのURL/authorize',
      tokenURL: 'https://KEYCLOAKのURL/token',
      userInfoURL: 'https://server.example.com/userinfo',
      clientID: process.env['KEYCLOAK側で定義したCLIENT_ID'],
      clientSecret: process.env['KEYCLOAK側で定義したCLIENT_SECRET'],
      callbackURL: 'https://ServiceProviderのURL/callback',
    },
    (issuer, profile, cb) => {
      // TBD
    },
  ),
);

passport.serializeUser((user: any, done) => {
  // 認証後、セッションへ保存するためのシリアライズ
  done(null, user);
});

passport.deserializeUser((obj: any, done) => {
  // セッションへ保存したUser情報を req.user へ格納するためのデシリアライズ
  done(null, obj);
});

// ログインルート
router.get('/login', passport.authenticate('oidc'));

// OIDCで認証OKとなった後にリダイレクトされる場所
// 1. 認可コードフロー -> ここで認可コードを利用して TokenエンドポイントをCallする？
// 2. Implicitフロー  -> ？？？？？
// でここの意味合いが変わってくる？
router.get(
  '/callback',
  // SAMLレスポンス検証 が ここに該当してくる...OIDCだとここはどうなる？
  passport.authenticate('oidc', {
    successRedirect: '/',
    failureRedirect: '/',
  }),
);
