"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import TopBar from "@/components/TopBar";
import { calcTotals, formatRupiah } from "@/lib/pricing";

// Halaman 2: Checkout
export default function CheckoutPage() {
  const router = useRouter();
  const { items, ready, updateQty, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { subtotal, tax, total } = calcTotals(items);

  async function handleContinue() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: items.map((i) => ({ productId: i.productId, qty: i.qty })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Checkout gagal dibuat.");

      router.push(`/payment/${data.checkout._id}`);
      clearCart();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  if (!ready) return <TopBar backHref="/" title="Checkout" />;

  if (items.length === 0 && !loading) {
    return (
      <>
        <TopBar backHref="/" title="Checkout" />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <p className="text-muted">Keranjang masih kosong.</p>
          <Link href="/" className="rounded-xl bg-brand px-5 py-2.5 font-semibold text-white">
            Pilih produk
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar backHref="/" title="Checkout" />

      <main className="flex-1">
        <ul className="divide-y divide-line">
          {items.map((item) => (
            <li key={item.productId} className="flex items-center gap-4 p-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-3xl" aria-hidden>
                {item.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{item.name}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex items-center overflow-hidden rounded-lg border border-line">
                    <button
                      type="button"
                      onClick={() => updateQty(item.productId, item.qty - 1)}
                      aria-label={`Kurangi ${item.name}`}
                      className="px-3 py-1 text-lg leading-none hover:bg-surface"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-semibold tabular-nums">{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => updateQty(item.productId, item.qty + 1)}
                      aria-label={`Tambah ${item.name}`}
                      className="px-3 py-1 text-lg leading-none hover:bg-surface"
                    >
                      +
                    </button>
                  </div>
                  <span className="font-semibold tabular-nums">{formatRupiah(item.price * item.qty)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <dl className="space-y-2 border-t border-line p-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd className="tabular-nums">{formatRupiah(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Tax (PPN 11%)</dt>
            <dd className="tabular-nums">{formatRupiah(tax)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2 text-base font-bold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatRupiah(total)}</dd>
          </div>
        </dl>
      </main>

      <div className="sticky bottom-0 space-y-2 border-t border-line bg-white p-4">
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button
          type="button"
          onClick={handleContinue}
          disabled={loading}
          className="w-full rounded-xl border-2 border-brand py-3 font-semibold text-brand hover:bg-brand hover:text-white disabled:opacity-60"
        >
          {loading ? "Menyimpan pesanan…" : "Continue to Payment"}
        </button>
      </div>
    </>
  );
}
