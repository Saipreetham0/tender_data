// "use client";

// import React from "react";
// import { SubscriptionPlan } from "@/types/subscription";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import {
//   Star,
//   Loader2,
//   X,
//   CreditCard,
//   CheckCircle,
//   Crown,
//   Zap,
//   Building2,
//   Mail,
//   Filter,
//   Code,
//   Clock,
//   HeadphonesIcon,
//   TrendingUp,
//   Users,
// } from "lucide-react";
// import {
//   formatPrice,
//   calculateYearlySavings,
//   getFeatureIcon,
//   getFeatureIconColor,
// } from "@/utils/subscription";

// interface PlanCardProps {
//   plan: SubscriptionPlan;
//   billingCycle: "monthly" | "yearly";
//   isCurrentPlan: boolean;
//   processingPlanId: string | null;
//   onSubscribe: (planId: string) => void;
//   user: any | null;
//   router: any;
// }

// const PlanCard: React.FC<PlanCardProps> = ({
//   plan,
//   billingCycle,
//   isCurrentPlan,
//   processingPlanId,
//   onSubscribe,
//   user,
//   router,
// }) => {
//   const price =
//     billingCycle === "yearly" ? plan.price_yearly : plan.price_monthly;
//   const isFree = plan.name === "Free";
//   const isEnterprise = plan.name === "Enterprise";

//   // Map icon names to actual components
//   const iconMap: Record<string, React.ReactNode> = {
//     Users: <Users className="h-6 w-6" />,
//     Mail: <Mail className="h-6 w-6" />,
//     Building2: <Building2 className="h-6 w-6" />,
//     Zap: <Zap className="h-6 w-6" />,
//     Crown: <Crown className="h-6 w-6" />,
//     Star: <Star className="h-6 w-6" />,
//   };

//   const featureIconMap: Record<string, React.ReactNode> = {
//     Building2: (
//       <Building2 className={`h-4 w-4 ${getFeatureIconColor("Building2")}`} />
//     ),
//     Mail: <Mail className={`h-4 w-4 ${getFeatureIconColor("Mail")}`} />,
//     Filter: <Filter className={`h-4 w-4 ${getFeatureIconColor("Filter")}`} />,
//     Code: <Code className={`h-4 w-4 ${getFeatureIconColor("Code")}`} />,
//     HeadphonesIcon: (
//       <HeadphonesIcon
//         className={`h-4 w-4 ${getFeatureIconColor("HeadphonesIcon")}`}
//       />
//     ),
//     Clock: <Clock className={`h-4 w-4 ${getFeatureIconColor("Clock")}`} />,
//     TrendingUp: (
//       <TrendingUp className={`h-4 w-4 ${getFeatureIconColor("TrendingUp")}`} />
//     ),
//     CheckCircle: (
//       <CheckCircle
//         className={`h-4 w-4 ${getFeatureIconColor("CheckCircle")}`}
//       />
//     ),
//   };

//   const getPlanIconComponent = (name: string) => {
//     const iconName = getFeatureIcon(name);
//     return iconMap[iconName] || iconMap["Star"];
//   };

//   const getFeatureIconComponent = (feature: string) => {
//     const iconName = getFeatureIcon(feature);
//     return featureIconMap[iconName] || featureIconMap["CheckCircle"];
//   };

//   return (
//     <Card
//       className={`relative flex flex-col h-full transition-all hover:shadow-md ${
//         plan.popular
//           ? "border-blue-500 shadow-xl scale-105 z-10"
//           : "border-gray-200 hover:shadow-lg"
//       } ${isCurrentPlan ? "ring-2 ring-blue-500" : ""}`}
//     >
//       {plan.popular && (
//         <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
//           <Badge className="bg-blue-600 text-white px-4 py-1">
//             <Star className="h-3 w-3 mr-1" />
//             Most Popular
//           </Badge>
//         </div>
//       )}

//       <CardHeader className="text-center pb-2">
//         <div className="mx-auto mb-4 p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full w-fit">
//           {getPlanIconComponent(plan.name)}
//         </div>
//         <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
//         <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
//       </CardHeader>

//       <CardContent className="flex-grow flex flex-col">
//         <div className="text-center mb-6">
//           {isEnterprise ? (
//             <div>
//               <p className="text-3xl font-bold">Custom</p>
//               <p className="text-sm text-gray-500">Contact us for pricing</p>
//             </div>
//           ) : (
//             <>
//               <span className="text-3xl font-bold">{formatPrice(price)}</span>
//               {!isFree && (
//                 <span className="text-gray-500 text-sm">
//                   /{billingCycle === "yearly" ? "year" : "month"}
//                 </span>
//               )}
//               {billingCycle === "yearly" &&
//                 !isFree &&
//                 plan.price_yearly > 0 && (
//                   <p className="text-sm text-green-600 font-medium mt-1">
//                     Save{" "}
//                     {calculateYearlySavings(
//                       plan.price_monthly,
//                       plan.price_yearly
//                     )}
//                     %
//                   </p>
//                 )}
//             </>
//           )}
//         </div>

//         <ul className="space-y-3 mb-6 flex-grow">
//           {plan.features.map((feature, index) => (
//             <li key={index} className="flex items-start gap-2">
//               {feature.startsWith("🚫") ? (
//                 <>
//                   <X className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
//                   <span className="text-sm text-gray-500 line-through">
//                     {feature.replace("🚫 ", "")}
//                   </span>
//                 </>
//               ) : (
//                 <>
//                   {getFeatureIconComponent(feature)}
//                   <span className="text-sm text-gray-700">{feature}</span>
//                 </>
//               )}
//             </li>
//           ))}
//         </ul>

//         <div className="mt-auto">
//           {isCurrentPlan ? (
//             <Button disabled className="w-full">
//               <CheckCircle className="h-4 w-4 mr-2" />
//               Current Plan
//             </Button>
//           ) : isFree ? (
//             <Button
//               variant="outline"
//               className="w-full"
//               onClick={() => {
//                 if (!user && typeof window !== 'undefined') {
//                   router.push("/login");
//                 }
//               }}
//             >
//               {user ? "Current Plan" : "Start Free"}
//             </Button>
//           ) : isEnterprise ? (
//             <Button
//               variant="outline"
//               className="w-full"
//               onClick={() =>
//                 (window.location.href = "mailto:sales@rgukttenders.com")
//               }
//             >
//               Contact Sales
//             </Button>
//           ) : (
//             <Button
//               onClick={() => onSubscribe(plan.id)}
//               className="w-full bg-blue-600 hover:bg-blue-700"
//               disabled={processingPlanId === plan.id}
//             >
//               {processingPlanId === plan.id ? (
//                 <>
//                   <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                   Processing...
//                 </>
//               ) : (
//                 <>
//                   <CreditCard className="h-4 w-4 mr-2" />
//                   Subscribe Now
//                 </>
//               )}
//             </Button>
//           )}
//         </div>
//       </CardContent>
//     </Card>
//   );
// };

// export default PlanCard;


"use client";

import React from "react";
import { SubscriptionPlan } from "@/types/subscription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  Loader2,
  X,
  CreditCard,
  CheckCircle,
  Crown,
  Zap,
  Building2,
  Mail,
  Filter,
  Code,
  Clock,
  HeadphonesIcon,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  formatPrice,
  calculateYearlySavings,
  getFeatureIcon,
  getFeatureIconColor,
} from "@/utils/subscription";

interface User {
  id?: string;
  email?: string;
  // Add other user properties as needed
}

interface Router {
  push: (path: string) => void;
  // Add other router properties as needed
}

interface PlanCardProps {
  plan: SubscriptionPlan;
  billingCycle: "monthly" | "yearly";
  isCurrentPlan: boolean;
  processingPlanId: string | null;
  onSubscribe: (planId: string) => void;
  user: User | null;
  router: Router;
}

const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  billingCycle,
  isCurrentPlan,
  processingPlanId,
  onSubscribe,
  user,
  router,
}) => {
  const price =
    billingCycle === "yearly" ? plan.price_yearly : plan.price_monthly;
  const isFree = plan.name === "Free";
  const isEnterprise = plan.name === "Enterprise";

  // Map icon names to actual components
  const iconMap: Record<string, React.ReactNode> = {
    Users: <Users className="h-6 w-6" />,
    Mail: <Mail className="h-6 w-6" />,
    Building2: <Building2 className="h-6 w-6" />,
    Zap: <Zap className="h-6 w-6" />,
    Crown: <Crown className="h-6 w-6" />,
    Star: <Star className="h-6 w-6" />,
  };

  const featureIconMap: Record<string, React.ReactNode> = {
    Building2: (
      <Building2 className={`h-4 w-4 ${getFeatureIconColor("Building2")}`} />
    ),
    Mail: <Mail className={`h-4 w-4 ${getFeatureIconColor("Mail")}`} />,
    Filter: <Filter className={`h-4 w-4 ${getFeatureIconColor("Filter")}`} />,
    Code: <Code className={`h-4 w-4 ${getFeatureIconColor("Code")}`} />,
    HeadphonesIcon: (
      <HeadphonesIcon
        className={`h-4 w-4 ${getFeatureIconColor("HeadphonesIcon")}`}
      />
    ),
    Clock: <Clock className={`h-4 w-4 ${getFeatureIconColor("Clock")}`} />,
    TrendingUp: (
      <TrendingUp className={`h-4 w-4 ${getFeatureIconColor("TrendingUp")}`} />
    ),
    CheckCircle: (
      <CheckCircle
        className={`h-4 w-4 ${getFeatureIconColor("CheckCircle")}`}
      />
    ),
  };

  const getPlanIconComponent = (name: string) => {
    const iconName = getFeatureIcon(name);
    return iconMap[iconName] || iconMap["Star"];
  };

  const getFeatureIconComponent = (feature: string) => {
    const iconName = getFeatureIcon(feature);
    return featureIconMap[iconName] || featureIconMap["CheckCircle"];
  };

  return (
    <Card
      className={`relative flex flex-col h-full transition-all hover:shadow-md ${
        plan.popular
          ? "border-blue-500 shadow-xl scale-105 z-10"
          : "border-gray-200 hover:shadow-lg"
      } ${isCurrentPlan ? "ring-2 ring-blue-500" : ""}`}
    >
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-blue-600 text-white px-4 py-1">
            <Star className="h-3 w-3 mr-1" />
            Most Popular
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-4 p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full w-fit">
          {getPlanIconComponent(plan.name)}
        </div>
        <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
        <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
      </CardHeader>

      <CardContent className="flex-grow flex flex-col">
        <div className="text-center mb-6">
          {isEnterprise ? (
            <div>
              <p className="text-3xl font-bold">Custom</p>
              <p className="text-sm text-gray-500">Contact us for pricing</p>
            </div>
          ) : (
            <>
              <span className="text-3xl font-bold">{formatPrice(price)}</span>
              {!isFree && (
                <span className="text-gray-500 text-sm">
                  /{billingCycle === "yearly" ? "year" : "month"}
                </span>
              )}
              {billingCycle === "yearly" &&
                !isFree &&
                plan.price_yearly > 0 && (
                  <p className="text-sm text-green-600 font-medium mt-1">
                    Save{" "}
                    {calculateYearlySavings(
                      plan.price_monthly,
                      plan.price_yearly
                    )}
                    %
                  </p>
                )}
            </>
          )}
        </div>

        <ul className="space-y-3 mb-6 flex-grow">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              {feature.startsWith("🚫") ? (
                <>
                  <X className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-500 line-through">
                    {feature.replace("🚫 ", "")}
                  </span>
                </>
              ) : (
                <>
                  {getFeatureIconComponent(feature)}
                  <span className="text-sm text-gray-700">{feature}</span>
                </>
              )}
            </li>
          ))}
        </ul>

        <div className="mt-auto">
          {isCurrentPlan ? (
            <Button disabled className="w-full">
              <CheckCircle className="h-4 w-4 mr-2" />
              Current Plan
            </Button>
          ) : isFree ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                if (!user && typeof window !== 'undefined') {
                  router.push("/login");
                }
              }}
            >
              {user ? "Current Plan" : "Start Free"}
            </Button>
          ) : isEnterprise ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() =>
                (window.location.href = "mailto:sales@rgukttenders.com")
              }
            >
              Contact Sales
            </Button>
          ) : (
            <Button
              onClick={() => onSubscribe(plan.id)}
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={processingPlanId === plan.id}
            >
              {processingPlanId === plan.id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Subscribe Now
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PlanCard;