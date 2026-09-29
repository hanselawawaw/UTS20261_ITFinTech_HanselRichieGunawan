// Dipakai di client (tampilan) DAN server (perhitungan resmi)
export const TAX_RATE = 0.11; // PPN 11%
export const SHIPPING_COST = 15000; // ongkir flat
export const CATEGORIES = ["All", "Drinks", "Snacks", "Bundle"];

export function calcTotals(items) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const tax = Math.round(subtotal * TAX_RATE);
  return { subtotal, tax, total: subtotal + tax };
}

export function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export const STATUS_LABEL = {
  MENUNGGU_KONFIRMASI: "Menunggu konfirmasi",
  MENUNGGU_PEMBAYARAN: "Menunggu pembayaran",
  LUNAS: "Lunas",
  KEDALUWARSA: "Kedaluwarsa",
};
