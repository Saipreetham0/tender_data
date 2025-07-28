import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - RGUKT Tenders Portal | Access Your Account",
  description: "Login to your RGUKT Tenders Portal account. Access personalized tender notifications, manage subscriptions, and track opportunities across all RGUKT campuses.",
  keywords: "RGUKT login, tender portal login, government procurement login, tender account access",
  authors: [{ name: "RGUKT Tenders Portal" }],
  robots: "noindex, nofollow", // Login pages should not be indexed
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://tendernotify.site/login",
    siteName: "RGUKT Tenders Portal",
    title: "Login - RGUKT Tenders Portal",
    description: "Login to access your personalized tender dashboard and notifications.",
  },
  alternates: {
    canonical: "https://tendernotify.site/login",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}