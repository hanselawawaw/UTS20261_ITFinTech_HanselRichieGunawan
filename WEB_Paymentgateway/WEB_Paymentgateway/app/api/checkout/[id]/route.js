import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Checkout from "@/models/Checkout";
import Payment from "@/models/Payment";

export const dynamic = "force-dynamic";

// GET /api/checkout/:id -> data pesanan + pembayaran (dipakai halaman Payment & Status)
export async function GET(req, { params }) {
  try {
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ message: "Pesanan tidak ditemukan." }, { status: 404 });
    }

    await connectDB();
    const checkout = await Checkout.findById(id).lean();
    if (!checkout) {
      return NextResponse.json({ message: "Pesanan tidak ditemukan." }, { status: 404 });
    }

    // Utamakan pembayaran yang sudah PAID, kalau tidak ada ambil yang terbaru
    const payment =
      (await Payment.findOne({ checkout: id, status: "PAID" }).select("-webhookPayload").lean()) ||
      (await Payment.findOne({ checkout: id }).sort({ createdAt: -1 }).select("-webhookPayload").lean());

    return NextResponse.json({ checkout, payment });
  } catch (err) {
    console.error("GET /api/checkout/[id]", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
