import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Checkout from "@/models/Checkout";
import Payment from "@/models/Payment";
import { SHIPPING_COST } from "@/lib/pricing";
import { createInvoice, PAYMENT_METHOD_MAP } from "@/lib/xendit";

const ADDRESS_FIELDS = ["name", "email", "phone", "address", "city", "postalCode"];

// POST /api/payment  body: { checkoutId, shippingAddress, paymentMethod }
// Membuat tagihan (invoice) di Xendit lalu mengembalikan invoiceUrl.
export async function POST(req) {
  try {
    await connectDB();
    const { checkoutId, shippingAddress = {}, paymentMethod = "other" } = await req.json();

    if (!mongoose.isValidObjectId(checkoutId)) {
      return NextResponse.json({ message: "Pesanan tidak ditemukan." }, { status: 404 });
    }

    const address = {};
    for (const field of ADDRESS_FIELDS) {
      const value = String(shippingAddress[field] || "").trim();
      if (!value) {
        return NextResponse.json({ message: "Lengkapi semua data alamat pengiriman." }, { status: 400 });
      }
      address[field] = value;
    }

    if (paymentMethod === "paypal") {
      return NextResponse.json(
        { message: "PayPal belum tersedia untuk pembayaran Rupiah. Pilih metode lain." },
        { status: 400 }
      );
    }
    if (!PAYMENT_METHOD_MAP[paymentMethod]) {
      return NextResponse.json({ message: "Metode pembayaran tidak dikenal." }, { status: 400 });
    }

    const checkout = await Checkout.findById(checkoutId);
    if (!checkout) {
      return NextResponse.json({ message: "Pesanan tidak ditemukan." }, { status: 404 });
    }
    if (checkout.status === "LUNAS") {
      return NextResponse.json({ message: "Pesanan ini sudah lunas." }, { status: 409 });
    }

    const amount = checkout.total + SHIPPING_COST;
    const externalId = `WEBPG-${checkout._id}-${Date.now()}`;
    const baseUrl = process.env.BASE_URL || new URL(req.url).origin;
    const orderCode = String(checkout._id).slice(-6).toUpperCase();

    const payload = {
      external_id: externalId,
      amount,
      currency: "IDR",
      payer_email: address.email,
      description: `Pembayaran pesanan #${orderCode}`,
      invoice_duration: 86400, // 24 jam
      success_redirect_url: `${baseUrl}/status/${checkout._id}`,
      failure_redirect_url: `${baseUrl}/status/${checkout._id}`,
      items: checkout.items.map((i) => ({ name: i.name, quantity: i.qty, price: i.price })),
      fees: [
        { type: "PPN 11%", value: checkout.tax },
        { type: "Ongkos kirim", value: SHIPPING_COST },
      ],
      payment_methods: PAYMENT_METHOD_MAP[paymentMethod],
    };

    let invoice;
    try {
      invoice = await createInvoice(payload);
    } catch (err) {
      if (err.status === 401 || err.status === 403) throw err; // secret key salah -> jangan retry
      // Kalau metode tertentu belum aktif di akun Xendit, ulangi tanpa membatasi metode
      console.warn("Invoice dengan payment_methods gagal, ulangi tanpa filter:", err.message);
      const { payment_methods, ...rest } = payload;
      invoice = await createInvoice(rest);
    }

    const payment = await Payment.create({
      checkout: checkout._id,
      externalId,
      xenditInvoiceId: invoice.id,
      invoiceUrl: invoice.invoice_url,
      amount,
      shippingCost: SHIPPING_COST,
      selectedMethod: paymentMethod,
      shippingAddress: address,
      status: "PENDING",
      expiryDate: invoice.expiry_date,
    });

    checkout.status = "MENUNGGU_PEMBAYARAN";
    await checkout.save();

    return NextResponse.json({ invoiceUrl: invoice.invoice_url, paymentId: payment._id }, { status: 201 });
  } catch (err) {
    console.error("POST /api/payment", err);
    return NextResponse.json({ message: err.message }, { status: err.status || 500 });
  }
}
