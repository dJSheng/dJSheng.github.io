const http = require('http'), fs = require('fs'), path = require('path');
const mime = {'.html': 'text/html; charset=utf-8'};
const s = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('#')[0].split('?')[0]);
  if (p === '/') p = '/index.html';
  const f = path.join(__dirname, p);
  fs.readFile(f, (e, d) => {
    if (e) { res.writeHead(404); res.end('404'); return; }
    res.writeHead(200, {'Content-Type': mime[path.extname(f)] || 'application/octet-stream'});
    res.end(d);
  });
});
s.listen(8931, () => { console.log('SERVER_UP_ON_8931'); });
