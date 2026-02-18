import type { Metadata } from "next";
import { Lato } from "next/font/google";
import "./globals.css";

const lato = Lato({
  weight: ['300', '400', '700', '900'],
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "OpenWork AI - Medical Research Synthesis",
  description: "Advanced medical research synthesis platform with 7-agent AI system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
  }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={lato.className} style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
