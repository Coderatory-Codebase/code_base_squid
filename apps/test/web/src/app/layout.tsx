import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "nut-shyll",
  description: "Authentication feature (MERN + Next.js).",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
