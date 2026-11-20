"use client";

import Link from "next/link";

interface NavbarProps {
  onOpenBooking: () => void;
}

export function Navbar({ onOpenBooking }: NavbarProps) {
  return (
    <header className="no-print fixed inset-x-0 top-0 z-40 px-4 py-4 sm:px-8">
      <nav
        aria-label="Primary Navigation"
        className="glass-panel mx-auto flex max-w-7xl items-center justify-between rounded-full px-6 py-3 shadow-2xl shadow-black/50"
      >
        <Link
          href="/"
          className="text-white transition-opacity hover:opacity-90"
        >
          <div className="leading-tight">
            <span className="block font-serif text-xl font-semibold tracking-wide text-white">
              Serendib Escapes
            </span>
            <span className="block text-[11px] font-medium text-[#D4AF37]/90">
              Sri Lanka Tours & Hotels
            </span>
          </div>
        </Link>

        <div className="hidden items-center gap-8 text-sm font-medium text-white/85 md:flex">
          <a
            href="#journey"
            className="transition-colors hover:text-[#D4AF37]"
          >
            How We Travel
          </a>
          <a
            href="#destinations"
            className="transition-colors hover:text-[#D4AF37]"
          >
            Destinations
          </a>
          <a
            href="#packages"
            className="transition-colors hover:text-[#D4AF37]"
          >
            Tour Packages
          </a>
          <Link
            href="/admin"
            className="transition-colors hover:text-[#D4AF37]"
          >
            Admin Login
          </Link>
        </div>

        <button
          type="button"
          onClick={onOpenBooking}
          className="rounded-full border border-[#D4AF37]/60 bg-[#D4AF37] px-5 py-2 text-sm font-semibold text-[#0A0F0D] shadow-lg shadow-[#D4AF37]/20 transition-all hover:bg-[#E5C158] active:scale-[0.98]"
        >
          Book Now
        </button>
      </nav>
    </header>
  );
}
