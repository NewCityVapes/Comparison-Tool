"use client";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function VendorDropdown({ vendors }: { vendors: string[] }) {
  const [selectedVendor, setSelectedVendor] = useState("");
  const [productImage, setProductImage] = useState<string | null>(null);

  // Fetch first product image when vendor is selected
  useEffect(() => {
    async function fetchProduct() {
      if (!selectedVendor) {
        setProductImage(null);
        return;
      }

      try {
        const response = await fetch(
          `/api/products?vendor=${encodeURIComponent(selectedVendor)}`
        );
        const data = await response.json();

        console.log("🔥 API Response in Frontend:", data); // ✅ Log response

        if (data.products.length > 0 && data.products[0].image) {
          setProductImage(data.products[0].image);
        } else {
          setProductImage("/fallback.jpg"); // ✅ Use fallback image if no image exists
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        setProductImage("/fallback.jpg");
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

      {/* ✅ Display product image */}
      {productImage && (
        <div className="mt-4">
          <Image
            src={productImage}
            alt="Selected product"
            className="w-48 h-48 object-cover rounded-lg shadow-md"
            width={300} // ✅ Set a default width
            height={300} // ✅ Set a default height
            priority
          />
        </div>
      )}
    </div>
  );
}
