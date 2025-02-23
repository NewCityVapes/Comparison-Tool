import VendorDropdown from "@/app/components/VendorDropdown"; // ✅ Import Client Component

import { fetchVendors } from "../../lib/shopify";

export default async function ShopifyPage() {
  // ✅ Fetch vendors on the server BEFORE rendering
  const vendors = await fetchVendors();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Shopify Products</h1>

      {/* ✅ Pass vendors to the Client Component */}
      <VendorDropdown vendors={vendors} />
    </div>
  );
}
