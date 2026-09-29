"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import TopBar from "@/components/TopBar";
import { formatRupiah, SHIPPING_COST, STATUS_LABEL } from "@/lib/pricing";

const BADGE_CLASS = {
  LUNAS: "bg-brand text-white",
  MENUNGGU_PEMBAYARAN: "bg-accent text-ink",
  MENUNGGU_KONFIRMASI: "bg-surface text-ink",
  KEDALUWARSA: "bg-red-100 text-red-800",
};

// Halaman tagihan & status pembayaran (tujuan redirect dari Xendit)
export default function StatusPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let stopped = false;
    let timer;

    async function load() {
      try {
        const res = await fetch(`/api/checkout/${id}`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Pesanan tidak ditemukan.");
        if (stopped) return;
        setData(json);
        // Terus cek setiap 3 detik sampai status final (diubah oleh webhook)
        const final = ["LUNAS", "KEDALUWARSA"].includes(json.checkout.status);
        if (!final) timer = setTimeout(load, 3000);
      } catch (err) {
        if (!stopped) setError(err.message);
      }
    }

    load();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [id]);

  if (error) {
    return (
      <>
        <TopBar backHref="/" title="Tagihan" />
        <p className="m-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <TopBar backHref="/" title="Tagihan" />
        <p className="p-8 text-center text-sm text-muted">Memuat tagihan…</p>
      </>
    );
  }

  const { checkout, payment } = data;
  const status = checkout.status;
  const paid = status === "LUNAS";
  const amount = payment?.amount ?? checkout.total + SHIPPING_COST;

  return (
    <>
      <TopBar backHref="/" title="Tagihan" />

      <main className="flex-1 space-y-6 p-4">
        <section className="rounded-2xl border border-line p-5 text-center">
          <p className="text-sm text-muted">Pesanan #{String(checkout._id).slice(-6).toUpperCase()}</p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums">{formatRupiah(amount)}</p>
          <span className={`mt-3 inline-block rounded-full px-3 py-1 text-sm font-bold ${BADGE_CLASS[status]}`}>
            {STATUS_LABEL[status]}
          </span>
          {!paid && status === "MENUNGGU_PEMBAYARAN" && (
            <p className="mt-3 text-xs text-muted">Status berubah otomatis begitu pembayaran diterima.</p>
          )}
          {paid && payment?.paidAt && (
            <p className="mt-3 text-xs text-muted">
              Dibayar {new Date(payment.paidAt).toLocaleString("id-ID")}
              {payment.paidChannel ? ` via ${payment.paidChannel}` : ""}
            </p>
          )}
        </section>

        <section>
          <h2 className="mb-2 font-bold">Rincian</h2>
          <ul className="space-y-1.5 text-sm">
            {checkout.items.map((item, idx) => (
              <li key={idx} className="flex justify-between gap-2">
                <span>
                  {item.name} <span className="text-muted">× {item.qty}</span>
                </span>
                <span className="tabular-nums">{formatRupiah(item.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="tabular-nums">{formatRupiah(checkout.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">PPN 11%</dt>
              <dd className="tabular-nums">{formatRupiah(checkout.tax)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Ongkos kirim</dt>
              <dd className="tabular-nums">{formatRupiah(payment?.shippingCost ?? SHIPPING_COST)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2 text-base font-bold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatRupiah(amount)}</dd>
            </div>
          </dl>
        </section>
      </main>

      <div className="sticky bottom-0 space-y-2 border-t border-line bg-white p-4">
        {status === "MENUNGGU_PEMBAYARAN" && payment?.invoiceUrl && (
          <a href={payment.invoiceUrl} className="block rounded-xl bg-brand py-3 text-center font-semibold text-white hover:bg-brand-dark">
            Bayar tagihan
          </a>
        )}
        {(status === "MENUNGGU_KONFIRMASI" || status === "KEDALUWARSA") && (
          <Link href={`/payment/${checkout._id}`} className="block rounded-xl bg-brand py-3 text-center font-semibold text-white hover:bg-brand-dark">
            Buat tagihan baru
          </Link>
        )}
        <Link href="/" className="block rounded-xl border border-line py-3 text-center font-semibold hover:bg-surface">
          Belanja lagi
        </Link>
      </div>
    </>
  );
}
