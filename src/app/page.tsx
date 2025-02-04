import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      <h1>Welcome to My Shopify App</h1>
      <Link href="/shopify-page">
        <button>Products</button>
      </Link>
    </div>
  );
}
