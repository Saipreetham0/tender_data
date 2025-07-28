import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tenders Dashboard - RGUKT Tenders Portal | Browse All Campus Tenders",
  description: "Browse and search tender opportunities from all RGUKT campuses. Filter by campus, category, and date. Access detailed tender information and download documents.",
  keywords: "RGUKT tenders browse, government tender search, campus tender filter, tender documents download, procurement opportunities",
  authors: [{ name: "RGUKT Tenders Portal" }],
  robots: "noindex, nofollow", // Private dashboard
  alternates: {
    canonical: "https://tendernotify.site/dashboard/tenders",
  },
};

export default function TendersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}