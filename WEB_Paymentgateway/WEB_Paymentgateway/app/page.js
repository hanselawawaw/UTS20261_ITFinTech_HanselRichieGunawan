"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { CartIcon, MenuIcon, SearchIcon } from "@/components/Icons";
import { CATEGORIES, formatRupiah } from "@/lib/pricing";

// Halaman 1: Select Item
export default function SelectItemPage() {
  const { items, count, addItem } = useCart();
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (category !== "All") params.set("category", category);
        if (query.trim()) params.set("q", query.trim());
        const res = await fetch(`/api/products?${params}`, { signal: controller.signal });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Produk gagal dimuat.");
        setProducts(data.products);
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250); // debounce pencarian

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [category, query]);

  const qtyInCart = (id) => items.find((i) => i.productId === String(id))?.qty || 0;

  return (
    <>
      <header className="sticky top-0 z-10 space-y-3 border-b border-line bg-white/95 px-4 pt-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Menu" className="rounded-lg bg-surface p-2 text-ink">
              <MenuIcon className="h-5 w-5" />
            </button>
            <span className="text-lg font-extrabold tracking-tight text-brand">whelen_ion</span>
          </div>
          <Link href="/checkout" aria-label={`Keranjang, ${count} item`} className="relative rounded-lg p-2 text-ink">
            <CartIcon className="h-6 w-6" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-ink">
                {count}
              </span>
            )}
          </Link>
        </div>

        <label className="flex items-center gap-2 rounded-xl border border-line px-3 py-2.5 focus-within:border-brand">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
          />
          <SearchIcon className="h-4 w-4 shrink-0 text-muted" />
        </label>

        <nav className="no-scrollbar -mx-4 flex gap-5 overflow-x-auto px-4" aria-label="Kategori">
          {CATEGORIES.map((cat) => {
            const active = cat === category;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                aria-pressed={active}
                className={`shrink-0 border-b-2 pb-2.5 text-sm font-semibold transition-colors ${
                  active ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="flex-1 space-y-3 p-4">
        {error && (
          <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error} Cek koneksi MongoDB di .env.local, lalu muat ulang halaman.
          </p>
        )}

        {loading && !error && <p className="py-10 text-center text-sm text-muted">Memuat produk…</p>}

        {!loading && !error && products.length === 0 && (
          <div className="py-10 text-center text-sm text-muted">
            <p>Belum ada produk di kategori ini.</p>
            <p className="mt-1">
              Isi data contoh lewat{" "}
              <a href="/api/seed" className="font-semibold text-brand underline">
                /api/seed
              </a>
              .
            </p>
          </div>
        )}

        {!loading &&
          products.map((p) => {
            const inCart = qtyInCart(p._id);
            return (
              <article key={p._id} className="flex gap-4 rounded-2xl border border-line p-3">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-4xl" aria-hidden>
                  {p.emoji}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <h2 className="font-semibold leading-snug">{p.name}</h2>
                  <p className="mt-0.5 font-bold text-brand">{formatRupiah(p.price)}</p>
                  <p className="mt-0.5 truncate text-xs text-muted">{p.description}</p>
                  <button
                    type="button"
                    onClick={() => addItem(p)}
                    className="mt-auto self-end rounded-lg border border-brand px-3 py-1.5 text-sm font-semibold text-brand transition-colors hover:bg-brand hover:text-white active:scale-95"
                  >
                    {inCart > 0 ? `Add + (${inCart})` : "Add +"}
                  </button>
                </div>
              </article>
            );
          })}
      </main>

      {count > 0 && (
        <div className="sticky bottom-0 border-t border-line bg-white p-4">
          <Link
            href="/checkout"
            className="block rounded-xl bg-brand py-3 text-center font-semibold text-white hover:bg-brand-dark"
          >
            Lihat keranjang ({count} item)
          </Link>
        </div>
      )}
    </>
  );
}
