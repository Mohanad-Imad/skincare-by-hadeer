import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/xml; charset=utf-8",
};

const SITE_URL = Deno.env.get("SITE_URL") || "https://preview--hadeer-skincare-glow.lovable.app";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Generating dynamic sitemap...");

    // Fetch all active products
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, updated_at, name_ar")
      .eq("is_active", true);

    if (productsError) {
      console.error("Error fetching products:", productsError);
    }

    // Fetch all active categories
    const { data: categories, error: categoriesError } = await supabase
      .from("categories")
      .select("id, name_ar, parent_category_id")
      .eq("is_active", true);

    if (categoriesError) {
      console.error("Error fetching categories:", categoriesError);
    }

    // Fetch published blog posts
    const { data: blogPosts, error: blogError } = await supabase
      .from("blog_posts")
      .select("slug, updated_at")
      .eq("status", "published");

    if (blogError) {
      console.error("Error fetching blog posts:", blogError);
    }

    // Fetch active problem categories
    const { data: problemCategories, error: problemsError } = await supabase
      .from("problem_categories")
      .select("slug")
      .eq("is_active", true);

    if (problemsError) {
      console.error("Error fetching problem categories:", problemsError);
    }

    // Fetch active celebrity routines
    const { data: routines, error: routinesError } = await supabase
      .from("celebrity_routines")
      .select("id, updated_at")
      .eq("is_active", true);

    if (routinesError) {
      console.error("Error fetching celebrity routines:", routinesError);
    }

    const today = new Date().toISOString().split("T")[0];

    // Static pages
    const staticPages = [
      { loc: "/", priority: "1.0", changefreq: "daily" },
      { loc: "/products", priority: "0.9", changefreq: "daily" },
      { loc: "/categories", priority: "0.8", changefreq: "weekly" },
      { loc: "/makeup", priority: "0.8", changefreq: "weekly" },
      { loc: "/blog", priority: "0.7", changefreq: "weekly" },
      { loc: "/consultation", priority: "0.7", changefreq: "monthly" },
      { loc: "/celebrity-routines", priority: "0.7", changefreq: "weekly" },
      { loc: "/guarantee", priority: "0.6", changefreq: "monthly" },
      { loc: "/privacy-policy", priority: "0.3", changefreq: "yearly" },
      { loc: "/terms-of-service", priority: "0.3", changefreq: "yearly" },
    ];

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

    // Add static pages
    for (const page of staticPages) {
      sitemap += `  <url>
    <loc>${SITE_URL}${page.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    }

    // Add product pages
    if (products && products.length > 0) {
      console.log(`Adding ${products.length} products to sitemap`);
      for (const product of products) {
        const lastmod = product.updated_at
          ? new Date(product.updated_at).toISOString().split("T")[0]
          : today;
        sitemap += `  <url>
    <loc>${SITE_URL}/products/${product.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
      }
    }

    // Add category pages
    if (categories && categories.length > 0) {
      console.log(`Adding ${categories.length} categories to sitemap`);
      const mainCategories = categories.filter((c: any) => !c.parent_category_id);
      
      for (const category of mainCategories) {
        sitemap += `  <url>
    <loc>${SITE_URL}/products?category=${category.id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
        // Add subcategories
        const subCategories = categories.filter((c: any) => c.parent_category_id === category.id);
        for (const subCategory of subCategories) {
          sitemap += `  <url>
    <loc>${SITE_URL}/products?category=${category.id}&subCategory=${subCategory.id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
        }
      }
    }

    // Add blog post pages
    if (blogPosts && blogPosts.length > 0) {
      console.log(`Adding ${blogPosts.length} blog posts to sitemap`);
      for (const post of blogPosts) {
        const lastmod = post.updated_at
          ? new Date(post.updated_at).toISOString().split("T")[0]
          : today;
        sitemap += `  <url>
    <loc>${SITE_URL}/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;
      }
    }

    // Add problem category pages
    if (problemCategories && problemCategories.length > 0) {
      console.log(`Adding ${problemCategories.length} problem categories to sitemap`);
      for (const problem of problemCategories) {
        sitemap += `  <url>
    <loc>${SITE_URL}/shop-by-problem/${problem.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
      }
    }

    // Add celebrity routine pages
    if (routines && routines.length > 0) {
      console.log(`Adding ${routines.length} celebrity routines to sitemap`);
      for (const routine of routines) {
        const lastmod = routine.updated_at
          ? new Date(routine.updated_at).toISOString().split("T")[0]
          : today;
        sitemap += `  <url>
    <loc>${SITE_URL}/celebrity-routines/${routine.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;
      }
    }

    sitemap += `</urlset>`;

    console.log("Sitemap generated successfully");

    return new Response(sitemap, {
      headers: corsHeaders,
      status: 200,
    });
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <priority>1.0</priority>
  </url>
</urlset>`,
      {
        headers: corsHeaders,
        status: 200,
      }
    );
  }
});
