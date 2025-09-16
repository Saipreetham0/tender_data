// // src/app/layout.tsx
// import "./globals.css";
// import type { Metadata } from "next";
// import { Inter } from "next/font/google";
// import { initDatabase } from "@/lib/db-schema";
// // import Script from "next/script";

// const inter = Inter({ subsets: ["latin"] });

// export const metadata: Metadata = {
//   title: "RGUKT Tenders",
//   description: "Tender information from various RGUKT campuses",
// };

// // Initialize database tables on app start (server-side only)
// if (typeof window === "undefined") {
//   initDatabase()
//     .then(() => console.log("Database initialized"))
//     .catch((err) => console.error("Failed to initialize database:", err));
// }

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <html lang="en">
//       {/* <Script
//         id="razorpay-checkout-js"
//         src="https://checkout.razorpay.com/v1/checkout.js"
//         strategy="afterInteractive"
//       /> */}
//       <script src="https://checkout.razorpay.com/v1/checkout.js" async />
//       <body className={inter.className}>{children}</body>
//     </html>
//   );
// }

// src/app/layout.tsx - Updated with Auth Provider
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { OptimizedAuthProvider } from "@/contexts/OptimizedAuthContext";
import { QueryProvider } from "@/contexts/QueryProvider";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://tendernotify.site'),
  title: "RGUKT Tenders Portal - Government Tender Notifications & Procurement",
  description:
    "Get real-time tender notifications from RGUKT campuses. Track government procurement opportunities, construction tenders, and supply contracts with email subscriptions and analytics.",
  keywords: "RGUKT tenders, government procurement, tender notifications, construction contracts, supply tenders, bidding opportunities, government contracts",
  authors: [{ name: "RGUKT Tenders Portal" }],
  creator: "RGUKT Tenders Portal",
  publisher: "RGUKT Tenders Portal",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://tendernotify.site",
    siteName: "RGUKT Tenders Portal",
    title: "RGUKT Tenders Portal - Government Tender Notifications",
    description: "Get real-time tender notifications from RGUKT campuses. Track government procurement opportunities with email subscriptions.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "RGUKT Tenders Portal - Government Tender Notifications",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@rgukt_tenders",
    creator: "@rgukt_tenders",
    title: "RGUKT Tenders Portal - Government Tender Notifications",
    description: "Get real-time tender notifications from RGUKT campuses. Track government procurement opportunities.",
    images: ["/og-image.jpg"],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1f2937',
};

// Initialize database tables on app start (server-side only)
// if (typeof window === "undefined") {
//   initDatabase()
//     .then(() => console.log("Database initialized"))
//     .catch((err) => console.error("Failed to initialize database:", err));
// }

// Initialize app on server startup
// if (typeof window === "undefined") {
//   initializeApp().catch(console.error);
// }

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="canonical" href="https://tendernotify.site" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        {/* Add Razorpay script for payments */}
        <script src="https://checkout.razorpay.com/v1/checkout.js" async />
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
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
            })
          }}
        />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <AuthProvider>
            <QueryProvider>
              <OptimizedAuthProvider>
                <SubscriptionProvider>
                  {children}
                </SubscriptionProvider>
              </OptimizedAuthProvider>
            </QueryProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

