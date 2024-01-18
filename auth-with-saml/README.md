# SAML認証
## MEMO
✅ トークンの概念はない。<br>
✅ IdP経由で認証完了したら、セッションをもって認証済状態をKEEPする。<br>
✅ SAMLリクエスト/レスポンスは、BASE64エンコードされている。

<img src="https://github.com/daisuketakakuwa/nodejs-learning/assets/66095465/887afc4a-bd1b-44d2-93de-1cea16476256" width="650px">

<details>
<summary>sequencediagram scripts</summary>
Browser->ClientApp:未認証でアクセス
note over ClientApp:未認証の場合IdPへSAMLリクエスト
ClientApp->Browser:SAMLリクエスト
Browser->IdP:302 SAMLリクエスト
IdP->Browser:ID/PW要求
Browser->IdP:ID/PW入力
note over IdP:SAMLレスポンス作成(**🔒秘密鍵で署名する**)
IdP->Browser:200 SAMLレスポンス
note over Browser:ScriptでPOST /auth/callback実行
Browser->ClientApp:POST /auth/callback with SAMLレスポンス
note over ClientApp:SAMLレスポンス検証\n→**🔒公開鍵で署名検証**\n→ 検証OKだったらリダイレクト
ClientApp->Browser:TOPページへリダイレクト
</details>

## passport-saml ✕ Keycloak疎通メモ
- Keycloakで`Client Signature Required`はfalseにする。<br>
でないと`org.keycloak.common.VerificationException: SigAlg was null`と怒られる。
- SAMLレスポンスの署名を検証するための公開鍵は↓で確認可能👍

<img src="https://github.com/daisuketakakuwa/nodejs-learning/assets/66095465/c46885ae-029d-410a-90ee-fe00e213c690" width="650px">
<img src="https://github.com/daisuketakakuwa/nodejs-learning/assets/66095465/9d2b450b-5cc0-423b-b232-00aaddf2ddea" width="650px">
