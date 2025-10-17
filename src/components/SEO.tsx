import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  structuredData?: object;
}

export const SEO = ({
  title,
  description,
  keywords = "مستحضرات تجميل، العناية بالبشرة، منتجات تجميل العراق، متجر مستحضرات تجميل بغداد، العناية بالبشرة العراق",
  image = "/og-image.jpg",
  url = window.location.href,
  type = "website",
  structuredData,
}: SEOProps) => {
  const siteName = "متجر مستحضرات التجميل - العراق";
  const fullTitle = `${title} | ${siteName}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={siteName} />
      <meta name="language" content="ar" />
      <meta name="geo.region" content="IQ" />
      <meta name="geo.placename" content="Baghdad" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="ar_IQ" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};
