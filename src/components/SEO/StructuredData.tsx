interface StructuredDataProps {
  type: 'organization' | 'website' | 'service' | 'breadcrumb'
  data?: any
}

export default function StructuredData({ type, data }: StructuredDataProps) {
  const getStructuredData = () => {
    switch (type) {
      case 'organization':
        return {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "RGUKT Tenders Portal",
          "description": "Government tender notification platform for RGUKT campuses",
          "url": "https://tendernotify.site",
          "logo": "https://tendernotify.site/logo.png",
          "contactPoint": {
            "@type": "ContactPoint",
            "email": "info@kspdigitalsolutions.com",
            "contactType": "customer service"
          },
          "sameAs": [
            "https://twitter.com/rgukt_tenders"
          ],
          "foundingDate": "2024",
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "IN"
          }
        }
      
      case 'website':
        return {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "RGUKT Tenders Portal",
          "description": "Get real-time tender notifications from RGUKT campuses. Track government procurement opportunities.",
          "url": "https://tendernotify.site",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://tendernotify.site/dashboard/tenders?search={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        }
      
      case 'service':
        return {
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Government Tender Notification Service",
          "description": "Real-time notifications and tracking for RGUKT campus tenders and procurement opportunities",
          "provider": {
            "@type": "Organization",
            "name": "RGUKT Tenders Portal"
          },
          "serviceType": "Government Procurement Notification",
          "areaServed": {
            "@type": "Country",
            "name": "India"
          }
        }
      
      case 'breadcrumb':
        return data || {}
      
      default:
        return {}
    }
  }

  const structuredData = getStructuredData()

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData)
      }}
    />
  )
}