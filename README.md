# 🔐 CSRF Experiment — Cross-Site Request Forgery Demo

> Proyek eksperimen untuk memahami dan membuktikan serangan **Cross-Site Request Forgery (CSRF)** secara langsung, beserta implementasi mitigasinya menggunakan Node.js & Express.

Dibuat sebagai bagian dari Tugas UTS Pemrograman Web — eksperimen ini mendokumentasikan bagaimana serangan CSRF bekerja pada aplikasi yang tidak terlindungi, dan bagaimana cara mencegahnya.

---

## 📸 Demo Eksperimen

### 1. Halaman Login — Target App (Port 3000)
![Halaman Login](<img width="1321" height="692" alt="hal login" src="https://github.com/user-attachments/assets/99327f6f-42ce-4401-8a99-a48e6429524d" />
)
> *Aplikasi simulasi bank "MyBank" — alice login dengan saldo awal Rp5.000.000*

---

### 2. Halaman Penyerang — Attacker Site (Port 4000)
![Attacker Site](<img width="1321" height="692" alt="hal penyerang" src="https://github.com/user-attachments/assets/0160d632-8a70-4857-bb0c-30860da57871" />
)
> *Halaman "Klaim Hadiah" palsu yang menyembunyikan form transfer di baliknya*

---

### 3. Serangan Berhasil — Saldo Berkurang
![Saldo Berkurang](<img width="1321" height="692" alt="saldo berkurang" src="https://github.com/user-attachments/assets/fa649ea7-e909-4358-90cb-48d98aeb24d6" />
)
> *Setelah klik "Klaim Hadiah", saldo alice berkurang Rp1.000.000 tanpa sadar melakukan transfer*

---

### 4. Serangan Ditolak — Protected App (Port 3001)
![Protected](<img width="1321" height="692" alt="hal login" src="https://github.com/user-attachments/assets/6a818f50-1b60-4eb5-8f79-483bd9ff1192" />
)
> *Versi yang terlindungi menampilkan error 403 — serangan gagal total*

---

## 🗂️ Struktur Proyek

```
csrf-experiment/
├── target-app/              # Aplikasi bank VULNERABLE (port 3000)
│   ├── server.js            # Express server tanpa proteksi CSRF
│   └── package.json
│
├── attacker-site/           # Website penyerang (port 4000)
│   ├── index.html           # Halaman "hadiah" palsu dengan form tersembunyi
│   └── server.js            # Static file server
│
├── target-app-fixed/        # Aplikasi bank PROTECTED (port 3001)
│   ├── server.js            # Express server dengan CSRF token + SameSite cookie
│   └── package.json
│
└── screenshots/             # Folder untuk screenshot eksperimen
    ├── ss_login.png
    ├── ss_attacker.png
    ├── ss_attacked.png
    └── ss_protected.png
```

---

## ⚙️ Cara Menjalankan

### Prerequisites
- Node.js v16 atau lebih baru
- npm

### Instalasi

```bash
# Clone repo ini
git clone https://github.com/username/csrf-experiment.git
cd csrf-experiment

# Install dependencies target-app (vulnerable)
cd target-app && npm install && cd ..

# Install dependencies target-app-fixed (protected)
cd target-app-fixed && npm install && cd ..
```

### Menjalankan Semua Server

Buka **3 terminal terpisah**:

```bash
# Terminal 1 — Target App (Vulnerable)
cd target-app
node server.js
# → berjalan di http://localhost:3000

# Terminal 2 — Attacker Site
cd attacker-site
node server.js
# → berjalan di http://localhost:4000

# Terminal 3 — Target App (Protected)
cd target-app-fixed
node server.js
# → berjalan di http://localhost:3001
```

---

## 🧪 Langkah Eksperimen

### Membuktikan Serangan (Port 3000)

1. Buka `http://localhost:3000` → login sebagai **alice** (password: `alice123`)
2. **Jangan logout** — buka tab baru ke `http://localhost:4000`
3. Klik tombol **"Klaim Hadiah Sekarang!"**
4. Kembali ke tab bank → refresh dashboard
5. **Hasilnya:** saldo alice berkurang Rp1.000.000 tanpa sadar melakukan transfer ✅

### Membuktikan Mitigasi (Port 3001)

1. Ubah `action` di `attacker-site/index.html` menjadi `http://localhost:3001/transfer`
2. Buka `http://localhost:3001` → login sebagai **alice**
3. **Jangan logout** — buka tab baru ke `http://localhost:4000`
4. Klik tombol **"Klaim Hadiah Sekarang!"**
5. **Hasilnya:** muncul error 403 — serangan ditolak, saldo tetap aman ✅

---

## 🛡️ Mekanisme Proteksi yang Diimplementasikan

### 1. CSRF Token (`csurf` middleware)
Setiap form di-generate dengan token acak unik per sesi. Server memvalidasi token ini sebelum memproses request apapun. Penyerang dari domain lain tidak bisa mengetahui nilai token ini.

```javascript
const csrf = require('csurf');
app.use(csrf());

// Token disisipkan ke setiap form
app.get('/dashboard', (req, res) => {
  res.send(`
    <form method="POST" action="/transfer">
      <input type="hidden" name="_csrf" value="${req.csrfToken()}">
      ...
    </form>
  `);
});
```

### 2. SameSite Cookie Attribute
Cookie sesi dikonfigurasi dengan `sameSite: 'lax'` sehingga browser tidak akan mengirimkan cookie dalam cross-site request yang dipicu secara programatik.

```javascript
app.use(session({
  secret: 'secret-key',
  cookie: {
    httpOnly: true,
    sameSite: 'lax'  // Blokir cookie pada cross-site request
  }
}));
```

---

## 📊 Perbandingan Hasil

| Aspek | Vulnerable (Port 3000) | Protected (Port 3001) |
|---|---|---|
| CSRF Token | ❌ Tidak ada | ✅ Ada, divalidasi |
| SameSite Cookie | ❌ Tidak dikonfigurasi | ✅ Diset ke `lax` |
| Hasil Serangan | 🔴 Transfer berhasil | 🟢 Ditolak 403 |
| Dampak ke Saldo | Berkurang Rp1.000.000 | Tidak berubah |

---

## 📚 Referensi

- [OWASP — Cross-Site Request Forgery](https://owasp.org/www-community/attacks/csrf)
- [MDN — SameSite cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
- [PortSwigger — What is CSRF?](https://portswigger.net/web-security/csrf)
- [npm — csurf middleware](https://www.npmjs.com/package/csurf)

---
