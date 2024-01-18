# OAuth2.0, OIDCについて理解する
1. OAuth2.0の認可フロー
2. 認可コードフロー と Implicitフロー
3. OIDCの認証認可フロー
4. state,nonce,PKCE

## MEMO
✅OAuth2.0から 認可コードフロー/Implicitフロー という概念がある。<br>
✅APIに投げて検証するのは【アクセストークン】<br>
👉認証リクエスト -> IDトークン 要求（response_type=id_token）<br>
👉認可リクエスト -> Accessトークン 要求（response_type=token）<br>
👉認証認可リクエスト -> IDトークン＋Accessトークン 要求（response_type=id_token token）<br>
✅**セッションもトークンも有効期限を短くして、頻繁に再生成した方がSecurity的にGood👍**

## 1. OAuth2.0の認可フロー
✅ClientAppが、外部APIを利用するためにアクセストークンを発行して認可してもらうもの。

以下、認可コードフローの例を示す。

<img src="https://github.com/daisuketakakuwa/nodejs-learning/assets/66095465/cd27d10c-7b34-43f6-8a4d-98c72a819640" width="650px">
<img src="https://github.com/daisuketakakuwa/nodejs-learning/assets/66095465/db006474-b5ca-4222-b61a-38c0c6e93ce6" width="650px">

<details>
<summary>sequencediagram scripts</summary>
title 【OAuth2.0/認可コードフロー】ClientAppよりTwitterAPIを利用するための手順

participant Browser
participant ClientApp
fontawesome f099 AuthorizationServer #1da1f2
fontawesome f099 ResourceServer #1da1f2

Browser->ClientApp:Twitterr連携で投稿したい
note over ClientApp:まだAccessToken発行してないか、OK
ClientApp->Browser: 認可リクエスト【**response_type=code**】
Browser->AuthorizationServer:認可リクエスト(clientId,state)
note over AuthorizationServer:**認可エンドポイント**
AuthorizationServer->Browser:Twitter連携OK？
Browser->AuthorizationServer:Twitter連携OK！
AuthorizationServer->Browser:認可レスポンス(認可コード,state)
Browser->ClientApp:認可レスポンス(認可コード,state)
note over ClientApp:✅state検証
ClientApp->AuthorizationServer:Tokenリクエスト with 認可コード
note over AuthorizationServer:**Tokenエンドポイント**\n✅clientIdとclientSecretを用いて\n　 CientAppの正当性を検証
AuthorizationServer->ClientApp:Accessトークン/**Refreshトークン**
ClientApp->ResourceServer:TwitterAPIコール with Accessトークン in Authorizationヘッダ
note over ResourceServer:Accessトークン検証
ResourceServer->AuthorizationServer:POST Accessトークン送信
note over AuthorizationServer:**Introspectionエンドポイント**\nAccessトークンの有効性を検証
AuthorizationServer->ResourceServer:トークン有効だよ👍
note over ResourceServer:Twitter投稿処理
ResourceServer->Browser:ツイート完了👍
</details>

## 2. 認可コードフロー と Implicitフロー
２つのフローはOAuth2.0より存在する概念

### 認可コードフロー
図は`1. OAuth2.0の認可フロー`を参照。<br><br>
以下の要素は**認可コードフロー特有の要素であり、Implicitフローには存在しない。** <br>
　・Tokenエンドポイント<br>
　・Refreshトークン<br>
　・Client認証@Tokenエンドポイント ※下記参照<br>

### Client認証
✅前提1: clientTypeが`confidential`の場合に、Client認証が必要となる。<br>
✅前提2: Client認証は Tokenエンドポイントで行うので、Tokenエンドポイントを利用する認可コードフローの時のみ利用可能。<br><br>
✅IdP側でClientの設定をするときに ClientTypeを`confidential`とする。<br>
　 -> このときIdP側でClientに紐づくClientSecretを発行する。<br>
　 -> このClientSecretは IdP側とClientAppサーバ側 で保持しておく。<br>
※(おそらく)Tokenリクエストをするときに、ClientAppからcode(認可コード)とclientSecretを渡す。<br><br>

以下、Keycloakにて Clientを`confidential`とし、ClientSecretを生成している様子。

<img src="https://github.com/daisuketakakuwa/nodejs-learning/assets/66095465/91e61f89-4be6-4152-8c25-b2dc14811183" width="400px">
<img src="https://github.com/daisuketakakuwa/nodejs-learning/assets/66095465/40d42361-9dcd-421d-8d55-408f864e1182" width="400px">


### Implicitフロー
認可コードフローと比較すると<br>
△ Browser側にAccessトークンが直接わたってしまう。<br>
△ Refreshトークンがないため、期限が切れるたびに再認証を行う必要がある。<br>
△ state検証,nonce検証,PKCE検証 が行えない -> Security的に弱い。<br><br>

以上を踏まえて、**OAuth2.0, OIDCともに認可コードフローが推奨されている✅**

<img src="https://github.com/daisuketakakuwa/nodejs-learning/assets/66095465/5b895245-af23-410f-9b13-4ee3f9182027" width="650px">

<details>
<summary>sequencediagram scripts</summary>
title 【OAuth2.0/Implicitフロー】ClientAppよりTwitterAPIを利用するための手順

participant Browser
participant ClientApp
fontawesome f099 AuthorizationServer #1da1f2
fontawesome f099 ResourceServer #1da1f2

Browser->ClientApp:Twitterr連携で投稿したい
note over ClientApp:まだAccessToken発行してないか、OK
ClientApp->Browser: 認可リクエスト【**response_type=code**】
Browser->AuthorizationServer:認可リクエスト(clientId,state)
note over AuthorizationServer:**認可エンドポイント**
AuthorizationServer->Browser:Twitter連携OK？
Browser->AuthorizationServer:Twitter連携OK！
AuthorizationServer->Browser:**Accessトークン**
Browser->ResourceServer:TwitterAPIコール with Accessトークン in Authorizationヘッダ
note over ResourceServer:Accessトークン検証
ResourceServer->AuthorizationServer:POST Accessトークン送信
note over AuthorizationServer:**Introspectionエンドポイント**\nAccessトークンの有効性を検証
AuthorizationServer->ResourceServer:トークン有効だよ👍
note over ResourceServer:Twitter投稿処理
ResourceServer->Browser:ツイート完了👍
</details>

## 3. OIDCの認証認可フロー
✅認可コードフロー/ImplicitフローはOAuth2.0より存在する概念で、OIDCでも同様に利用する。<br>
✅異なるところは<br>
　・**アクセストークンに加えて、IDトークンも発行できるようになったこと。** <br>
　・IDトークンは ID/PW認証を行ったのち生成される。<br>

<img src="https://github.com/daisuketakakuwa/nodejs-learning/assets/66095465/e9aa6ace-274f-4dab-8e62-1eaef89b378a" width="650px">
<img src="https://github.com/daisuketakakuwa/nodejs-learning/assets/66095465/4c047f6a-67e9-4415-b77e-a1569fe17abc" width="650px">

<details>
<summary>sequencediagram scripts</summary>
title 【OIDC/認可コードフロー】ClientAppにてGoogleを使ってログインする流れ

participant Browser
participant ClientApp
fontawesome f1a0 AuthorizaionServer

Browser->ClientApp:ClientApp未認証の状態でアクセス
note over ClientApp:未認証の場合IdPへ認証認可リクエスト
ClientApp->Browser:302 IdPへ認証認可リクエスト(state)
Browser->AuthorizaionServer: 認証認可リクエスト【**response_type=id_token token**】
note over AuthorizaionServer:**認可エンドポイント**
AuthorizaionServer->Browser:ID/PW要求
Browser->AuthorizaionServer:ID/PW入力
note over AuthorizaionServer:認証OK
AuthorizaionServer->Browser:認可レスポンス(認可コード,state)
Browser->ClientApp: 認可レスポンス(認可コード,state)
note over ClientApp:✅state検証
ClientApp->AuthorizaionServer:Tokenリクエスト with 認可コード
note over AuthorizaionServer:**Tokenエンドポイント**\n✅clientIdとclientSecretを用いて\n　 CientAppの正当性を検証
AuthorizaionServer->ClientApp:**IDトークン**/Accessトークン/**Refreshトークン**取得
note over ClientApp:req.userにUser情報格納＆認証済👍
ClientApp->Browser:TOP画面へリダイレクト
</details>

## 4. state,nonce,PKCE
参考： https://dev.classmethod.jp/articles/openid-connect-state-nonce-pkce/

### stateパラメータ - CSRF攻撃防止
・悪意Aさんの認可コードリクエストURLを 善意Aさんに踏まえる。<br>
・善意Aさんは 悪意Aさんとしてログインした状態で個人情報など入力してしまう。<br>
・**善意Aさんしか知れない「善意Aさんのセッションにひもづく** 識別子」を必須とし、<br>
　**Tokenリクエスト前にAppServerにたどりついたところ**で「stateパラメータ」と「AppServerのセッション」の比較を行う。

### nonceパラメータ - リプレイアタック(Token再利用)の防止
・number used once(一意の値) <br>
・**IDトークンのclaims内**に格納するパラメータ。
・stateパラメータと同じく、善意Aさんしか知れないセッションに紐づく識別子。
・**APIリクエストするたびに**、ClientAppでnonceパラメータが善意Aさんと紐づくものかどうか検証する

### PKCE - 認可コードが悪意Aさんに奪われても大丈夫なように。



