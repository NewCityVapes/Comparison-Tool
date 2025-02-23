import VendorDropdown from "@/app/components/VendorDropdown"; // ✅ Import Client Component
import { fetchVendors } from "../../lib/shopify";

export default async function ShopifyPage() {
  const vendors = await fetchVendors(); // ✅ Fetch only vendors with "DISPOSABLES" products

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">New City Vapes</h1>
      <h2 className="text-2xl font-bold mb-4">Disposables Compare Tool</h2>

      <div className="flex min-h-screen items-start p-6 space-x-6">
        {" "}
        {/* ✅ Flex container with spacing */}
        {/* ✅ Left dropdown */}
        <VendorDropdown vendors={vendors} />
        {/* ✅ Right dropdown (duplicated) */}
        <VendorDropdown vendors={vendors} />
      </div>
    </div>
  );
}
