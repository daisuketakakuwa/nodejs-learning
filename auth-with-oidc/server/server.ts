import express from 'express';
import path from 'path';

const app = express();
const port = process.env.PORT || 4000;

// ここにpassport-oidcを定義する
// 1. authenticate で IdP へリダイレクト
// 2. 認証OK → 認可コードともに戻ってくる
// 3. Tokenエンドポイントへ 認可コード送信(これはSP→IdPへ直接?)

app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
