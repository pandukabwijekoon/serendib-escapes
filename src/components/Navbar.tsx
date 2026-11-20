"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";

interface NavbarProps {
  onOpenBooking: () => void;
}

export function Navbar({ onOpenBooking }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="no-print fixed inset-x-0 top-0 z-40 px-3 py-3 sm:px-8 sm:py-4">
      <nav
        aria-label="Primary Navigation"
        className="glass-panel mx-auto flex max-w-7xl items-center justify-between rounded-full px-4 py-2.5 shadow-2xl shadow-black/50 sm:px-6 sm:py-3"
      >
        <Link
          href="/"
          onClick={() => setMobileMenuOpen(false)}
          className="text-white transition-opacity hover:opacity-90"
        >
          <div className="leading-tight">
            <span className="block font-serif text-lg font-semibold tracking-wide text-white sm:text-xl">
              Serendib Escapes
            </span>
            <span className="block text-[10px] font-medium text-[#D4AF37]/90 sm:text-[11px]">
              Sri Lanka Tours &amp; Hotels
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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenBooking();
            }}
            className="rounded-full border border-[#D4AF37]/60 bg-[#D4AF37] px-4 py-1.5 text-xs font-semibold text-[#0A0F0D] shadow-lg shadow-[#D4AF37]/20 transition-all hover:bg-[#E5C158] active:scale-[0.98] sm:px-5 sm:py-2 sm:text-sm"
          >
            Book Now
          </button>

          <button
            type="button"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:border-[#D4AF37] md:hidden"
          >
            {mobileMenuOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Dropdown Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="glass-panel mx-auto mt-2 max-w-7xl overflow-hidden rounded-2xl p-4 shadow-2xl md:hidden"
          >
            <div className="flex flex-col space-y-1 text-sm font-medium text-white/90">
              <a
                href="#journey"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-3 py-2.5 transition hover:bg-white/10 hover:text-[#D4AF37]"
              >
                How We Travel
              </a>
              <a
                href="#destinations"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-3 py-2.5 transition hover:bg-white/10 hover:text-[#D4AF37]"
              >
                Destinations
              </a>
              <a
                href="#packages"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-3 py-2.5 transition hover:bg-white/10 hover:text-[#D4AF37]"
              >
                Tour Packages
              </a>
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-3 py-2.5 transition hover:bg-white/10 hover:text-[#D4AF37]"
              >
                Admin Login
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
