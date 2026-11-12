import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WalletProvider } from "@/components/wallet";
import { CanonDataProvider } from "@/components/canon-data";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const description =
  "Canon turns creative works into NEAR NFTs that own keyless vaults. Derivatives join a lineage with the original's approval, and every licence and resale pays the whole family tree in one transaction.";

export const metadata: Metadata = {
  metadataBase: new URL("https://canon.bootstate.xyz"),
  title: { default: "Canon — the rights layer for creative IP", template: "%s" },
  description,
  applicationName: "Canon",
  keywords: ["NEAR", "NFT", "creative IP", "licensing", "royalties", "NEP-171", "NEP-199", "derivatives"],
  openGraph: {
    type: "website",
    url: "https://canon.bootstate.xyz",
    siteName: "Canon",
    title: "Canon — creative IP that pays its whole family tree",
    description,
  },
  twitter: { card: "summary_large_image", title: "Canon — creative IP that pays its whole family tree", description },
};

export const viewport: Viewport = { themeColor: "#07080a", colorScheme: "dark" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <WalletProvider>
          <CanonDataProvider>
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </CanonDataProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
