import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { Shell } from "@/components/Shell";
import { LanguageProvider } from "@/lib/i18n";
import { property } from "@/lib/property";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-serif" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "L'évasion | Yacht-gîte à Ladeuze",
  description:
    "Yacht amarré à la halte nautique de Ladeuze, près de Chièvres et de Pairi Daiza. Jusqu'à 6 voyageurs. Réservation en ligne.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LodgingBusiness",
  name: property.name,
  description: "Yacht-gîte amarré à la halte nautique de Ladeuze.",
  telephone: property.phone,
  email: property.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: property.address,
    postalCode: property.postalCode,
    addressLocality: property.locality,
    addressRegion: "Hainaut",
    addressCountry: "BE",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: property.lat,
    longitude: property.lng,
  },
  checkinTime: property.checkIn,
  checkoutTime: property.checkOut,
  petsAllowed: false,
  smokingAllowed: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${outfit.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <LanguageProvider>
          <Shell>{children}</Shell>
        </LanguageProvider>
      </body>
    </html>
  );
}
