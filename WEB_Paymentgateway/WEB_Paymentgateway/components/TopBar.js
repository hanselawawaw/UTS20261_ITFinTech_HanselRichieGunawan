import Link from "next/link";
import { ChevronLeftIcon } from "@/components/Icons";

// Header "< Back  Judul" untuk halaman Checkout & Payment
export default function TopBar({ backHref, title, icon }) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-line bg-white/95 px-4 py-3 backdrop-blur">
      <Link
        href={backHref}
        className="flex items-center gap-0.5 rounded-lg py-1 pr-2 text-sm font-medium text-muted hover:text-ink"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Back
      </Link>
      <h1 className="flex items-center gap-1.5 text-base font-bold">
        {icon}
        {title}
      </h1>
    </header>
  );
}
