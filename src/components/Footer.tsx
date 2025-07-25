// 'use client';

// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Building2, Mail, Shield, Clock } from "lucide-react";
// import { useRouter } from "next/navigation";

// export default function Footer() {
//   const router = useRouter();

//   return (
//     <footer id="contact" className="bg-gray-900 text-white py-16">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="grid md:grid-cols-4 gap-8">
//           {/* Branding Section */}
//           <div className="col-span-2">
//             <div className="flex items-center space-x-3 mb-6">
//               <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
//                 <Building2 className="h-6 w-6 text-white" />
//               </div>
//               <div>
//                 <h3 className="text-xl font-bold">TendersNotify.site</h3>
//                 <p className="text-gray-400 text-sm">Your tender discovery platform</p>
//               </div>
//             </div>
//             <p className="text-gray-400 mb-6 max-w-md">
//               A new platform connecting you with tender opportunities across all RGUKT campuses.
//               Simple, efficient, and always improving.
//             </p>
//             <div className="flex space-x-4">
//               <Button
//                 variant="outline"
//                 size="sm"
//                 className="border-gray-600 text-gray-400 hover:text-white"
//               >
//                 <Mail className="h-4 w-4 mr-2" />
//                 info@kspdigitalsolutions.com
//               </Button>
//             </div>
//           </div>

//           {/* Product Links */}
//           <div>
//             <h4 className="font-semibold mb-4">Product</h4>
//             <ul className="space-y-2 text-gray-400 text-sm">
//               <li>
//                 <a href="#features" className="hover:text-white transition-colors">Features</a>
//               </li>
//               <li>
//                 <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
//               </li>
//               <li>
//                 <a href="#roadmap" className="hover:text-white transition-colors">Roadmap</a>
//               </li>
//               <li>
//                 <button
//                   onClick={() => router.push("/subscription")}
//                   className="hover:text-white transition-colors"
//                 >
//                   Get Started
//                 </button>
//               </li>
//             </ul>
//           </div>

//           {/* Support Links */}
//           <div>
//             <h4 className="font-semibold mb-4">Support</h4>
//             <ul className="space-y-2 text-gray-400 text-sm">
//               <li>
//                 <a href="/#help" className="hover:text-white transition-colors">Help Center</a>
//               </li>
//               <li>
//                 <a href="/#contact" className="hover:text-white transition-colors">Contact Us</a>
//               </li>
//               <li>
//                 <a href="/#feature-request" className="hover:text-white transition-colors">Feature Requests</a>
//               </li>
//               <li>
//                 <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
//               </li>
//             </ul>
//           </div>
//         </div>

//         {/* Bottom Section */}
//         <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
//           <p className="text-gray-400 text-sm">
//             &copy; {new Date().getFullYear()} TendersNotify.site. All rights reserved.
//           </p>
//           <div className="flex items-center space-x-4 mt-4 md:mt-0">
//             <Badge variant="outline" className="border-gray-600 text-gray-400">
//               <Shield className="h-3 w-3 mr-1" />
//               Secure Platform
//             </Badge>
//             <Badge variant="outline" className="border-gray-600 text-gray-400">
//               <Clock className="h-3 w-3 mr-1" />
//               24/7 Monitoring
//             </Badge>
//           </div>
//         </div>
//       </div>
//     </footer>
//   );
// }


'use client';

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Mail, Shield, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Footer() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <footer id="contact" className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Branding Section */}
          <div className="col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">TendersNotify.site</h3>
                <p className="text-gray-400 text-sm">Your tender discovery platform</p>
              </div>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              A new platform connecting you with tender opportunities across all RGUKT campuses.
              Simple, efficient, and always improving.
            </p>
            <div className="flex space-x-4">
              <Button
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-400 hover:text-white"
              >
                <Mail className="h-4 w-4 mr-2" />
                info@kspdigitalsolutions.com
              </Button>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#features" className="hover:text-white">Features</a></li>
              <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
              <li><a href="#roadmap" className="hover:text-white">Roadmap</a></li>
              <li>
                <button
                  onClick={() => {
                    if (isClient) {
                      router.push("/subscription");
                    }
                  }}
                  className="hover:text-white"
                >
                  Get Started
                </button>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="/#help" className="hover:text-white">Help Center</a></li>
              <li><a href="/#contact" className="hover:text-white">Contact Us</a></li>
              <li><a href="/#feature-request" className="hover:text-white">Feature Requests</a></li>
              <li><a href="/privacy" className="hover:text-white">Privacy Policy</a></li>
            </ul>
          </div>
        </div>

        {/* Legal and Bottom Section */}
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col items-center space-y-4 md:flex-row md:justify-between md:space-y-0">
          <p className="text-gray-400 text-sm text-center">
            &copy; {new Date().getFullYear()} TendersNotify.site. All rights reserved.
          </p>

          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-gray-400">
            <a href="/terms" className="hover:underline">Terms</a>
            <a href="/privacy" className="hover:underline">Privacy</a>
            <a href="/refund" className="hover:underline">Refund</a>
            <a href="/disclaimer" className="hover:underline">Disclaimer</a>
            <a href="/cookies" className="hover:underline">Cookies</a>
          </div>

          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="border-gray-600 text-gray-400">
              <Shield className="h-3 w-3 mr-1" />
              Secure Platform
            </Badge>
            <Badge variant="outline" className="border-gray-600 text-gray-400">
              <Clock className="h-3 w-3 mr-1" />
              24/7 Monitoring
            </Badge>
          </div>
        </div>
      </div>
    </footer>
  );
}
