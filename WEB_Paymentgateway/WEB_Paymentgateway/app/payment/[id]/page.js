"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import TopBar from "@/components/TopBar";
import { LockIcon } from "@/components/Icons";
import { formatRupiah, SHIPPING_COST } from "@/lib/pricing";

const METHODS = [
  { value: "card", label: "Credit/Debit Card" },
  { value: "paypal", label: "PayPal", note: "Belum tersedia untuk Rupiah", disabled: true },
  { value: "other", label: "Other (e.g. E-Wallet, Bank Transfer)" },
];

const EMPTY_ADDRESS = { name: "", email: "", phone: "", address: "", city: "", postalCode: "" };

// Halaman 3: Payment
export default function PaymentPage() {
  const { id } = useParams();
  const router = useRouter();
  const [checkout, setCheckout] = useState(null);
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [method, setMethod] = useState("card");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/checkout/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Pesanan tidak ditemukan.");
        if (data.checkout.status === "LUNAS") {
          router.replace(`/status/${id}`);
          return;
        }
        setCheckout(data.checkout);
        if (data.payment?.shippingAddress) setAddress({ ...EMPTY_ADDRESS, ...data.payment.shippingAddress });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, router]);

  function updateField(e) {
    setAddress((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleConfirm(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkoutId: id, shippingAddress: address, paymentMethod: method }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Tagihan gagal dibuat.");
      // Arahkan ke halaman tagihan Xendit
      window.location.href = data.invoiceUrl;
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  const grandTotal = checkout ? checkout.total + SHIPPING_COST : 0;
  const inputClass =
    "w-full rounded-xl border border-line px-3 py-2.5 text-sm outline-none placeholder:text-muted focus:border-brand";

  return (
    <>
      <TopBar backHref="/checkout" title="Secure Checkout" icon={<LockIcon className="h-4 w-4 text-brand" />} />

      {loading && <p className="p-8 text-center text-sm text-muted">Memuat pesanan…</p>}

      {!loading && !checkout && (
        <p className="m-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      {checkout && (
        <form onSubmit={handleConfirm} className="flex flex-1 flex-col">
          <main className="flex-1 space-y-6 p-4">
            <section className="space-y-2.5">
              <h2 className="font-bold">Shipping Address</h2>
              <input name="name" value={address.name} onChange={updateField} placeholder="Nama penerima" required className={inputClass} />
              <div className="grid grid-cols-2 gap-2.5">
                <input name="email" type="email" value={address.email} onChange={updateField} placeholder="Email" required className={inputClass} />
                <input name="phone" type="tel" value={address.phone} onChange={updateField} placeholder="No. HP" required className={inputClass} />
              </div>
              <textarea name="address" value={address.address} onChange={updateField} placeholder="Alamat lengkap" rows={2} required className={inputClass} />
              <div className="grid grid-cols-2 gap-2.5">
                <input name="city" value={address.city} onChange={updateField} placeholder="Kota" required className={inputClass} />
                <input name="postalCode" inputMode="numeric" value={address.postalCode} onChange={updateField} placeholder="Kode pos" required className={inputClass} />
              </div>
            </section>

            <fieldset className="space-y-2">
              <legend className="mb-2.5 font-bold">Payment Method</legend>
              {METHODS.map((m) => (
                <label
                  key={m.value}
                  className={`flex items-start gap-3 rounded-xl border p-3 text-sm ${
                    method === m.value ? "border-brand bg-brand-soft" : "border-line"
                  } ${m.disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                >
                  <input
                    type="radio"
                    name="method"
                    value={m.value}
                    checked={method === m.value}
                    onChange={() => setMethod(m.value)}
                    disabled={m.disabled}
                    className="mt-0.5 accent-brand"
                  />
                  <span>
                    {m.label}
                    {m.note && <span className="block text-xs text-muted">{m.note}</span>}
                  </span>
                </label>
              ))}
            </fieldset>

            <section>
              <h2 className="mb-2.5 font-bold">Order Summary</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Item(s) + PPN</dt>
                  <dd className="tabular-nums">{formatRupiah(checkout.total)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Shipping</dt>
                  <dd className="tabular-nums">{formatRupiah(SHIPPING_COST)}</dd>
                </div>
                <div className="flex justify-between border-t border-line pt-2 text-base font-bold">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{formatRupiah(grandTotal)}</dd>
                </div>
              </dl>
            </section>
          </main>

          <div className="sticky bottom-0 space-y-2 border-t border-line bg-white p-4">
            {error && <p className="text-sm text-red-700">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-brand py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
            >
              {submitting ? "Membuat tagihan…" : "Confirm & Pay"}
            </button>
          </div>
        </form>
      )}
    </>
  );
}
