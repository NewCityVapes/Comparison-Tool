"use client"; // ✅ This makes the component interactive in the browser

import { useState } from "react";

export default function VendorDropdown({ vendors }: { vendors: string[] }) {
  const [selectedVendor, setSelectedVendor] = useState("");

  return (
    <div>
      <label className="block mb-2 font-semibold">Select Vendor:</label>
      <select
        className="border p-2 rounded-md w-full"
        value={selectedVendor}
        onChange={(e) => setSelectedVendor(e.target.value)}
      >
        <option value="">All Vendors</option>
        {vendors.map((vendor) => (
          <option key={vendor} value={vendor}>
            {vendor}
          </option>
        ))}
      </select>

      {/* ✅ Show selected vendor below the dropdown */}
      {selectedVendor && (
        <p className="mt-2">
          Showing products from: <strong>{selectedVendor}</strong>
        </p>
      )}
    </div>
  );
}
