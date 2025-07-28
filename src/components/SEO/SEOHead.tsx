import Head from 'next/head'

interface SEOHeadProps {
  title?: string
  description?: string
  keywords?: string
  ogImage?: string
  url?: string
  type?: 'website' | 'article'
  twitterCard?: 'summary' | 'summary_large_image'
  author?: string
  publishedTime?: string
  modifiedTime?: string
}

export default function SEOHead({
  title = 'RGUKT Tenders Portal',
  description = 'Comprehensive tender information from various RGUKT campuses with subscription features',
  keywords = 'RGUKT, tenders, procurement, government contracts, bidding, construction, supplies',
  ogImage = '/og-image.jpg',
  url = 'https://tendernotify.site',
  type = 'website',
  twitterCard = 'summary_large_image',
  author = 'RGUKT Tenders Portal',
  publishedTime,
  modifiedTime
}: SEOHeadProps) {
  const fullTitle = title.includes('RGUKT') ? title : `${title} | RGUKT Tenders Portal`
  const fullUrl = url.startsWith('http') ? url : `https://tendernotify.site${url}`

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="robots" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="English" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />
      
      {/* Open Graph Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content="RGUKT Tenders Portal" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:site" content="@rgukt_tenders" />
      <meta name="twitter:creator" content="@rgukt_tenders" />
      
      {/* Article specific meta tags */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === 'article' && (
        <meta property="article:author" content={author} />
      )}
      
      {/* Additional SEO Tags */}
      <meta name="theme-color" content="#1f2937" />
      <meta name="msapplication-TileColor" content="#1f2937" />
      
      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/site.webmanifest" />
      
      {/* Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "RGUKT Tenders Portal",
            "description": description,
            "url": fullUrl,
            "potentialAction": {
              "@type": "SearchAction",
              "target": `${fullUrl}/dashboard/tenders?search={search_term_string}`,
              "query-input": "required name=search_term_string"
            }
          })
        }}
      />
    </Head>
  )
}