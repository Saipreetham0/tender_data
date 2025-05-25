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
  RefreshCw,
  Calendar,
  Building2,
  Globe
} from "lucide-react";

const faqs = [
  {
    question: "Can I change my plan anytime?",
    answer: "Yes, you can upgrade or downgrade your plan at any time. When upgrading, you'll be charged the prorated difference immediately. When downgrading, the change will take effect at the end of your current billing period.",
    icon: <RefreshCw className="h-5 w-5 text-blue-500" />
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, debit cards, UPI, net banking, and popular wallets through Razorpay's secure payment gateway. All payments are processed in INR.",
    icon: <CreditCard className="h-5 w-5 text-green-500" />
  },
  {
    question: "Is there a refund policy?",
    answer: "We offer a 7-day money-back guarantee for new subscriptions. If you're not satisfied with our service, contact us within 7 days of your first payment for a full refund.",
    icon: <Calendar className="h-5 w-5 text-purple-500" />
  },
  {
    question: "How do email alerts work?",
    answer: "Free users receive weekly summary emails with a 2-3 day delay. Paid subscribers get real-time email alerts as soon as new tenders are published. You can customize which colleges you want to receive alerts for.",
    icon: <Mail className="h-5 w-5 text-orange-500" />
  },
  {
    question: "What happens when I cancel?",
    answer: "When you cancel, you'll continue to have access to your paid features until the end of your current billing period. After that, your account will revert to the free plan. You can resubscribe anytime.",
    icon: <RefreshCw className="h-5 w-5 text-red-500" />
  },
  {
    question: "Can I get a custom plan for my organization?",
    answer: "Yes! Our Enterprise plan offers custom pricing and features tailored to your organization's needs. Contact our sales team at sales@rgukttenders.com to discuss your requirements.",
    icon: <Building2 className="h-5 w-5 text-indigo-500" />
  },
  {
    question: "How frequently is tender data updated?",
    answer: "Our system checks for new tenders every hour across all RGUKT campuses. Free users see new tenders with a delay, while paid subscribers get access to new tenders as soon as they're published.",
    icon: <Globe className="h-5 w-5 text-teal-500" />
  }
];

const FAQTab: React.FC = () => {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <HelpCircle className="h-5 w-5 mr-2 text-blue-600" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`border rounded-lg overflow-hidden transition-all ${
                  expandedFAQ === index ? "shadow-md" : ""
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
                    <span className="ml-3 font-medium">{faq.question}</span>
                  </div>
                  {expandedFAQ === index ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </button>
                <div
                  id={`faq-answer-${index}`}
                  className={`px-4 overflow-hidden transition-all duration-300 ease-in-out ${
                    expandedFAQ === index
                      ? "max-h-60 pb-4 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Still have questions?</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-6 text-gray-600">
            Our support team is ready to help you with any questions you might have about our subscription plans.
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
        </CardContent>
      </Card>
    </div>
  );
};

export default FAQTab;