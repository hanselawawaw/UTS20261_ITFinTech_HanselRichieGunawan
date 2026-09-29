import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Payment from "@/models/Payment";
import Checkout from "@/models/Checkout";

// POST /api/webhook/xendit
// Dipanggil otomatis oleh Xendit saat invoice PAID / EXPIRED.
export async function POST(req) {
  // 1. Pastikan request benar-benar dari Xendit
  const token = req.headers.get("x-callback-token");
  if (!process.env.XENDIT_WEBHOOK_TOKEN || token !== process.env.XENDIT_WEBHOOK_TOKEN) {
    return NextResponse.json({ message: "Invalid callback token" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  try {
    await connectDB();
    const { external_id: externalId, status } = body;

    const payment = await Payment.findOne({ externalId });
    if (!payment) {
      // Tetap balas 200 (mis. saat tombol "Test" di dashboard Xendit) supaya tidak di-retry
      return NextResponse.json({ message: "Payment tidak ditemukan, diabaikan." });
    }

    // Idempotent: kalau sudah lunas, jangan diproses ulang
    if (payment.status === "PAID") {
      return NextResponse.json({ message: "Sudah lunas sebelumnya." });
    }

    if (status === "PAID" || status === "SETTLED") {
      payment.status = "PAID";
      payment.paidAt = body.paid_at ? new Date(body.paid_at) : new Date();
      payment.paidMethod = body.payment_method;
      payment.paidChannel = body.payment_channel;
      payment.webhookPayload = body;
      await payment.save();

      // 2. Status pesanan otomatis jadi LUNAS
      await Checkout.findByIdAndUpdate(payment.checkout, {
        status: "LUNAS",
        paidAt: payment.paidAt,
      });
    } else if (status === "EXPIRED") {
      payment.status = "EXPIRED";
      payment.webhookPayload = body;
      await payment.save();

      const stillActive = await Payment.exists({
        checkout: payment.checkout,
        status: { $in: ["PENDING", "PAID"] },
      });
      if (!stillActive) {
        await Checkout.updateOne(
          { _id: payment.checkout, status: { $ne: "LUNAS" } },
          { status: "KEDALUWARSA" }
        );
      }
    }

    return NextResponse.json({ message: "OK" });
  } catch (err) {
    console.error("Webhook Xendit error", err);
    // Balas 500 supaya Xendit mengirim ulang
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
