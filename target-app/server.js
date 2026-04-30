const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: 'secret-key-bank',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true } // ⚠️ sengaja TIDAK ada sameSite — vulnerable!
}));

// Database simulasi
let users = {
  alice: { password: 'alice123', balance: 5000000 }
};
let transactions = [];

// Halaman login
app.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.send(`
    <html><body style="font-family:sans-serif; max-width:400px; margin:50px auto;">
      <h2>🏦 MyBank - Login</h2>
      <form method="POST" action="/login">
        <input name="username" placeholder="Username" value="alice" style="display:block;margin:8px 0;padding:8px;width:100%"><br>
        <input name="password" type="password" placeholder="Password" value="alice123" style="display:block;margin:8px 0;padding:8px;width:100%"><br>
        <button type="submit" style="padding:10px 20px;background:#007bff;color:white;border:none;cursor:pointer">Login</button>
      </form>
    </body></html>
  `);
});

// Proses login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (users[username] && users[username].password === password) {
    req.session.user = username;
    return res.redirect('/dashboard');
  }
  res.send('Login gagal!');
});

// Dashboard
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
      <h2>🏦 Dashboard - Halo, ${user}!</h2>
      <p>Saldo: <b>Rp${balance.toLocaleString()}</b></p>
      <hr>
      <h3>Transfer Dana</h3>
      <!-- ⚠️ FORM INI TIDAK ADA CSRF TOKEN — VULNERABLE! -->
      <form method="POST" action="/transfer">
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

// ⚠️ Endpoint transfer — TIDAK ada validasi CSRF
app.post('/transfer', (req, res) => {
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

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.listen(3000, () => console.log('🏦 Target App berjalan di http://localhost:3000'));