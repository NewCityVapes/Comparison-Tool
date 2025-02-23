import VendorDropdown from "@/app/components/VendorDropdown"; // ✅ Import Client Component
import { fetchVendors } from "../../lib/shopify";

export default async function ShopifyPage() {
  const vendors = await fetchVendors(); // ✅ Fetch only vendors with "DISPOSABLES" products

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Shopify Products</h1>

      {/* ✅ Pass filtered vendors to the Client Component */}
      <VendorDropdown vendors={vendors} />
    </div>
  );
}
