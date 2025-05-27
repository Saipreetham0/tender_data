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
import type { Metadata } from "next";
import { Inter } from "next/font/google";
// import { initDatabase } from "@/lib/db-schema";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/NavBar";
// import { initializeApp } from "@/lib/app-init";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RGUKT Tenders Portal",
  description:
    "Comprehensive tender information from various RGUKT campuses with subscription features",
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
        {/* Add Razorpay script for payments */}
        <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

// src/components/auth/AuthComponents.tsx
// Move the auth components to a separate file
export * from "@/components/AuthComponents";
