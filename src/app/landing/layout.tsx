import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RGUKT Tenders Portal - Government Tender Notifications & Subscription Platform",
  description: "Discover tender opportunities from all RGUKT campuses. Get email notifications, track government procurement, construction tenders with our subscription service. Start free trial.",
  keywords: "RGUKT tenders, government procurement, tender notifications, construction contracts, supply tenders, bidding opportunities, government contracts, RGUKT campuses",
  authors: [{ name: "RGUKT Tenders Portal" }],
  creator: "RGUKT Tenders Portal",
  publisher: "RGUKT Tenders Portal",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://tendernotify.site/landing",
    siteName: "RGUKT Tenders Portal",
    title: "RGUKT Tenders Portal - Government Tender Notifications",
    description: "Discover tender opportunities from all RGUKT campuses. Get email notifications and track government procurement opportunities.",
    images: [
      {
        url: "/og-landing.jpg",
        width: 1200,
        height: 630,
        alt: "RGUKT Tenders Portal - Landing Page",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@rgukt_tenders",
    creator: "@rgukt_tenders",
    title: "RGUKT Tenders Portal - Government Tender Notifications",
    description: "Discover tender opportunities from all RGUKT campuses. Get email notifications and track government procurement.",
    images: ["/og-landing.jpg"],
  },
  alternates: {
    canonical: "https://tendernotify.site/landing",
  },
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}