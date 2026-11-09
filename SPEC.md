# Spec: Tilikstory — Penjualan Undangan Digital

## Status implementasi saat ini

- MVP berjalan secara lokal melalui Docker.
- Teknologi yang digunakan: TypeScript, Bun, Next.js, dan PostgreSQL.

Fakta di atas adalah satu-satunya pernyataan tentang implementasi saat ini dalam spesifikasi ini. Bagian berikutnya menetapkan arah produk dan persyaratan target; bagian tersebut tidak menyatakan bahwa fitur tertentu sudah atau belum diimplementasikan.

## Objective

Membangun aplikasi web untuk pasar Indonesia. Pelanggan memilih dan membeli template undangan pernikahan atau ulang tahun. Setelah pembayaran berhasil, pelanggan mengisi data acara, mengunggah foto, menerbitkan undangan, lalu membagikan tautannya atau mengirimkannya melalui WhatsApp kepada tamu yang sudah opt-in.

Pelanggan memakai akun untuk mengelola undangan. Tamu dapat membuka undangan melalui tautan publik tanpa akun. Admin mengelola template dan pesanan. Refund tidak termasuk dalam cakupan produk yang ditetapkan di sini.

## Peta Kapabilitas Produk

| ID modul | Tanggung jawab target | Bergantung pada |
|---|---|---|
| `template-catalog` | Menampilkan dan memilih template | — |
| `checkout` | Membuat pesanan dan memproses pembayaran | `template-catalog` |
| `invitation-editor` | Mengisi data/foto dan menerbitkan undangan setelah pembayaran berhasil | `template-catalog`, `checkout` |
| `guest-delivery` | Membagikan tautan atau mengirim undangan lewat WhatsApp kepada tamu opt-in | `invitation-editor` |
| `admin-ops` | Mengelola template dan status pesanan | `template-catalog`, `checkout` |

**Urutan kapabilitas target:** `template-catalog` → `checkout` → `invitation-editor` dan `admin-ops` (dapat berjalan paralel) → `guest-delivery` setelah `invitation-editor`.

Spesifikasi rinci tiap modul dapat dibuat terpisah mengikuti urutan dependensi.

## Arah UI dan Referensi Desain

Gunakan [ChainGPT Labs](https://labs.chaingpt.org/) sebagai referensi pendekatan visual, bukan sebagai desain untuk disalin. Ambil inspirasi dari hierarki yang tegas, headline besar, hero visual dengan ajakan utama yang jelas, komposisi editorial antarseksi, dan aksen grafis yang khas. Logo, teks, ilustrasi, identitas Web3, serta tata letak persis ChainGPT Labs tidak digunakan.

- **Katalog publik:** tampilkan pilihan template dan pratinjau visualnya sebagai fokus utama. Bedakan kategori pernikahan dan ulang tahun dengan navigasi/filter yang mudah dipahami; sediakan aksi jelas untuk melihat atau memilih template.
- **Alur pelanggan:** checkout, editor undangan, dan pengelolaan undangan mengutamakan keterbacaan, hierarki informasi, serta aksi dan status yang mudah ditemukan. Jangan membawa dekorasi hero atau animasi berat ke layar kerja.
- **Undangan publik:** visual template dan foto acara menjadi fokus; susun detail acara agar mudah dibaca di layar ponsel.
- **Visual dan interaksi:** gunakan tipografi ekspresif dan aksen grafis secukupnya agar identitas terasa khas tanpa mengurangi keterbacaan. Palet dan aset harus sesuai identitas Tilikstory, bukan menyalin branding referensi. Gerakan bersifat dekoratif dan tidak boleh menghalangi konten atau aksi.
- **Responsif dan aksesibel:** rancang mobile-first untuk katalog, checkout, editor, dan undangan publik. Semua kontrol dapat digunakan dengan keyboard dan memiliki label; kontras teks memadai; status tidak dibedakan dengan warna saja; hormati preferensi reduced motion.

Referensi ini menetapkan arah visual, bukan persyaratan untuk menyalin animasi, video, atau implementasi teknis situs contoh.

## Stack dan Integrasi Target

Stack MVP saat ini tercatat di bagian status implementasi. Detail versi, ORM/driver PostgreSQL, layanan Docker, port, variabel konfigurasi, dan perintah operasional tidak ditetapkan oleh dokumen ini.

Persyaratan atau pilihan produk berikut adalah target, bukan klaim konfigurasi yang sedang berjalan:

- **Autentikasi:** Email/password di aplikasi; sesi disimpan di PostgreSQL. Verifikasi email lokal menggunakan Mailpit dalam stack Docker.
- **Foto/aset:** Penyimpanan lokal pada volume Docker. Draft bersifat privat; aset terbit disajikan publik melalui route aplikasi.
- **Pembayaran:** Midtrans Snap sandbox sebagai target; QRIS, VA, dan e-wallet bergantung pada aktivasi merchant.
- **WhatsApp:** Meta WhatsApp Cloud API sebagai target integrasi eksternal; pengiriman otomatis hanya kepada penerima yang opt-in dengan template yang disetujui.
- **ORM dan driver:** Belum ditetapkan dalam spesifikasi ini.

Target operasional dokumen ini adalah MVP lokal melalui Docker. Hosting dan deployment produksi tidak termasuk dalam cakupan target saat ini.

## T2: Kontrak Akses Akun dan Keamanan

Kontrak ini menetapkan persyaratan target untuk akses akun pelanggan T2; bukan pernyataan status implementasi. T2 menambahkan tabel minimal `account_profiles` dengan `user_id` sebagai primary key dan foreign key ke tabel `users` aplikasi; tidak ada field profil lain dalam cakupan.

Akses ke `account_profiles` hanya melalui kode server Next.js dengan sesi terverifikasi, tidak melalui browser client. Identitas autentik dari sesi, bukan user ID yang dikirim pemanggil, menentukan pemilik profil. Tidak ada service-role client atau public API dalam rancangan ini. Kepemilikan ditegakkan pada lapisan server; integration tests memverifikasi bahwa user A tidak dapat membaca atau mengubah baris user B, termasuk melalui API routes.

Sesi disimpan di PostgreSQL dan menggunakan cookie httpOnly, SameSite; cookie Secure di production. Sesi divalidasi pada setiap server request. Sign-out mengakhiri hanya sesi browser saat ini.

Konfirmasi email lokal menggunakan Mailpit. Hanya callback endpoint yang menerima `token_hash` dan `type=email` dan memverifikasi token sekali pakai. Redirect setelah konfirmasi harus strictly same-origin; parameter token/auth dihapus dari URL redirect, token tidak pernah dicatat, dan respons callback mengirim `Cache-Control: no-store` serta `Referrer-Policy: no-referrer`.

Integration tests hanya boleh tersambung ke PostgreSQL dan Mailpit pada stack Docker lokal, melalui loopback (tes dari host dengan published ports yang terikat ke `127.0.0.1`) atau private Docker Compose network (aplikasi dalam container memakai hostname service). Tes memastikan setiap endpoint yang dikonfigurasi mengarah ke alamat loopback atau jaringan Compose privat dan gagal tertutup untuk endpoint publik, hosted, atau eksternal lainnya; tidak boleh fallback ke layanan hosted atau mock. Tes autentikasi mencakup registrasi belum terverifikasi, konfirmasi email, sign-in, sign-out lokal, input konfirmasi tidak valid, dan penolakan protected route. Tes kepemilikan mencakup baca dan update lintas pengguna, termasuk API routes. Kredensial produksi tidak diperlukan untuk tes dan tidak boleh di-commit.

## Perintah dan Struktur Proyek

MVP berjalan secara lokal melalui Docker. Perintah startup, development, build, migration, testing, serta struktur direktori tidak ditetapkan di sini karena harus mengikuti konfigurasi proyek yang berlaku; dokumen ini tidak mengasumsikan perintah atau susunan file tertentu.

## Gaya Kode

TypeScript; indentasi dua spasi; `camelCase` untuk variabel/fungsi; `PascalCase` untuk tipe/komponen. Validasi input dilakukan di batas sistem: form, API, CSV, webhook, dan upload.

```ts
type GuestRecipient = {
  name?: string;
  phoneE164: string;
  whatsappOptIn: boolean;
};

function canSendAutomatically(recipient: GuestRecipient): boolean {
  return recipient.whatsappOptIn;
}
```

## Strategi Pengujian Target

- **Unit:** aturan pembayaran dan akses editor, status pesanan, validasi field template, parser CSV, dan filter opt-in.
- **Integration:** PostgreSQL di Docker, webhook Midtrans sandbox, otorisasi admin, penyimpanan lokal pada volume, Mailpit, serta pengiriman WhatsApp di lingkungan uji.
- **E2E:** pilih template → checkout sandbox → pembayaran dikonfirmasi → isi data/foto → terbitkan tautan → bagikan/kirim kepada tamu opt-in, terhadap stack Docker lokal.
- Gate produksi ditangguhkan sampai keputusan hosting.

## Template dan Field Acara

Field bersama: judul/sapaan, tanggal dan waktu, nama serta alamat lokasi, tautan peta opsional, foto sampul, dan galeri foto.

- **Pernikahan:** nama pasangan; jadwal/lokasi akad atau upacara; jadwal/lokasi resepsi.
- **Ulang tahun:** nama yang berulang tahun; umur opsional; tanggal, waktu, dan lokasi acara.
- RSVP, guestbook, dan editor desain bebas di luar cakupan awal.

## CSV dan Retensi Data

CSV menggunakan header:

- `phone_e164` — wajib, format nomor internasional.
- `whatsapp_opt_in` — wajib, `true` atau `false`.
- `opted_in_at` — wajib untuk baris opt-in.
- `name` — opsional.

Saat impor, pelanggan menyatakan bahwa penerima yang ditandai opt-in telah menyetujui pesan. Nomor invalid atau tidak opt-in tidak dikirimi pesan otomatis. Sistem mencatat akun pengimpor dan waktu impor.

Daftar kontak serta status pengiriman dihapus 30 hari setelah acara; pelanggan dapat menghapusnya lebih awal. Data tidak digunakan untuk pemasaran.

## Foto dan Retensi Undangan

- Format: JPEG, PNG, WebP.
- Batas: maksimal 5 MiB per foto dan 5 foto per undangan.
- Foto disimpan pada volume Docker lokal. Draft privat disajikan melalui route aplikasi berautentikasi; aset undangan yang diterbitkan tersedia publik melalui route aplikasi. Saat di-unpublish, akses publik dicabut.
- Tautan undangan aktif sampai 30 hari setelah acara, lalu otomatis di-unpublish.
- Draft privat dan foto dipertahankan 90 hari setelah unpublish, lalu dihapus. Pelanggan dapat menghapus lebih awal.
- Data pesanan/pembayaran dipisahkan dari daftar kontak dan mengikuti kewajiban pencatatan yang berlaku.

## Batasan Produk

**Selalu**
- Validasi input, upload, CSV, webhook, dan respons layanan eksternal di server.
- Gunakan notifikasi server Midtrans sebagai sumber status pembayaran; redirect browser bukan bukti pembayaran.
- Periksa autentikasi dan kepemilikan pesanan/undangan pada setiap akses terlindungi.
- Kirim WhatsApp otomatis hanya kepada penerima opt-in menggunakan template yang disetujui.
- Lindungi secret di konfigurasi server; jangan log data tamu sensitif.
- Beri tahu pelanggan bahwa undangan terbit dan fotonya dapat dilihat siapa pun yang memiliki tautan.

**Minta persetujuan sebelum mengubah**
- Provider pembayaran, WhatsApp, hosting, atau penyimpanan lokal menjadi penyimpanan objek/cloud.
- Kategori data pribadi atau masa retensinya.
- Cakupan refund, RSVP, editor desain bebas, marketplace multi-vendor, atau pemasaran.
- Target deployment dari stack Docker lokal atau kombinasi TypeScript/Bun/Next.js/PostgreSQL.

**Jangan pernah**
- Menganggap redirect browser sebagai konfirmasi pembayaran.
- Mengubah status pembayaran menjadi berhasil secara manual.
- Mengirim pesan otomatis kepada kontak yang tidak opt-in.
- Menyimpan secret/API key di source control atau data kartu pembayaran di aplikasi.
- Menambahkan alur refund ke cakupan ini tanpa persetujuan baru.

## Kriteria Keberhasilan Produk

Kriteria berikut adalah target penerimaan produk, bukan pernyataan bahwa perilakunya saat ini sudah tersedia.

1. Pelanggan dapat membuat akun, memilih template pernikahan/ulang tahun, dan membuat pesanan.
2. Pelanggan dapat membayar melalui metode Midtrans yang sudah diaktifkan.
3. Editor dan publikasi hanya tersedia setelah status pembayaran dikonfirmasi server melalui notifikasi Midtrans.
4. Pelanggan dapat mengisi field template dan mengunggah foto tanpa editor desain bebas.
5. Undangan yang diterbitkan memiliki tautan publik yang dapat dibagikan; tamu tidak perlu akun.
6. Pelanggan dapat mengimpor CSV dan mengirim WhatsApp otomatis hanya kepada penerima opt-in dengan template yang disetujui. Tamu lain menerima tautan untuk dibagikan manual.
7. Admin dapat membuat, mengedit, menerbitkan, dan menonaktifkan template; admin dapat mengubah atau membatalkan pesanan.
8. Status pembayaran berasal dari provider dan tidak dapat ditandai “berhasil” secara manual oleh admin. Refund tidak tersedia dalam cakupan ini.

## Referensi Resmi

- Next.js App Router dan self-hosting: https://nextjs.org/docs/app
- Bun documentation: https://bun.sh/docs
- PostgreSQL documentation: https://www.postgresql.org/docs/
- Docker Compose: https://docs.docker.com/compose/
- Mailpit: https://github.com/mailpitdev/mailpit
- OWASP Session Management Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- MDN `Set-Cookie`: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie
- Midtrans Snap: https://docs.midtrans.com/docs/snap
- Midtrans webhooks: https://docs.midtrans.com/docs/https-notification-webhooks
- Meta WhatsApp Cloud API dan opt-in: https://developers.facebook.com/documentation/business-messaging/whatsapp/about-the-platform
- Meta WhatsApp message templates: https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/overview
