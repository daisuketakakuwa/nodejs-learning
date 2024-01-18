# OAuth2.0, OIDCについて理解する

## OAuth2.0
✅ClientAppが、外部APIを利用するためにアクセストークンを発行して認可してもらうもの。

## OIDC
✅UserがID/PWでログイン(認証)するためのもの。<br>
✅OAuth2.0を拡張した形なので、Accessトークンの発行も可能。<br>


## Client認証
✅前提1: clientTypeが`confidential`の場合に、Client認証が必要となる。<br>
✅前提2: Client認証は Tokenエンドポイントで行うので、Tokenエンドポイントを利用する認可コードフローの時のみ利用可能。<br><br>
✅IdP側でClientの設定をするときに ClientTypeを`confidential`とする。<br>
　 -> このときIdP側でClientに紐づくClientSecretを発行する。<br>
　 -> このClientSecretは IdP側とClientAppサーバ側 で保持しておく。<br>
※(おそらく)Tokenリクエストをするときに、ClientAppからcode(認可コード)とclientSecretを渡す。


## MEMO
✅OAuth2.0から 認可コードフロー/Implicitフロー という概念がある。<br>
✅今まで開発してきたAPI側のJWT検証は【アクセストークン】に対してやっていた。<br>
