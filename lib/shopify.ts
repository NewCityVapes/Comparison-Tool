
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
        const response: Response = await fetch(SHOPIFY_API_URL, {
            method: "POST",
            headers: {
                "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN || "",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ query })
        });

        if (response.ok) {
            return response.json(); // ✅ Correct way to return API data
        }

        // ✅ Handle Rate Limiting
        if (response.status === 429) {
            const waitTime = (60 / 100) * (i + 1) * 1000; // Exponential backoff
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

    const vendors = new Set<string>(); // ✅ Deduplicate vendors automatically
    let hasNextPage = true;
    let endCursor: string | null = null;

    try {
        while (hasNextPage) {
            await sleep(500); // ✅ Prevent rate limits

            const query: string = `
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

            const data = await fetchWithRetry<ShopifyAPIResponse>(query);


            if (!data || !data.data || !data.data.products) {
                console.error("❌ Shopify API did not return products.");
                throw new Error("Shopify API response is missing 'products'.");
            }

            // ✅ Filter by productType === "DISPOSABLES" and remove duplicates
            const newVendors = data.data.products.edges
                .filter((p: { node: { productType: string } }) => p.node.productType === "DISPOSABLES") // ✅ Filter
                .map((p: { node: { vendor: string } }) => p.node.vendor.trim()); // ✅ Extract vendor names

            newVendors.forEach((vendor: string) => vendors.add(vendor)); // ✅ Add to Set (removes duplicates)

            hasNextPage = data.data.products.pageInfo.hasNextPage;
            endCursor = data.data.products.pageInfo.endCursor;

            console.log(`🚀 Fetched ${newVendors.length} Vendors. Total Cached: ${vendors.size}`);
        }

        // ✅ Convert Set to Array and Sort Alphabetically
        cachedVendors = Array.from(vendors).sort((a, b) => a.localeCompare(b));
        vendorCacheTimestamp = now;

        console.log("🔥 All Vendors Cached (Sorted Alphabetically):", cachedVendors.length);
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

    console.log("🚀 Fetching Products (Caching Enabled)...");

    let allProducts: ShopifyProduct[] = [];
    let hasNextPage = true;
    let endCursor: string | undefined;


    try {
        while (hasNextPage) {
            // ✅ Fetch 3 pages at once for speed improvement
            const queries = [...Array(3)].map(() => {
                const query: string = `
    {
        products(first: 250, after: ${endCursor ? `"${endCursor}"` : "null"}) {
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

                return fetch(SHOPIFY_API_URL, {
                    method: "POST",
                    headers: {
                        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN || "",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ query })
                }).then((res) => res.json());
            });

            const responses = await Promise.all(queries);

            for (const data of responses) {
                if (!data || !data.data) {
                    console.error("❌ No data returned from Shopify API.");
                    console.error("🔥 Full API Response:", JSON.stringify(data, null, 2));
                    throw new Error("Shopify API response is missing 'data'.");
                }
                
                if (!data.data.products) {
                    console.error("❌ 'products' field is missing in API response.");
                    console.error("🔥 Full API Response:", JSON.stringify(data, null, 2));
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

                allProducts = [...allProducts, ...products];

                hasNextPage = data.data.products.pageInfo.hasNextPage;
                endCursor = data.data.products.pageInfo.endCursor || undefined;


                if (!hasNextPage) break;
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

// ✅ Fetch Vendors & Products in Parallel
export async function fetchVendorsAndProducts(): Promise<{ vendors: string[]; products: ShopifyProduct[] }> {
    console.log("🚀 Fetching Vendors & Products in Parallel...");

    const vendorsPromise = fetchVendors();
    const productsPromise = getProducts();

    const [vendors, products] = await Promise.all([vendorsPromise, productsPromise]);

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

