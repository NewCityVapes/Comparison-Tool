import Link from "next/link";

export const metadata = {
  title: "NCV - Compare Tool",
  description: "Compare vaping products from New City Vapes",
  icons: {
    icon: "/favicon.ico", // Path to your new favicon
  },
};

export default function HomePage() {
  return (
    <div>
      <h1>Welcome to My Compare tool App</h1>
      <Link href="/shopify-page">
        <button>Products</button>
      </Link>
    </div>
  );
}
