
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
                    productType: string;
                    featuredImage?: { url: string } | null;
                    variants: {
                        edges: { node: { price: string } }[];
                    };
                };
            }[];
            pageInfo: { // ✅ Added this
                hasNextPage: boolean;
                endCursor: string | null;
            };
        };
    };
};


function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
  

let cachedVendors: string[] | null = null;
let vendorCacheTimestamp: number | null = null;
const VENDOR_CACHE_EXPIRATION = 10 * 60 * 1000; // 10 minutes

async function fetchWithRetry<T>(query: string, retries = 5): Promise<T> {
    for (let i = 0; i < retries; i++) {
        const response = await fetch(SHOPIFY_API_URL, {
            method: "POST",
            headers: {
                "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN || "",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ query })
        });

        if (response.ok) return response.json(); // ✅ Return data if successful

        // ✅ Handle Rate Limiting - Check Shopify's retry-after header
        if (response.status === 429) {
            const retryAfter = response.headers.get("Retry-After");
            const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : Math.min(5000 * (i + 1), 30000);
            console.warn(`⚠️ Shopify API Throttled. Retrying in ${waitTime / 1000} seconds...`);
            await sleep(waitTime);
            continue;
        }

        console.error(`❌ Shopify API Error: ${response.statusText}`);
    }

    throw new Error("❌ Shopify API Throttled. Max retries reached.");
}


export async function fetchVendors(): Promise<string[]> {
    const now = Date.now();
    if (cachedVendors && vendorCacheTimestamp && now - vendorCacheTimestamp < VENDOR_CACHE_EXPIRATION) {
        console.log("⚡ Using Cached Vendors");
        return cachedVendors;
    }

    console.log("🚀 Fetching All Vendors from Shopify API...");
    const vendors = new Set<string>(); 
    let hasNextPage = true;
    let endCursor: string | null = null;

    try {
        while (hasNextPage) {
            const queries = [...Array(3)].map(() => {
                return `
                {
                    products(first: 250, after: ${endCursor ? `"${endCursor}"` : "null"}) {
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
            });

            // ✅ Run 3 requests in parallel to speed up pagination
            const responses = await Promise.all(queries.map(query => fetchWithRetry<ShopifyAPIResponse>(query)));

            for (const data of responses) {
                if (!data || !data.data || !data.data.products) continue;

                // ✅ Extract vendors that match "DISPOSABLES"
                data.data.products.edges
                    .filter(p => p.node.productType === "DISPOSABLES")
                    .forEach(p => vendors.add(p.node.vendor.trim()));

                hasNextPage = data.data.products.pageInfo.hasNextPage;
                endCursor = data.data.products.pageInfo.endCursor || null;
            }
        }

        cachedVendors = Array.from(vendors).sort();
        vendorCacheTimestamp = now;
        console.log(`✅ Vendors Cached: ${cachedVendors.length}`);
        return cachedVendors;
    } catch (error) {
        console.error("❌ Error Fetching Vendors:", error);
        return [];
    }
}



// ✅ Product Caching
let cachedProducts: ShopifyProduct[] = [];
let cacheTimestamp: number | null = null;
const CACHE_EXPIRATION_TIME = 10 * 60 * 1000; // 10 minutes

export async function getProducts(): Promise<ShopifyProduct[]> {
    const now = Date.now();
    if (cachedProducts && cacheTimestamp && now - cacheTimestamp < CACHE_EXPIRATION_TIME) {
        console.log("⚡ Using Cached Products");
        return cachedProducts;
    }

    console.log("🚀 Fetching Products...");

    const allProducts: ShopifyProduct[] = [];
    let hasNextPage = true;
    let endCursor: string | undefined;

    try {
        while (hasNextPage) {
            const queries = [...Array(3)].map(() => {
                return `
                {
                    products(first: 250, after: ${endCursor ? `"${endCursor}"` : "null"}) {
                        edges {
                            node {
                                id
                                title
                                vendor
                                featuredImage { url }
                                variants(first: 1) {
                                    edges {
                                        node { price }
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
            });

            // ✅ Run 3 requests in parallel
            const responses = await Promise.all(queries.map(query => fetchWithRetry<ShopifyAPIResponse>(query)));

            for (const data of responses) {
                if (!data || !data.data?.products) continue;

                // ✅ Map data to expected format
                const products = data.data.products.edges.map(({ node }) => ({
                    id: node.id,
                    title: node.title,
                    vendor: node.vendor.trim(),
                    image: node.featuredImage?.url || "/fallback.jpg",
                    price: node.variants?.edges?.[0]?.node?.price || "0.00",
                    variants: node.variants?.edges.map(v => ({ price: v.node.price })) || []
                }));

                allProducts.push(...products);

                hasNextPage = data.data.products.pageInfo.hasNextPage;
                endCursor = data.data.products.pageInfo.endCursor || undefined;
            }
        }

        cachedProducts = allProducts;
        cacheTimestamp = now;

        console.log(`✅ Products Cached: ${cachedProducts.length}`);
        return cachedProducts;
    } catch (error) {
        console.error("❌ Error fetching Shopify products:", error);
        return [];
    }
}


export async function fetchVendorsAndProducts(): Promise<{ vendors: string[]; products: ShopifyProduct[] }> {
    console.log("🚀 Fetching Vendors & Products in Parallel...");

    const [vendors, products] = await Promise.all([fetchVendors(), getProducts()]);

    console.log("✅ Vendors and Products Fetched");
    return { vendors, products };
}

// ✅ Preload Vendors & Products on Startup
export async function preloadData() {
    console.log("🚀 Preloading Vendors & Products...");

    try {
        const [vendors, products] = await Promise.all([fetchVendors(), getProducts()]);

        console.log("✅ Preloaded Vendors:", vendors.length);
        console.log("✅ Preloaded Products:", products.length);
    } catch (error) {
        console.error("❌ Error Preloading Data:", error);
    }
}

