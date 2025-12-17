import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
    image?: string;
    url?: string;
    type?: 'website' | 'article' | 'product';
    structuredData?: object;
    noIndex?: boolean;
}

const SEOHead = ({
    title = 'The Prestige Merchandise | Genuine Auto Parts in Abossey Okai, Accra',
    description = 'Your trusted auto parts dealer in Abossey Okai. Genuine power steering pumps, steering racks, lubricants & more. Fast nationwide delivery across Ghana.',
    keywords = 'auto parts Ghana, steering rack Accra, power steering pump, car lubricants, Abossey Okai, genuine spare parts, car parts delivery Ghana',
    image = '/favicon.png',
    url,
    type = 'website',
    structuredData,
    noIndex = false,
}: SEOProps) => {
    // Get the base URL from environment or use current origin
    const baseUrl = import.meta.env.VITE_BASE_URL || window.location.origin;
    const canonicalUrl = url ? `${baseUrl}${url}` : window.location.href;
    const imageUrl = image.startsWith('http') ? image : `${baseUrl}${image}`;

    return (
        <Helmet>
            {/* Basic Meta Tags */}
            <title>{title}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />
            <link rel="canonical" href={canonicalUrl} />

            {/* Robots */}
            {noIndex && <meta name="robots" content="noindex, nofollow" />}

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={imageUrl} />
            <meta property="og:site_name" content="The Prestige Merchandise" />
            <meta property="og:locale" content="en_GH" />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={canonicalUrl} />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={imageUrl} />

            {/* Additional SEO */}
            <meta name="author" content="The Prestige Merchandise" />
            <meta name="geo.region" content="GH-AA" />
            <meta name="geo.placename" content="Accra" />
            <meta name="geo.position" content="5.614818;-0.186964" />
            <meta name="ICBM" content="5.614818, -0.186964" />

            {/* Structured Data */}
            {structuredData && (
                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
                </script>
            )}
        </Helmet>
    );
};

export default SEOHead;
