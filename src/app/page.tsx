// // app/page.tsx
// "use client";
// import TenderDashboard from "@/components/Dashboard";

// export default function Home() {
//   return <TenderDashboard />;
// }


// src/app/page.tsx - Updated main page
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}

// Create src/components/AuthComponents.tsx (separate file)
// Move all auth components from the artifact to this file
