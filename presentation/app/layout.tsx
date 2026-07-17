import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CUVoC | CookUnity Voice of Customer",
  description: "Customer support intelligence for CookUnity teams.",
  icons: {
    icon: "/cookunity-logo.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
