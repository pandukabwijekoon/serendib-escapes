import Link from "next/link";

export function Footer() {
  return (
    <footer className="no-print border-t border-white/10 bg-[#070B09] px-6 py-14 text-white/75 sm:px-10">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-3">
        <div>
          <span className="font-serif text-2xl font-semibold text-white">
            Serendib Escapes
          </span>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/65">
            Comfortable hotels, private drivers, wildlife safaris, and beach
            holidays across Sri Lanka for both international visitors and local
            families.
          </p>
        </div>

        <div className="space-y-2 text-sm">
          <p className="text-sm font-semibold text-[#D4AF37]">
            Contact Us (Kandy Office)
          </p>
          <p>42 Dalada Veediya, Kandy 20000, Sri Lanka</p>
          <p>Phone / WhatsApp: +94 81 223 4890</p>
          <p>Email: hello@serendibescapes.lk</p>
        </div>

        <div className="flex flex-col justify-between md:items-end">
          <div className="flex flex-wrap gap-6 text-sm font-medium">
            <a href="#destinations" className="hover:text-[#D4AF37]">
              Destinations
            </a>
            <a href="#packages" className="hover:text-[#D4AF37]">
              Tour Packages
            </a>
            <Link href="/admin/login" className="hover:text-[#D4AF37]">
              Admin Login
            </Link>
          </div>
          <p className="mt-6 text-xs text-white/50">
            © {new Date().getFullYear()} Serendib Escapes. Built by{" "}
            <span className="font-medium text-[#D4AF37]/90">
              Zora Solutions
            </span>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
