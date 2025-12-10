import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./style.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "StrategyHub | Discover Which YouTube Strategies Actually Work.",
  description: "Verify popular trading strategies with real backtest data before you risk a dime.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body 
        className={`${inter.className} bg-white text-gray-900`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}