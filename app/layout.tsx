import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QB DASHBOARD — Grow a Garden 2 Business Management",
  description: "Professional business management dashboard for Roblox Grow a Garden 2. Track products, inventory, transactions, RF devices, and financial reports.",
  keywords: ["roblox", "grow a garden", "business", "dashboard", "management"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
