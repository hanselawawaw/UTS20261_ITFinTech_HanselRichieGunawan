# WEB_Paymentgateway

Next.js (App Router) + MongoDB (Mongoose) + Xendit Invoice + Webhook.

## Alur
1. `/` **Select Item** – pilih produk per kategori (All / Drinks / Snacks / Bundle), cari, Add +
2. `/checkout` **Checkout** – ubah qty, lihat subtotal, PPN 11%, total → *Continue to Payment* (disimpan ke koleksi `checkouts`)
3. `/payment/[id]` **Payment** – isi alamat, pilih metode → *Confirm & Pay* → invoice Xendit dibuat (koleksi `payments`) → redirect ke halaman tagihan Xendit
4. Setelah bayar, Xendit memanggil `POST /api/webhook/xendit` → status `payments` jadi `PAID` dan `checkouts` jadi `LUNAS`
5. `/status/[id]` menampilkan tagihan & status (auto-refresh tiap 3 detik)

## Struktur database (MongoDB)
| Koleksi | Isi |
|---|---|
| `products` | name, description, price, category, emoji, stock, isActive |
| `checkouts` | items[] (snapshot nama/harga/qty), subtotal, tax, total, status, paidAt |
| `payments` | checkout (ref), externalId, xenditInvoiceId, invoiceUrl, amount, shippingAddress, selectedMethod, paidMethod, paidChannel, status, paidAt, expiryDate, webhookPayload |

## Setup
```bash
npm install
cp .env.example .env.local   # lalu isi nilainya
npm run dev
```
Buka `http://localhost:3000/api/seed` sekali untuk mengisi produk contoh.

## Webhook di lokal
```bash
ngrok http 3000
```
Isi URL `https://xxxx.ngrok-free.app/api/webhook/xendit` di Dashboard Xendit → Settings → Webhooks → **Invoices paid** (centang juga notifikasi invoice expired).

Tes manual tanpa Xendit (ganti TOKEN dan externalId dari koleksi `payments`):
```bash
curl -X POST http://localhost:3000/api/webhook/xendit \
  -H "Content-Type: application/json" \
  -H "x-callback-token: TOKEN" \
  -d '{"external_id":"WEBPG-xxxx-xxxx","status":"PAID","payment_method":"BANK_TRANSFER","payment_channel":"BCA"}'
```

## Endpoint API
| Method | Path | Fungsi |
|---|---|---|
| GET | `/api/products?category=&q=` | daftar produk |
| GET | `/api/seed` | isi produk contoh (hapus sebelum production) |
| POST | `/api/checkout` | buat checkout dari keranjang |
| GET | `/api/checkout/[id]` | detail checkout + payment |
| POST | `/api/payment` | buat invoice Xendit |
| POST | `/api/webhook/xendit` | callback status dari Xendit |
