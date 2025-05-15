// index.js 
const express = require('express');
const { OGDHttp } = require('./indexWebhook');

const app = express();
app.use(express.json());

app.post('/', OGDHttp);
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});