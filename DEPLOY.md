# Panduan Deploy ke Vercel (untuk pemula)

Aplikasi ini **Next.js**, jadi Vercel bisa mendeploy-nya otomatis tanpa konfigurasi.
Ada dua cara. **Cara A (GitHub)** paling direkomendasikan karena setiap kali kode
diperbarui, Vercel otomatis deploy ulang.

---

## Cara A — Lewat GitHub (rekomendasi)

### 1. Buat akun
- Daftar GitHub: https://github.com/signup
- Daftar Vercel: https://vercel.com/signup → pilih **"Continue with GitHub"**

### 2. Unggah kode ke GitHub
Buka terminal di folder project ini, lalu jalankan satu per satu:

```bash
git init
git add .
git commit -m "Sistem Manajemen Outsourcing ABP - UI prototype"
```

Buat repository baru kosong di https://github.com/new (misal namanya `abp-outsourcing`,
biarkan **kosong** — jangan centang "Add README"). Lalu hubungkan & push
(ganti `USERNAME` dengan username GitHub Anda):

```bash
git branch -M main
git remote add origin https://github.com/USERNAME/abp-outsourcing.git
git push -u origin main
```

> Jika diminta login, gunakan **Personal Access Token** GitHub sebagai password:
> Settings → Developer settings → Personal access tokens → Generate new token (classic),
> centang scope `repo`.

### 3. Import ke Vercel
1. Masuk ke https://vercel.com/new
2. Pilih repository `abp-outsourcing` → **Import**
3. Vercel otomatis mendeteksi **Next.js** — semua setting biarkan default
4. Klik **Deploy**
5. Tunggu ±1–2 menit → muncul URL live, misal `https://abp-outsourcing.vercel.app`

Selesai. Setiap `git push` berikutnya akan otomatis deploy ulang.

---

## Cara B — Lewat Vercel CLI (tanpa GitHub)

```bash
npm i -g vercel
vercel login
vercel
```

Ikuti pertanyaannya (tekan Enter untuk semua default). Untuk versi produksi:

```bash
vercel --prod
```

---

## Catatan
- Tidak perlu environment variable apa pun (belum ada backend).
- Kalau build gagal di Vercel, jalankan `npm run build` dulu di lokal untuk melihat error.
- Domain custom (mis. `app.arowanabintang.co.id`) bisa ditambah nanti di
  Vercel → Project → Settings → Domains.
