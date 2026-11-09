import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Tilikstory — Undangan digital",
    template: "%s — Tilikstory",
  },
  description: "Ruang untuk merencanakan hari yang akan selalu diingat.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
