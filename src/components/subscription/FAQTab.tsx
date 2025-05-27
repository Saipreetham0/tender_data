// "use client";

// import React, { useState } from "react";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle
// } from "@/components/ui/card";
// import {
//   ChevronDown,
//   ChevronUp,
//   HelpCircle,
//   Mail,
//   CreditCard,
//   RefreshCw,
//   Calendar,
//   Building2,
//   Globe
// } from "lucide-react";

// const faqs = [
//   {
//     question: "Can I change my plan anytime?",
//     answer: "Yes, you can upgrade or downgrade your plan at any time. When upgrading, you'll be charged the prorated difference immediately. When downgrading, the change will take effect at the end of your current billing period.",
//     icon: <RefreshCw className="h-5 w-5 text-blue-500" />
//   },
//   {
//     question: "What payment methods do you accept?",
//     answer: "We accept all major credit cards, debit cards, UPI, net banking, and popular wallets through Razorpay's secure payment gateway. All payments are processed in INR.",
//     icon: <CreditCard className="h-5 w-5 text-green-500" />
//   },
//   {
//     question: "Is there a refund policy?",
//     answer: "We offer a 7-day money-back guarantee for new subscriptions. If you're not satisfied with our service, contact us within 7 days of your first payment for a full refund.",
//     icon: <Calendar className="h-5 w-5 text-purple-500" />
//   },
//   {
//     question: "How do email alerts work?",
//     answer: "Free users receive weekly summary emails with a 2-3 day delay. Paid subscribers get real-time email alerts as soon as new tenders are published. You can customize which colleges you want to receive alerts for.",
//     icon: <Mail className="h-5 w-5 text-orange-500" />
//   },
//   {
//     question: "What happens when I cancel?",
//     answer: "When you cancel, you'll continue to have access to your paid features until the end of your current billing period. After that, your account will revert to the free plan. You can resubscribe anytime.",
//     icon: <RefreshCw className="h-5 w-5 text-red-500" />
//   },
//   {
//     question: "Can I get a custom plan for my organization?",
//     answer: "Yes! Our Enterprise plan offers custom pricing and features tailored to your organization's needs. Contact our sales team at sales@rgukttenders.com to discuss your requirements.",
//     icon: <Building2 className="h-5 w-5 text-indigo-500" />
//   },
//   {
//     question: "How frequently is tender data updated?",
//     answer: "Our system checks for new tenders every hour across all RGUKT campuses. Free users see new tenders with a delay, while paid subscribers get access to new tenders as soon as they're published.",
//     icon: <Globe className="h-5 w-5 text-teal-500" />
//   }
// ];

// const FAQTab: React.FC = () => {
//   const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

//   const toggleFAQ = (index: number) => {
//     setExpandedFAQ(expandedFAQ === index ? null : index);
//   };

//   return (
//     <div className="space-y-6">
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center">
//             <HelpCircle className="h-5 w-5 mr-2 text-blue-600" />
//             Frequently Asked Questions
//           </CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-4">
//             {faqs.map((faq, index) => (
//               <div
//                 key={index}
//                 className={`border rounded-lg overflow-hidden transition-all ${
//                   expandedFAQ === index ? "shadow-md" : ""
//                 }`}
//               >
//                 <button
//                   onClick={() => toggleFAQ(index)}
//                   className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
//                   aria-expanded={expandedFAQ === index}
//                   aria-controls={`faq-answer-${index}`}
//                 >
//                   <div className="flex items-center">
//                     {faq.icon}
//                     <span className="ml-3 font-medium">{faq.question}</span>
//                   </div>
//                   {expandedFAQ === index ? (
//                     <ChevronUp className="h-5 w-5 text-gray-500" />
//                   ) : (
//                     <ChevronDown className="h-5 w-5 text-gray-500" />
//                   )}
//                 </button>
//                 <div
//                   id={`faq-answer-${index}`}
//                   className={`px-4 overflow-hidden transition-all duration-300 ease-in-out ${
//                     expandedFAQ === index
//                       ? "max-h-60 pb-4 opacity-100"
//                       : "max-h-0 opacity-0"
//                   }`}
//                 >
//                   <p className="text-gray-600">{faq.answer}</p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </CardContent>
//       </Card>

//       <Card>
//         <CardHeader>
//           <CardTitle className="text-lg">Still have questions?</CardTitle>
//         </CardHeader>
//         <CardContent className="text-center">
//           <p className="mb-6 text-gray-600">
//             Our support team is ready to help you with any questions you might have about our subscription plans.
//           </p>
//           <div className="flex flex-col sm:flex-row justify-center gap-4">
//             <a
//               href="mailto:support@rgukttenders.com"
//               className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
//             >
//               <Mail className="h-4 w-4 mr-2" />
//               Email Support
//             </a>
//             <a
//               href="https://rgukttenders.com/contact"
//               className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
//             >
//               <HelpCircle className="h-4 w-4 mr-2" />
//               Contact Us
//             </a>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default FAQTab;


// src/components/subscription/FAQTab.tsx - UPDATED for Simple Payment System
"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Mail,
  CreditCard,
  Calendar,
  Building2,
  Globe,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";

const faqs = [
  {
    question: "How does the new payment system work?",
    answer: "We've simplified our system! You make a one-time payment and get access for a fixed period (1 month for monthly plans, 1 year for yearly plans). No automatic renewals or hidden charges. When your subscription expires, you simply purchase a new one if you want to continue.",
    icon: <CreditCard className="h-5 w-5 text-blue-500" />,
    category: "payment"
  },
  {
    question: "Will I be charged automatically each month/year?",
    answer: "No! Unlike traditional subscriptions, there are no automatic renewals. You pay once and get access for the purchased period. When it expires, you'll need to manually purchase a new subscription if you want to continue using premium features.",
    icon: <Calendar className="h-5 w-5 text-green-500" />,
    category: "billing"
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, debit cards, UPI, net banking, and popular wallets through Razorpay's secure payment gateway. All payments are processed in INR and are one-time charges.",
    icon: <CreditCard className="h-5 w-5 text-purple-500" />,
    category: "payment"
  },
  {
    question: "Is there a refund policy?",
    answer: "Yes! We offer a 7-day money-back guarantee for new subscriptions. If you're not satisfied with our service, contact us within 7 days of your payment for a full refund. Since these are one-time payments, refunds are simpler and faster.",
    icon: <CheckCircle className="h-5 w-5 text-green-500" />,
    category: "refund"
  },
  {
    question: "How do email alerts work?",
    answer: "Free users receive weekly summary emails with a 2-3 day delay. Paid subscribers get real-time email alerts as soon as new tenders are published. You can customize which colleges you want to receive alerts for based on your subscription plan.",
    icon: <Mail className="h-5 w-5 text-orange-500" />,
    category: "features"
  },
  {
    question: "What happens when my subscription expires?",
    answer: "When your subscription expires, you'll automatically revert to the free plan with limited features. You'll receive email reminders before expiry. To continue with premium features, simply purchase a new subscription - there's no penalty for gaps in subscription.",
    icon: <Clock className="h-5 w-5 text-amber-500" />,
    category: "expiry"
  },
  {
    question: "Can I upgrade or downgrade my plan?",
    answer: "Since these are fixed-duration subscriptions, you can't change your current plan mid-term. However, when your subscription expires, you can purchase any plan you prefer. This gives you complete flexibility to choose different plans based on your changing needs.",
    icon: <Building2 className="h-5 w-5 text-indigo-500" />,
    category: "plans"
  },
  {
    question: "How frequently is tender data updated?",
    answer: "Our system checks for new tenders every hour across all RGUKT campuses. Free users see new tenders with a 2-3 day delay, while paid subscribers get access to new tenders as soon as they're published with real-time email notifications.",
    icon: <Globe className="h-5 w-5 text-teal-500" />,
    category: "features"
  },
  {
    question: "Can I get a custom plan for my organization?",
    answer: "Yes! Our Enterprise plan offers custom pricing and features tailored to your organization's needs. Contact our sales team at sales@rgukttenders.com to discuss your requirements. Enterprise plans can include custom billing cycles and features.",
    icon: <Building2 className="h-5 w-5 text-indigo-500" />,
    category: "enterprise"
  },
  {
    question: "What are the advantages of this new system?",
    answer: "Our new system offers: 1) Complete transparency - no surprise charges, 2) User control - you decide when to renew, 3) Lower costs - no subscription management fees, 4) Simplicity - easier to understand and manage, 5) Flexibility - change plans anytime after expiry.",
    icon: <CheckCircle className="h-5 w-5 text-emerald-500" />,
    category: "benefits"
  }
];

const FAQTab: React.FC = () => {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const categories = [
    { id: "all", name: "All Questions", icon: <HelpCircle className="h-4 w-4" /> },
    { id: "payment", name: "Payments", icon: <CreditCard className="h-4 w-4" /> },
    { id: "billing", name: "Billing", icon: <Calendar className="h-4 w-4" /> },
    { id: "features", name: "Features", icon: <Globe className="h-4 w-4" /> },
    { id: "plans", name: "Plans", icon: <Building2 className="h-4 w-4" /> },
  ];

  const filteredFAQs = selectedCategory === "all"
    ? faqs
    : faqs.filter(faq => faq.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* New System Highlight */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-800">
            <CheckCircle className="h-5 w-5 mr-2" />
            New Simplified Payment System
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <p className="mb-3">
            We've simplified our subscription system for better transparency and user control:
          </p>
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
              <span>One-time payments, no auto-renewal</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
              <span>Clear expiry dates</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
              <span>No surprise charges</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
              <span>Complete user control</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Browse by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? "bg-blue-100 text-blue-800 border border-blue-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {category.icon}
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FAQ List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <HelpCircle className="h-5 w-5 mr-2 text-blue-600" />
            Frequently Asked Questions
            {selectedCategory !== "all" && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({filteredFAQs.length} questions)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredFAQs.map((faq, index) => (
              <div
                key={index}
                className={`border rounded-lg overflow-hidden transition-all ${
                  expandedFAQ === index ? "shadow-md border-blue-200" : "border-gray-200"
                }`}
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                  aria-expanded={expandedFAQ === index}
                  aria-controls={`faq-answer-${index}`}
                >
                  <div className="flex items-center">
                    {faq.icon}
                    <span className="ml-3 font-medium text-gray-900">{faq.question}</span>
                  </div>
                  {expandedFAQ === index ? (
                    <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  )}
                </button>
                <div
                  id={`faq-answer-${index}`}
                  className={`px-4 overflow-hidden transition-all duration-300 ease-in-out ${
                    expandedFAQ === index
                      ? "max-h-96 pb-4 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Still have questions?</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-6 text-gray-600">
            Our support team is ready to help you with any questions about our new simplified subscription system.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="mailto:support@rgukttenders.com"
              className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <Mail className="h-4 w-4 mr-2" />
              Email Support
            </a>
            <a
              href="https://rgukttenders.com/contact"
              className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Contact Us
            </a>
          </div>

          {/* Quick Contact Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Quick Response Times:</strong>
            </p>
            <div className="text-xs text-gray-500 space-y-1">
              <p>• Email support: Within 24 hours</p>
              <p>• Payment issues: Within 4 hours</p>
              <p>• Technical problems: Within 12 hours</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FAQTab;