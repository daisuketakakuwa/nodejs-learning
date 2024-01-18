import express from 'express';
import path from 'path';
import oidcAuthRouter, { discoverOidcIssuer } from './auth-with-oidc';

const app = express();
const port = process.env.PORT || 4000;

app.use(oidcAuthRouter);

app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

app.listen(port, async () => {
  await discoverOidcIssuer();
  console.log('Discovered OIDC issuer.');
  console.log(`Server is running on port ${port}`);
});
