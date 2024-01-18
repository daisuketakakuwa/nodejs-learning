import express from "express";
import path from "path";
import samlAuthRouter from "./auth-with-saml";

const app = express();
const port = process.env.PORT || 4000;

// POSTパラメータを受け取るための設定
app.use(express.urlencoded({ extended: true }));
// POSTパラメータの JSON文字列 → JSオブジェクト へ変換してくれる
app.use(express.json());

app.use(samlAuthRouter);

app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "index.html"));
});

app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
});
