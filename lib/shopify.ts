
const SHOPIFY_API_URL = `https://${process.env.SHOPIFY_STORE_URL}/admin/api/2023-10/graphql.json`;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_API_KEY;

export type ShopifyProduct = {
    id: string;
    title: string;
    vendor: string;
    image: string;
    price: string;
    variants: { price: string }[]; // ✅ Ensure this matches your final mapped structure
};


export type ShopifyAPIResponse = {
    data: {
        products: {
            edges: {
                node: {
                    id: string;
                    title: string;
                    vendor: string;
                    featuredImage?: { url: string } | null;
                    variants: {
                        edges: { node: { price: string } }[];
                    };
                };
            }[];
        };
    };
};


  

let cachedVendors: string[] | null = null;
let vendorCacheTimestamp: number | null = null;
const VENDOR_CACHE_EXPIRATION = 10 * 60 * 1000; // 10 minutes

export async function fetchVendors(): Promise<string[]> {
    const now = Date.now();
    
    if (cachedVendors && vendorCacheTimestamp && now - vendorCacheTimestamp < VENDOR_CACHE_EXPIRATION) {
        console.log("⚡ Using Cached Vendors");
        return cachedVendors;
    }

    console.log("🚀 Fetching All Vendors from Shopify API...");

    let vendors: string[] = [];
    let hasNextPage = true;
    let endCursor: string | null = null;

    try {
        while (hasNextPage) {
            const query: string = `

                {
                    products(first: 50, after: ${endCursor ? `"${endCursor}"` : "null"}) {
                        edges {
                            node {
                                vendor
                                productType
                            }
                        }
                        pageInfo {
                            hasNextPage
                            endCursor
                        }
                    }
                }
            `;

            const response = await fetch(SHOPIFY_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN || ""
                },
                body: JSON.stringify({ query })
            });

            if (!response.ok) {
                throw new Error(`Shopify API Error: ${response.status}`);
            }

            const data = await response.json();

            if (!data.data || !data.data.products) {
                console.error("❌ Shopify API did not return products.");
                throw new Error("Shopify API response is missing 'products'.");
            }

            // ✅ Extract unique vendors only from DISPOSABLES product type
            const newVendors = data.data.products.edges
                .filter((p: { node: { productType: string } }) => p.node.productType === "DISPOSABLES")
                .map((p: { node: { vendor: string } }) => p.node.vendor.trim());

            vendors = [...new Set([...vendors, ...newVendors])]; // ✅ Combine & remove duplicates

            hasNextPage = data.data.products.pageInfo.hasNextPage;
            endCursor = data.data.products.pageInfo.endCursor;

            console.log(`🚀 Fetched ${newVendors.length} Vendors. Total Cached: ${vendors.length}`);
        }

        cachedVendors = vendors;
        vendorCacheTimestamp = now;

        console.log("🔥 All Vendors Cached:", vendors.length);
        return vendors;
    } catch (error) {
        console.error("❌ Error Fetching Vendors:", error);
        return [];
    }
}

  


let cachedProducts: ShopifyProduct[] = []; // ✅ Explicitly set type
let cacheTimestamp: number | null = null;
const CACHE_EXPIRATION_TIME = 10 * 60 * 1000; // 10 minutes

export async function getProducts(): Promise<ShopifyProduct[]> {
    const now = Date.now();
    if (cachedProducts && cacheTimestamp && now - cacheTimestamp < CACHE_EXPIRATION_TIME) {
        console.log("⚡ Using Cached Products");
        return cachedProducts;
    }
    console.log("🚀 Fetching fresh products from Shopify API...");
    cacheTimestamp = now; // ✅ Update cache timestamp
    console.log("🚀 Fetching all products from Shopify API...");

    let allProducts: ShopifyProduct[] = [];
    let hasNextPage = true;
    let endCursor: string | null = null;

    try {
        while (hasNextPage) {
            const query: string = `
                {
                    products(first: 50, after: ${endCursor ? `"${endCursor}"` : "null"}) {
                        edges {
                            node {
                                id
                                title
                                vendor
                                featuredImage {
                                    url
                                }
                                variants(first: 1) {
                                    edges {
                                        node {
                                            price
                                        }
                                    }
                                }
                            }
                        }
                        pageInfo {
                            hasNextPage
                            endCursor
                        }
                    }
                }
            `;

            const response = await fetch(SHOPIFY_API_URL, {
                method: "POST",
                headers: {
                    "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN || "",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ query })
            });

            if (!response.ok) {
                console.error("❌ Shopify API Error:", response.statusText);
                throw new Error(`Failed to fetch: ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.data || !data.data.products) {
                console.error("❌ Shopify API did not return products.");
                throw new Error("Shopify API response is missing 'products'.");
            }

            const products = (data as ShopifyAPIResponse).data.products.edges.map(({ node }) => ({
                id: node.id,
                title: node.title,
                vendor: node.vendor.trim(),
                image: node.featuredImage?.url || "/fallback.jpg",
                price: node.variants?.edges?.[0]?.node?.price || "0.00",
                variants: node.variants?.edges.map((v) => ({ price: v.node.price })) || []
            }));

            allProducts = [...allProducts, ...products]; // ✅ Append new batch to allProducts

            hasNextPage = data.data.products.pageInfo.hasNextPage;
            endCursor = data.data.products.pageInfo.endCursor;
        }

        cachedProducts = allProducts; // ✅ Cache all fetched products
        console.log("🔥 Total Products Cached:", cachedProducts.length);
        return cachedProducts;
    } catch (error) {
        console.error("❌ Error fetching Shopify products:", error);
        return [];
    }
}

export async function fetchVendorsAndProducts(): Promise<{ vendors: string[]; products: ShopifyProduct[] }> {
    console.log("🚀 Fetching Vendors & Products in Parallel...");

    const vendorsPromise = fetchVendors(); // ✅ Start fetching vendors
    const productsPromise = getProducts(); // ✅ Start fetching products

    const [vendors, products] = await Promise.all([vendorsPromise, productsPromise]); // ✅ Run in parallel

    console.log("✅ Vendors and Products Fetched");
    return { vendors, products };
}

export async function preloadData() {
    console.log("🚀 Preloading Vendors & Products...");

    try {
        const [vendors, products] = await Promise.all([
            fetchVendors(), // ✅ Fetch vendors
            getProducts() // ✅ Fetch products
        ]);

        console.log("✅ Preloaded Vendors:", vendors.length);
        console.log("✅ Preloaded Products:", products.length);
    } catch (error) {
        console.error("❌ Error Preloading Data:", error);
    }
}
