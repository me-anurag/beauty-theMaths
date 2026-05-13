import type { Metadata, Viewport } from "next";
import "@/ui/theme/globals.css";

export const metadata: Metadata = {
  title: "Beauty and the Maths",
  description: "High-speed cognitive mental maths training platform",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BatM",
  },
};

export const viewport: Viewport = {
  themeColor: "#07120a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" href="/icons/icon-512.png" />
      </head>
      <body className="h-full bg-bg text-ink antialiased">{children}</body>
    </html>
  );
}