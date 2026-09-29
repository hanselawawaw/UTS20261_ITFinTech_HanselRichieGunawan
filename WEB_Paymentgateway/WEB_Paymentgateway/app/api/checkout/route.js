import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import Checkout from "@/models/Checkout";
import { calcTotals } from "@/lib/pricing";

// POST /api/checkout  body: { items: [{ productId, qty }] }
// Harga SELALU diambil dari database, bukan dari client.
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const rawItems = Array.isArray(body.items) ? body.items : [];

    const items = rawItems.filter(
      (i) => i && mongoose.isValidObjectId(i.productId) && Number.isInteger(i.qty) && i.qty > 0
    );
    if (items.length === 0) {
      return NextResponse.json({ message: "Keranjang kosong." }, { status: 400 });
    }

    const products = await Product.find({
      _id: { $in: items.map((i) => i.productId) },
      isActive: true,
    }).lean();
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    const lineItems = [];
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { message: "Ada produk yang sudah tidak tersedia. Hapus dari keranjang lalu coba lagi." },
          { status: 400 }
        );
      }
      lineItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        qty: item.qty,
        lineTotal: product.price * item.qty,
      });
    }

    const { subtotal, tax, total } = calcTotals(lineItems);
    const checkout = await Checkout.create({ items: lineItems, subtotal, tax, total });

    return NextResponse.json({ checkout }, { status: 201 });
  } catch (err) {
    console.error("POST /api/checkout", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
