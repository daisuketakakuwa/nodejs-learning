## SAMLをNode.jsで検証してみる
- SAMLの概念レベルの話は[learning-stack/knowledge/auth/003. SAML.md](https://github.com/daisuketakakuwa/learning-stack/blob/main/knowledge/auth/003.%20SAML.md)でまとめてます。
- ここでは**具体的な技術（passport × passport-saml × IdPとしてKeycloak）を用いたSAMLに関する検証**になります。

## passport-saml ✕ Keycloak疎通メモ
- Keycloakで`Client Signature Required`はfalseにする。<br>
でないと`org.keycloak.common.VerificationException: SigAlg was null`と怒られる。
- SAMLレスポンスの署名を検証するための公開鍵は↓で確認可能👍

<img src="https://github.com/daisuketakakuwa/nodejs-learning/assets/66095465/c46885ae-029d-410a-90ee-fe00e213c690" width="650px">
<img src="https://github.com/daisuketakakuwa/nodejs-learning/assets/66095465/9d2b450b-5cc0-423b-b232-00aaddf2ddea" width="650px">
