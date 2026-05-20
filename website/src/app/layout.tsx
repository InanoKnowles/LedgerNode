import "./globals.css";
import type { Metadata, Viewport } from "next";
import { WalletProvider } from "@/lib/wallet";
import NamePrompt from "@/components/NamePrompt";

export const metadata: Metadata = {
  title: "LedgerNode — Own a piece of a home",
  description:
    "A friendlier way to own, sell, or rent a home. Share in a property from $100, earn rent automatically, or sell a slice of your own home without giving up the keys."
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#FBF7F0"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <WalletProvider>
          {children}
          <NamePrompt />
        </WalletProvider>
      </body>
    </html>
  );
}
