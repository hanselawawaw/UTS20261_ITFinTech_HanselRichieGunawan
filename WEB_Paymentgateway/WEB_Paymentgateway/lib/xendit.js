const XENDIT_API = "https://api.xendit.co";

// Pilihan di halaman Payment -> metode yang ditampilkan di invoice Xendit
export const PAYMENT_METHOD_MAP = {
  card: ["CREDIT_CARD"],
  other: [
    "BCA", "BNI", "BRI", "MANDIRI", "PERMATA", "BSI",
    "OVO", "DANA", "SHOPEEPAY", "LINKAJA", "QRIS",
  ],
};

function authHeader() {
  const key = process.env.XENDIT_SECRET_KEY;
  if (!key) throw new Error("XENDIT_SECRET_KEY belum diisi di .env.local");
  // Xendit pakai Basic Auth: secret key sebagai username, password kosong
  return "Basic " + Buffer.from(key + ":").toString("base64");
}

export async function createInvoice(payload) {
  const res = await fetch(`${XENDIT_API}/v2/invoices`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || "Gagal membuat invoice Xendit");
    err.code = data.error_code;
    err.status = res.status;
    throw err;
  }
  return data; // { id, external_id, invoice_url, expiry_date, status, ... }
}
