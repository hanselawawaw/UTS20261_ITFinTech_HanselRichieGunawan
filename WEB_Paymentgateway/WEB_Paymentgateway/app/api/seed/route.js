import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";

export const dynamic = "force-dynamic";

const SEED_PRODUCTS = [
  { name: "Matcha Latte", category: "Drinks", price: 28000, emoji: "🍵", description: "Matcha dengan susu segar" },
  { name: "Es Kopi Susu", category: "Drinks", price: 22000, emoji: "🧋", description: "Kopi susu gula aren" },
  { name: "Lemon Tea", category: "Drinks", price: 15000, emoji: "🍋", description: "Teh lemon dingin" },
  { name: "Air Mineral", category: "Drinks", price: 5000, emoji: "💧", description: "Botol 600 ml" },
  { name: "Keripik Singkong", category: "Snacks", price: 12000, emoji: "🥔", description: "Pedas manis, 100 gr" },
  { name: "Roti Bakar Cokelat", category: "Snacks", price: 18000, emoji: "🍞", description: "Isi cokelat keju" },
  { name: "Pisang Goreng", category: "Snacks", price: 10000, emoji: "🍌", description: "Isi 3, dengan gula halus" },
  { name: "Cookies Oat", category: "Snacks", price: 15000, emoji: "🍪", description: "Isi 4 keping" },
  { name: "Paket Ngopi", category: "Bundle", price: 35000, emoji: "☕", description: "Es kopi susu + roti bakar" },
  { name: "Paket Nongkrong", category: "Bundle", price: 45000, emoji: "🎉", description: "2 minuman + keripik singkong" },
  { name: "Paket Hemat", category: "Bundle", price: 25000, emoji: "🎁", description: "Lemon tea + pisang goreng" },
];

// Buka sekali di browser: http://localhost:3000/api/seed
// Tambahkan ?reset=1 untuk menghapus lalu mengisi ulang produk.
// Hapus / amankan route ini sebelum deploy ke production.
export async function GET(req) {
  try {
    await connectDB();
    const reset = new URL(req.url).searchParams.get("reset") === "1";

    if (reset) await Product.deleteMany({});
    const count = await Product.countDocuments();
    if (count > 0) {
      return NextResponse.json({ message: `Sudah ada ${count} produk. Pakai ?reset=1 untuk isi ulang.` });
    }

    const inserted = await Product.insertMany(SEED_PRODUCTS);
    return NextResponse.json({ message: `Berhasil menambahkan ${inserted.length} produk.` });
  } catch (err) {
    console.error("GET /api/seed", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
