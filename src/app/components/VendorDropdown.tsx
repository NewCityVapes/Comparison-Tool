"use client";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function VendorDropdown({ vendors }: { vendors: string[] }) {
  const [selectedVendor, setSelectedVendor] = useState("");
  const [productImage, setProductImage] = useState<string | null>(null);
  const [productPrice, setProductPrice] = useState<string | null>(null);
  const [productML, setProductML] = useState<string | null>(null); // ✅ New state for ML
  const [productBattery, setProductBattery] = useState<string | null>(null); // ✅ Battery (mAh)

  // Fetch first product details when vendor is selected
  useEffect(() => {
    async function fetchProduct() {
      if (!selectedVendor) {
        setProductImage(null);
        setProductPrice(null);
        setProductML(null);
        setProductBattery(null);
        return;
      }

      try {
        const response = await fetch(
          `/api/products?vendor=${encodeURIComponent(selectedVendor)}`
        );
        const data = await response.json();

        // 🔥 Debug: Log full API response before filtering
        console.log(
          "🔥 FULL API Response in Frontend:",
          JSON.stringify(data, null, 2)
        );

        if (data.products.length > 0) {
          const firstProduct = data.products[0];

          // 🔥 Debug: Log first product details
          console.log(
            "🔥 First Product in Frontend:",
            JSON.stringify(firstProduct, null, 2)
          );

          setProductImage(firstProduct.image || "/fallback.jpg");
          setProductPrice(firstProduct.price || "N/A");

          // ✅ Debug: Ensure metafield exists before setting the state
          if (firstProduct.metafield) {
            console.log(
              "✅ Metafield found:",
              JSON.stringify(firstProduct.metafield, null, 2)
            );
          } else {
            console.log(
              "⚠️ Metafield is missing in the frontend API response!"
            );
          }

          // ✅ Fix: Directly update state without unused variables
          setProductML(firstProduct.ml || "N/A"); // ✅ Directly use API value
          setProductBattery(firstProduct.battery || "N/A"); // ✅ Directly use API value
        } else {
          console.log("⚠️ No products found for this vendor.");
          setProductImage("/fallback.jpg");
          setProductPrice("N/A");
          setProductML("N/A");
          setProductBattery("N/A"); // ✅ Added missing reset for battery
        }
      } catch (error) {
        console.error("❌ Error fetching product:", error);
        setProductImage("/fallback.jpg");
        setProductPrice("N/A");
        setProductML("N/A");
        setProductBattery("N/A"); // ✅ Added missing reset for battery
      }
    }

    fetchProduct();
  }, [selectedVendor]);

  return (
    <div className="w-1/2">
      <label className="block mb-2 font-semibold text-lg">
        Select Vendor (DISPOSABLES only):
      </label>
      <select
        className="border p-3 rounded-md w-full text-lg bg-white shadow-md"
        value={selectedVendor}
        onChange={(e) => setSelectedVendor(e.target.value)}
      >
        <option value="">All Vendors</option>
        {vendors.length > 0 ? (
          vendors.map((vendor) => (
            <option key={vendor} value={vendor}>
              {vendor}
            </option>
          ))
        ) : (
          <option disabled>No vendors available</option>
        )}
      </select>

      {selectedVendor && (
        <p className="mt-4 text-lg text-gray-700">
          Showing products from:{" "}
          <strong className="text-black">{selectedVendor}</strong>
        </p>
      )}

      {/* ✅ Display product image, price, and ML */}
      {productImage && (
        <div className="mt-4">
          <Image
            src={productImage}
            alt="Selected product"
            className="w-48 h-48 object-cover rounded-lg shadow-md"
            width={300}
            height={300}
            priority
          />
        </div>
      )}

      {productPrice && (
        <p className="mt-2 text-lg font-semibold text-gray-900">
          Price: <span className="text-blue-600">${productPrice}</span>
        </p>
      )}

      {productML && (
        <p className="mt-2 text-lg font-semibold text-gray-900">
          ML: <span className="text-green-600">{productML}</span>
        </p>
      )}
      {productBattery && (
        <p className="mt-2 text-lg font-semibold text-gray-900">
          Battery: <span className="text-red-600">{productBattery} mAh</span>
        </p>
      )}
    </div>
  );
}
