import mongoose, { Schema } from "mongoose";

const ShippingAddressSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
  },
  { _id: false }
);

const PaymentSchema = new Schema(
  {
    checkout: { type: Schema.Types.ObjectId, ref: "Checkout", required: true, index: true },
    externalId: { type: String, required: true, unique: true }, // dikirim ke Xendit
    xenditInvoiceId: { type: String, index: true },
    invoiceUrl: { type: String },
    amount: { type: Number, required: true }, // total + ongkir
    shippingCost: { type: Number, default: 0 },
    selectedMethod: { type: String, enum: ["card", "paypal", "other"] },
    paidMethod: { type: String }, // dari webhook, mis. BANK_TRANSFER / EWALLET
    paidChannel: { type: String }, // dari webhook, mis. BCA / OVO
    shippingAddress: { type: ShippingAddressSchema, required: true },
    status: {
      type: String,
      enum: ["PENDING", "PAID", "EXPIRED", "FAILED"],
      default: "PENDING",
      index: true,
    },
    paidAt: { type: Date },
    expiryDate: { type: Date },
    webhookPayload: { type: Schema.Types.Mixed }, // payload terakhir untuk audit
  },
  { timestamps: true }
);

export default mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);
