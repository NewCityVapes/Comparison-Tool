import Link from "next/link";
import Head from "next/head";

export default function HomePage() {
  return (
    <div>
      <Head>
        <title>NCV Compare Tool</title>
        <link rel="icon" href="/NCV_favicon_light.png" />
      </Head>
      <h1>Welcome to My Compare tool App</h1>
      <Link href="/shopify-page">
        <button>Products</button>
      </Link>
    </div>
  );
}
