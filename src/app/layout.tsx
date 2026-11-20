import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Serendib Escapes | Bespoke Luxury Sri Lanka Journeys",
  description:
    "Curated private villas, helicopter transfers, wildlife safaris, and coastal sanctuaries across Sri Lanka. Crafted by Zora Solutions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="robots" content="noai, noimageai" />
        <meta name="tdm-reservation" content="1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#0A0F0D] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
