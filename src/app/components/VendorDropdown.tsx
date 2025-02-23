"use client"; // ✅ This makes it a Client Component

import { useState } from "react";

export default function VendorDropdown({ vendors }: { vendors: string[] }) {
  const [selectedVendor, setSelectedVendor] = useState("");

  return (
    <div className="w-1/2 pl-6">
      {" "}
      {/* ✅ Takes up 50% of the width, aligned left */}
      <label className="block mb-2 font-semibold text-lg">Select Brand:</label>
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
      {/* ✅ Show selected vendor */}
      {selectedVendor && (
        <p className="mt-4 text-lg text-gray-700">
          Showing products from:{" "}
          <strong className="text-black">{selectedVendor}</strong>
        </p>
      )}
    </div>
  );
}
