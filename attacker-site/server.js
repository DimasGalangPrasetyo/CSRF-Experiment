const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(fs.readFileSync('./index.html'));
});

server.listen(4000, () => console.log('👿 Attacker Site berjalan di http://localhost:4000'));