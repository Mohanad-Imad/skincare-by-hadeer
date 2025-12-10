import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  structuredData?: object;
  noindex?: boolean;
  canonicalUrl?: string;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
}

export const SEO = ({
  title,
  description,
  keywords = "مستحضرات تجميل، العناية بالبشرة، منتجات تجميل العراق، متجر مستحضرات تجميل بغداد، العناية بالبشرة العراق، skincare iraq، cosmetics baghdad، منتجات العناية بالبشرة",
  image = "https://storage.googleapis.com/gpt-engineer-file-uploads/NWHdYWUQfRdkJi5qtRtvLoeu8wu1/social-images/social-1760729892254-شعار صيدلية مفرغ هدير-01 (2).png",
  url = typeof window !== 'undefined' ? window.location.href : '',
  type = "website",
  structuredData,
  noindex = false,
  canonicalUrl,
  publishedTime,
  modifiedTime,
  author = "متجر هدير للعناية بالبشرة",
}: SEOProps) => {
  const siteName = "متجر هدير للعناية بالبشرة";
  const fullTitle = `${title} | ${siteName}`;
  const canonical = canonicalUrl || url;

  // Default organization structured data
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": siteName,
    "url": "https://preview--hadeer-skincare-glow.lovable.app",
    "logo": image,
    "description": "متجر هدير للعناية بالبشرة يقدم منتجات أصلية وفعالة للعناية اليومية والتجميل",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "بابل",
      "addressCountry": "IQ"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+9647748209420",
      "contactType": "customer service"
    },
    "sameAs": [
      "https://www.facebook.com/share/172mEBGsey/",
      "https://www.instagram.com/skincare.by.hadeer",
      "https://www.tiktok.com/@skincare.hadeer"
    ]
  };

  // Website search action schema
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": siteName,
    "url": "https://preview--hadeer-skincare-glow.lovable.app",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://preview--hadeer-skincare-glow.lovable.app/products?search={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  // Breadcrumb schema for better navigation in search results
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "الرئيسية",
        "item": "https://preview--hadeer-skincare-glow.lovable.app"
      }
    ]
  };

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="language" content="ar" />
      <meta name="geo.region" content="IQ" />
      <meta name="geo.placename" content="Baghdad, Babylon" />
      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"} />
      <meta name="googlebot" content={noindex ? "noindex, nofollow" : "index, follow"} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonical} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="ar_IQ" />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Additional SEO Tags */}
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-title" content={siteName} />
      
      {/* Structured Data - Organization */}
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>

      {/* Structured Data - Website */}
      <script type="application/ld+json">
        {JSON.stringify(websiteSchema)}
      </script>

      {/* Structured Data - Breadcrumb */}
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </script>

      {/* Custom Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};
