export type ShopifyProduct = {
  id: string;
  title: string;
  image: string; // ✅ This will store the featured image URL
  price: string;
};


export async function getProducts(): Promise<ShopifyProduct[]> {
  console.log("Fetching products from Shopify API...");

  try {
      const response = await fetch(
          `https://${process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL}/admin/api/2023-10/graphql.json`,
          {
              method: "POST",
              headers: {
                  "X-Shopify-Access-Token": process.env.NEXT_PUBLIC_SHOPIFY_ADMIN_API_KEY || "",
                  "Content-Type": "application/json"
              },
              body: JSON.stringify({
                  query: `
                      {
                          products(first: 5) {
                              edges {
                                  node {
                                      id
                                      title
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
                          }
                      }
                  `
              })
          }
      );

      if (!response.ok) {
          console.error("❌ Shopify API Error:", response.statusText);
          throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("✅ Shopify API Response:", data);

      return data.data.products.edges.map(({ node }: { node: any }) => ({
          id: node.id,
          title: node.title,
          image: node.featuredImage?.url || "/fallback.jpg", // ✅ Ensures image always exists
          price: node.variants.edges[0]?.node?.price || "0.00"
      }));
  } catch (error) {
      console.error("❌ Error fetching Shopify products:", error);
      return [];
  }
}
