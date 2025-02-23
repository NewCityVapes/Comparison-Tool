import "./globals.css";
import { preloadData } from "../../lib/shopify";

// ✅ Run preload when the server starts
preloadData()
  .then(() => {
    console.log("🔥 Preload Complete");
  })
  .catch((err) => {
    console.error("❌ Preload Failed:", err);
  });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
