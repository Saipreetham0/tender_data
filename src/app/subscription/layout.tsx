import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subscription Plans - RGUKT Tenders Portal | Start Your Free Trial",
  description: "Choose the perfect plan for accessing RGUKT tender notifications. Free trial available. Get email alerts, unlimited access to all campus tenders, and premium features.",
  keywords: "RGUKT subscription, tender alerts subscription, government procurement plans, tender notification pricing, RGUKT tender access",
  authors: [{ name: "RGUKT Tenders Portal" }],
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://tendernotify.site/subscription",
    siteName: "RGUKT Tenders Portal",
    title: "Subscription Plans - RGUKT Tenders Portal",
    description: "Choose the perfect plan for accessing RGUKT tender notifications. Free trial available with premium features.",
    images: [
      {
        url: "/og-subscription.jpg",
        width: 1200,
        height: 630,
        alt: "RGUKT Tenders Portal - Subscription Plans",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@rgukt_tenders",
    creator: "@rgukt_tenders",
    title: "Subscription Plans - RGUKT Tenders Portal",
    description: "Choose the perfect plan for accessing RGUKT tender notifications. Free trial available.",
    images: ["/og-subscription.jpg"],
  },
  alternates: {
    canonical: "https://tendernotify.site/subscription",
  },
};

export default function SubscriptionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}