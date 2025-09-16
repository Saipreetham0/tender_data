// "use client";

// import React from "react";
// import { Badge } from "@/components/ui/badge";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Shield, RefreshCw, Zap, Award, CheckCircle } from "lucide-react";
// import { SubscriptionPlan, UserSubscription } from "@/types/subscription";
// import PlanCard from "./PlanCard";

// interface PlansTabProps {
//   plans: SubscriptionPlan[];
//   currentSubscription: UserSubscription | null;
//   billingCycle: "monthly" | "yearly";
//   setBillingCycle: (cycle: "monthly" | "yearly") => void;
//   processingPlanId: string | null;
//   handleSubscribe: (planId: string) => void;
//   user: any | null;
//   router: any;
// }

// const PlansTab: React.FC<PlansTabProps> = ({
//   plans,
//   currentSubscription,
//   billingCycle,
//   setBillingCycle,
//   processingPlanId,
//   handleSubscribe,
//   user,
//   router,
// }) => {
//   return (
//     <div className="space-y-8">
//       {/* Billing Toggle */}
//       <div className="flex justify-center items-center space-x-4">
//         <span
//           className={
//             billingCycle === "monthly"
//               ? "font-semibold text-gray-900"
//               : "text-gray-500"
//           }
//         >
//           Monthly
//         </span>
//         <button
//           onClick={() =>
//             setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")
//           }
//           className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
//             billingCycle === "yearly" ? "bg-blue-600" : "bg-gray-200"
//           }`}
//           aria-label={`Switch to ${billingCycle === "monthly" ? "yearly" : "monthly"} billing`}
//         >
//           <span
//             className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
//               billingCycle === "yearly" ? "translate-x-6" : "translate-x-1"
//             }`}
//           />
//         </button>
//         <span
//           className={
//             billingCycle === "yearly"
//               ? "font-semibold text-gray-900"
//               : "text-gray-500"
//           }
//         >
//           Yearly
//         </span>
//         {billingCycle === "yearly" && (
//           <Badge className="bg-green-100 text-green-800 border-green-200 ml-2">
//             <Zap className="h-3 w-3 mr-1" />
//             Save up to 73%
//           </Badge>
//         )}
//       </div>

//       {/* Pricing Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
//         {plans.map((plan) => (
//           <PlanCard
//             key={plan.id}
//             plan={plan}
//             billingCycle={billingCycle}
//             isCurrentPlan={currentSubscription?.plan.id === plan.id}
//             processingPlanId={processingPlanId}
//             onSubscribe={handleSubscribe}
//             user={user}
//             router={router}
//           />
//         ))}
//       </div>

//       {/* Trust Badges */}
//       <div className="mt-12 text-center">
//         <div className="flex flex-wrap justify-center items-center gap-8">
//           <div className="flex items-center space-x-2">
//             <Shield className="h-5 w-5 text-green-500" />
//             <span className="text-sm text-gray-600">Secure Payments</span>
//           </div>
//           <div className="flex items-center space-x-2">
//             <RefreshCw className="h-5 w-5 text-blue-500" />
//             <span className="text-sm text-gray-600">Cancel Anytime</span>
//           </div>
//           <div className="flex items-center space-x-2">
//             <Zap className="h-5 w-5 text-yellow-500" />
//             <span className="text-sm text-gray-600">Instant Access</span>
//           </div>
//           <div className="flex items-center space-x-2">
//             <Award className="h-5 w-5 text-purple-500" />
//             <span className="text-sm text-gray-600">7-Day Guarantee</span>
//           </div>
//         </div>
//       </div>

//       {/* Feature Comparison Table */}
//       <Card className="mt-12">
//         <CardHeader>
//           <CardTitle>Detailed Feature Comparison</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead>
//                 <tr className="border-b">
//                   <th className="text-left py-3 px-4">Feature</th>
//                   {plans.map((plan) => (
//                     <th
//                       key={plan.id}
//                       className="text-center py-3 px-4 min-w-[120px]"
//                     >
//                       {plan.name}
//                     </th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody>
//                 <tr className="border-b">
//                   <td className="py-3 px-4 font-medium">Colleges Access</td>
//                   {plans.map((plan) => (
//                     <td key={plan.id} className="text-center py-3 px-4">
//                       {plan.colleges_access === 6
//                         ? "All 6"
//                         : `${plan.colleges_access} college`}
//                     </td>
//                   ))}
//                 </tr>
//                 <tr className="border-b">
//                   <td className="py-3 px-4 font-medium">Email Alerts</td>
//                   {plans.map((plan) => (
//                     <td key={plan.id} className="text-center py-3 px-4">
//                       {plan.alert_type === "realtime" ? "Real-time" : "Weekly"}
//                     </td>
//                   ))}
//                 </tr>
//                 <tr className="border-b">
//                   <td className="py-3 px-4 font-medium">Alert Delay</td>
//                   {plans.map((plan) => (
//                     <td key={plan.id} className="text-center py-3 px-4">
//                       {plan.alert_delay_days > 0
//                         ? `${plan.alert_delay_days} days`
//                         : "Instant"}
//                     </td>
//                   ))}
//                 </tr>
//                 <tr className="border-b">
//                   <td className="py-3 px-4 font-medium">Keyword Filter</td>
//                   {plans.map((plan) => (
//                     <td key={plan.id} className="text-center py-3 px-4">
//                       {plan.has_keyword_filter ? (
//                         <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
//                       ) : (
//                         <span className="text-red-500">✕</span>
//                       )}
//                     </td>
//                   ))}
//                 </tr>
//                 <tr className="border-b">
//                   <td className="py-3 px-4 font-medium">Advanced Filters</td>
//                   {plans.map((plan) => (
//                     <td key={plan.id} className="text-center py-3 px-4">
//                       {plan.has_advanced_filters ? (
//                         <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
//                       ) : (
//                         <span className="text-red-500">✕</span>
//                       )}
//                     </td>
//                   ))}
//                 </tr>
//                 <tr className="border-b">
//                   <td className="py-3 px-4 font-medium">API Access</td>
//                   {plans.map((plan) => (
//                     <td key={plan.id} className="text-center py-3 px-4">
//                       {plan.has_api_access ? (
//                         <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
//                       ) : (
//                         <span className="text-red-500">✕</span>
//                       )}
//                     </td>
//                   ))}
//                 </tr>
//                 <tr className="border-b">
//                   <td className="py-3 px-4 font-medium">Priority Support</td>
//                   {plans.map((plan) => (
//                     <td key={plan.id} className="text-center py-3 px-4">
//                       {plan.has_priority_support ? (
//                         <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
//                       ) : (
//                         <span className="text-red-500">✕</span>
//                       )}
//                     </td>
//                   ))}
//                 </tr>
//               </tbody>
//             </table>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default PlansTab;



"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, RefreshCw, Zap, Award, CheckCircle } from "lucide-react";
import { SubscriptionPlan, UserSubscription } from "@/types/subscription";
import PlanCard from "./PlanCard";

interface User {
  id?: string;
  email?: string;
  // Add other user properties as needed
}

interface Router {
  push: (path: string) => void;
  // Add other router properties as needed
}

interface PlansTabProps {
  plans: SubscriptionPlan[];
  currentSubscription: UserSubscription | null;
  billingCycle: "monthly" | "yearly";
  setBillingCycle: (cycle: "monthly" | "yearly") => void;
  processingPlanId: string | null;
  handleSubscribe: (planId: string) => void;
  user: User | null;
  router: Router;
}

const PlansTab: React.FC<PlansTabProps> = ({
  plans,
  currentSubscription,
  billingCycle,
  setBillingCycle,
  processingPlanId,
  handleSubscribe,
  user,
  router,
}) => {
  // Use the first plan from database (should be our All Access plan)
  const allAccessPlan = plans[0];

  // Show loading state if no plans are available yet
  if (!allAccessPlan) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Simple Pricing Card */}
      <div className="max-w-md mx-auto">
        <Card className="border border-gray-200 shadow-lg">
          <div className="text-center p-2 bg-blue-600 text-white text-sm font-medium rounded-t-lg">
            Most Popular
          </div>
          
          <CardHeader className="text-center pt-6 pb-4">
            <CardTitle className="text-2xl font-bold text-gray-900">
              {allAccessPlan.name}
            </CardTitle>
            <p className="text-gray-600 mt-2">
              {allAccessPlan.description}
            </p>
            
            {/* Price */}
            <div className="mt-6">
              <div className="flex items-baseline justify-center">
                <span className="text-4xl font-bold text-gray-900">₹{allAccessPlan.price_yearly}</span>
                <span className="text-lg text-gray-600 ml-1">/year</span>
              </div>
              <p className="text-sm text-green-600 mt-2">
                Save ₹{(allAccessPlan.price_monthly * 12) - allAccessPlan.price_yearly} (Only ₹{Math.round(allAccessPlan.price_yearly / 12)}/month)
              </p>
            </div>
          </CardHeader>

          <CardContent className="px-6 pb-6">
            {/* Features */}
            <div className="space-y-3 mb-6">
              {allAccessPlan.features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <button
              onClick={() => handleSubscribe(allAccessPlan.id)}
              disabled={processingPlanId === allAccessPlan.id}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
            >
              {processingPlanId === allAccessPlan.id ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                "Subscribe Now"
              )}
            </button>

            {/* Trust indicators */}
            <div className="mt-4 text-center text-sm text-gray-600">
              <p>✓ 7-day money-back guarantee</p>
              <p>✓ Cancel anytime • Secure payment</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Simple Features */}
      <div className="max-w-2xl mx-auto text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          What's Included
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-left">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            <span>All 6 RGUKT Campuses</span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            <span>Real-time Email Alerts</span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            <span>Advanced Search</span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            <span>Priority Support</span>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Trusted by 500+ professionals</strong> • 99.9% uptime • 24/7 monitoring
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlansTab;