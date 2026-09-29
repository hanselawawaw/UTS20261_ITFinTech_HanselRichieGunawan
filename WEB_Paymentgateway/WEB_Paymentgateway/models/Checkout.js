import mongoose, { Schema } from "mongoose";

const CheckoutItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true },
  },
  { _id: false }
);

const CheckoutSchema = new Schema(
  {
    items: { type: [CheckoutItemSchema], required: true },
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    total: { type: Number, required: true }, // subtotal + tax (belum ongkir)
    status: {
      type: String,
      enum: ["MENUNGGU_KONFIRMASI", "MENUNGGU_PEMBAYARAN", "LUNAS", "KEDALUWARSA"],
      default: "MENUNGGU_KONFIRMASI",
      index: true,
    },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.Checkout || mongoose.model("Checkout", CheckoutSchema);
