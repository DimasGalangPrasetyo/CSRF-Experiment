const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const csrf = require('csurf');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'secret-key-bank',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    httpOnly: true,
    sameSite: 'lax' // ✅ Proteksi tambahan dengan SameSite
  }
}));

// ✅ CSRF middleware aktif
const csrfProtection = csrf();
app.use(csrfProtection);

let users = { alice: { password: 'alice123', balance: 5000000 } };
let transactions = [];

app.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.send(`
    <html><body style="font-family:sans-serif; max-width:400px; margin:50px auto;">
      <h2>🏦 MyBank FIXED - Login</h2>
      <form method="POST" action="/login">
        <!-- ✅ CSRF Token disertakan di setiap form -->
        <input type="hidden" name="_csrf" value="${req.csrfToken()}">
        <input name="username" placeholder="Username" value="alice" style="display:block;margin:8px 0;padding:8px;width:100%"><br>
        <input name="password" type="password" placeholder="Password" value="alice123" style="display:block;margin:8px 0;padding:8px;width:100%"><br>
        <button type="submit" style="padding:10px 20px;background:#007bff;color:white;border:none;cursor:pointer">Login</button>
      </form>
    </body></html>
  `);
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (users[username] && users[username].password === password) {
    req.session.user = username;
    return res.redirect('/dashboard');
  }
  res.send('Login gagal!');
});

app.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/');
  const user = req.session.user;
  const balance = users[user].balance;
  const txList = transactions
    .filter(t => t.from === user)
    .map(t => `<li>Transfer Rp${t.amount.toLocaleString()} ke <b>${t.to}</b> — ${t.time}</li>`)
    .join('') || '<li>Belum ada transaksi</li>';

  res.send(`
    <html><body style="font-family:sans-serif; max-width:500px; margin:50px auto;">
      <h2>🏦 Dashboard FIXED - Halo, ${user}!</h2>
      <p>Saldo: <b>Rp${balance.toLocaleString()}</b></p>
      <p>✅ <i>App ini dilindungi CSRF Token + SameSite Cookie</i></p>
      <hr>
      <h3>Transfer Dana</h3>
      <form method="POST" action="/transfer">
        <!-- ✅ CSRF Token otomatis divalidasi server -->
        <input type="hidden" name="_csrf" value="${req.csrfToken()}">
        <input name="to" placeholder="Tujuan transfer" style="display:block;margin:8px 0;padding:8px;width:100%"><br>
        <input name="amount" type="number" placeholder="Jumlah (Rp)" style="display:block;margin:8px 0;padding:8px;width:100%"><br>
        <button type="submit" style="padding:10px 20px;background:#28a745;color:white;border:none;cursor:pointer">Transfer</button>
      </form>
      <hr>
      <h3>Riwayat Transfer</h3>
      <ul>${txList}</ul>
      <a href="/logout">Logout</a>
    </body></html>
  `);
});

app.post('/transfer', (req, res) => {
  // ✅ Jika CSRF token tidak valid/tidak ada, csurf otomatis tolak request
  if (!req.session.user) return res.status(401).send('Unauthorized');
  const { to, amount } = req.body;
  const user = req.session.user;
  const amt = parseInt(amount);

  if (!to || !amt || amt <= 0) return res.send('Data tidak valid');
  if (amt > users[user].balance) return res.send('Saldo tidak cukup');

  users[user].balance -= amt;
  transactions.push({ from: user, to, amount: amt, time: new Date().toLocaleTimeString() });

  res.send(`
    <html><body style="font-family:sans-serif; max-width:500px; margin:50px auto;">
      <h2>✅ Transfer Berhasil!</h2>
      <p>Rp${amt.toLocaleString()} telah dikirim ke <b>${to}</b></p>
      <p>Saldo tersisa: <b>Rp${users[user].balance.toLocaleString()}</b></p>
      <a href="/dashboard">Kembali ke Dashboard</a>
    </body></html>
  `);
});

// ✅ Error handler khusus untuk CSRF
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).send(`
      <html><body style="font-family:sans-serif; max-width:500px; margin:50px auto;">
        <h2>🚫 Request Ditolak!</h2>
        <p><b>Alasan:</b> CSRF Token tidak valid atau tidak ditemukan.</p>
        <p>Kemungkinan ini adalah serangan CSRF dari situs lain.</p>
        <a href="/dashboard">Kembali ke Dashboard</a>
      </body></html>
    `);
  }
  next(err);
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.listen(3001, () => console.log('✅ Target App FIXED berjalan di http://localhost:3001'));