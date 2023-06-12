const http = require('http');
const express = require('express');

const app = express();

app.get('/', (req, res) => {
  res.send('Hello from HTTP server!');
});

const httpServer = http.createServer(app);

httpServer.listen(5173, () => {
  console.log('HTTP server running on port 5173');
});

