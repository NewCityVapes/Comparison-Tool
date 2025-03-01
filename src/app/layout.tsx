import "./globals.css";
import { preloadData } from "../../lib/shopify";
import { SpeedInsights } from "@vercel/speed-insights/next";

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
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <SpeedInsights /> {/* ✅ Removed unnecessary whitespace */}
      </body>
    </html>
  );
}
