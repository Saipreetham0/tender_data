// src/app/page.tsx - Home page with NavBar
"use client";

import Navbar from "@/components/NavBar";
import Footer from "@/components/Footer";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Mail,
  Code,
  CheckCircle,
  Star,
  ArrowRight,
  TrendingUp,
  // Shield,
  // Clock,
  Globe,
  Crown,
  //   Menu,
  //   X,
  RefreshCw,
  Search,
  Download,
} from "lucide-react";
import { OptimizedButton } from "@/components/ui/OptimizedButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const LandingPage = () => {
  const router = useRouter();
  //   const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "yearly"
  );
  //   const [scrollY, setScrollY] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // const handleScroll = () => setScrollY(window.scrollY);
    // window.addEventListener("scroll", handleScroll);
    // return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSubscriptionRedirect = () => {
    if (isMounted) {
      router.push("/subscription");
    }
  };

  const handleHomeRedirect = () => {
    if (isMounted) {
      router.push("/");
    }
  };

  const toggleBillingCycle = () => {
    if (isMounted) {
      setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly");
    }
  };

  const features = [
    {
      icon: <Building2 className="h-8 w-8" />,
      title: "All RGUKT Campuses",
      description:
        "Access tenders from all 6 RGUKT campuses in one unified platform.",
      highlights: [
        "RGUKT Main Campus",
        "Basar, Ongole, RK Valley",
        "Srikakulam & Nuzvidu",
      ],
      color: "from-green-500 to-green-600",
    },
    {
      icon: <Mail className="h-8 w-8" />,
      title: "Email Notifications",
      description:
        "Stay updated with regular email summaries of new tenders posted across campuses.",
      highlights: [
        "Weekly email summaries",
        "New tender alerts",
        "Custom campus selection",
      ],
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: <RefreshCw className="h-8 w-8" />,
      title: "Auto-Updated Data",
      description:
        "Our system automatically checks and updates tender information every hour.",
      highlights: [
        "Hourly data refresh",
        "Latest tender information",
        "No manual checking needed",
      ],
      color: "from-purple-500 to-purple-600",
    },
    {
      icon: <Search className="h-8 w-8" />,
      title: "Easy Search",
      description:
        "Quickly find specific tenders with our simple and intuitive search functionality.",
      highlights: [
        "Basic text search",
        "Browse by campus",
        "Simple navigation",
      ],
      color: "from-orange-500 to-orange-600",
    },
    {
      icon: <Download className="h-8 w-8" />,
      title: "Direct Downloads",
      description:
        "Access all tender documents and notifications with direct download links.",
      highlights: ["PDF downloads", "Document access", "Official tender files"],
      color: "from-red-500 to-red-600",
    },
    {
      icon: <Code className="h-8 w-8" />,
      title: "Simple & Clean",
      description:
        "User-friendly interface designed for easy navigation and quick access to information.",
      highlights: ["Clean design", "Easy navigation", "Fast loading"],
      color: "from-indigo-500 to-indigo-600",
    },
  ];

  const plans = [
    {
      name: "All Access",
      price: { monthly: 125, yearly: 1499 },
      description: "Complete tender discovery solution",
      features: [
        "All 6 RGUKT campuses",
        "Real-time email alerts",
        "Unlimited tender views",
        "Advanced search & filtering",
        "Priority email support",
        "Custom notifications",
        "API access (coming soon)",
        "Analytics dashboard",
        "Early access to new features",
        "24/7 support",
      ],
      popular: true,
      cta: "Get Started",
    },
  ];

  const stats = [
    { number: "6", label: "RGUKT Campuses" },
    { number: "New", label: "Platform" },
    { number: "24/7", label: "Monitoring" },
    { number: "100%", label: "Free Trial" },
  ];

  const upcomingFeatures = [
    {
      title: "Advanced Filtering",
      description: "Filter tenders by amount, category, and closing date",
      timeline: "Coming Soon",
    },
    {
      title: "Real-time Notifications",
      description: "Instant alerts as soon as tenders are published",
      timeline: "Coming Soon",
    },
    {
      title: "Mobile App",
      description: "Native mobile apps for iOS and Android",
      timeline: "Coming Soon",
    },
    {
      title: "Analytics Dashboard",
      description: "Track trends and analyze tender patterns",
      timeline: "Coming Soon",
    },
  ];

  //   const scrollToSection = (sectionId: string) => {
  //     document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
  //     setIsMenuOpen(false);
  //   };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative pt-16 pb-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"></div>
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-10 w-20 h-20 bg-blue-400/10 rounded-full animate-pulse"></div>
            <div
              className="absolute top-1/3 right-10 w-16 h-16 bg-purple-400/10 rounded-full animate-pulse"
              style={{ animationDelay: "2s" }}
            ></div>
            <div
              className="absolute bottom-1/4 left-1/4 w-12 h-12 bg-indigo-400/10 rounded-full animate-pulse"
              style={{ animationDelay: "4s" }}
            ></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
            <div className="text-center">
              <Badge className="inline-flex items-center mb-8 bg-green-100 text-green-800 border-green-200">
                <Star className="w-4 h-4 mr-2" />
                New Platform - Now Live!
              </Badge>

              <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
                Your Gateway to
                <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  RGUKT Tenders
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
                Discover tender opportunities from all RGUKT campuses in one
                place. Get email notifications, browse easily, and never miss an
                opportunity again.
              </p>

              <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16">
                <OptimizedButton
                  size="lg"
                  onClick={handleSubscriptionRedirect}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  <span>Get Started - ₹1,499/year</span>
                  <ArrowRight className="ml-2 h-5 w-5" />
                </OptimizedButton>

                <OptimizedButton
                  variant="outline"
                  size="lg"
                  onClick={handleHomeRedirect}
                  className="px-8 py-4 text-lg border-2 hover:bg-gray-50"
                >
                  <Globe className="mr-2 h-5 w-5" />
                  <span>View Tenders</span>
                </OptimizedButton>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {stat.number}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Everything You Need
                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Right Now
                </span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Start with essential features to discover and track RGUKT
                tenders. More advanced features are coming soon!
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-2 border-0 shadow-md"
                >
                  <CardHeader>
                    <div
                      className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <div className="text-white">{feature.icon}</div>
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 mb-3">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{feature.description}</p>
                    <ul className="space-y-2">
                      {feature.highlights.map((highlight, idx) => (
                        <li
                          key={idx}
                          className="flex items-center text-sm text-gray-500"
                        >
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3"></div>
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Roadmap Section */}
        <section id="roadmap" className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                What&apos;s Coming Next?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                We&apos;re constantly improving. Here&apos;s what&apos;s on our
                roadmap to make your tender discovery even better.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {upcomingFeatures.map((feature, index) => (
                <Card key={index} className="border-0 shadow-lg">
                  <CardContent className="p-8">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900">
                        {feature.title}
                      </h3>
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200"
                      >
                        {feature.timeline}
                      </Badge>
                    </div>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <p className="text-gray-600 mb-6">
                Want to influence our roadmap? We&apos;d love to hear your
                suggestions!
              </p>
              <OptimizedButton variant="outline" size="lg">
                <Mail className="mr-2 h-5 w-5" />
                Share Your Ideas
              </OptimizedButton>
            </div>
          </div>
        </section>

        {/* Social Proof Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold text-white mb-4">
              Join the Future of Tender Discovery
            </h2>
            <p className="text-xl text-blue-100 mb-16">
              Be among the first to experience a better way to discover RGUKT
              tenders
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <Building2 className="h-12 w-12 text-white mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">
                  All Campuses
                </h3>
                <p className="text-blue-100">
                  Complete coverage of RGUKT tender ecosystem
                </p>
              </div>
              <div className="text-center">
                <RefreshCw className="h-12 w-12 text-white mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">
                  Always Updated
                </h3>
                <p className="text-blue-100">
                  Automatic updates every hour, 24/7
                </p>
              </div>
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-white mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">
                  Growing Fast
                </h3>
                <p className="text-blue-100">
                  New features and improvements every month
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                One Plan,
                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  All Features
                </span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                Everything you need to discover RGUKT tenders. No tiers, no
                limitations. Cancel anytime.
              </p>

              {/* Billing Toggle */}
              <div className="flex justify-center items-center space-x-4 mb-12">
                <span
                  className={`font-medium ${billingCycle === "monthly" ? "text-gray-900" : "text-gray-500"}`}
                >
                  Monthly
                </span>
                <button
                  onClick={toggleBillingCycle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    billingCycle === "yearly" ? "bg-blue-600" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      billingCycle === "yearly"
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
                <span
                  className={`font-medium ${billingCycle === "yearly" ? "text-gray-900" : "text-gray-500"}`}
                >
                  Yearly
                </span>
                {billingCycle === "yearly" && (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    Save ₹1 annually
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex justify-center">
              <div className="max-w-md w-full">
                {plans.map((plan, index) => (
                  <Card
                    key={index}
                    className="relative border-2 border-blue-500 shadow-xl"
                  >
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-600 text-white px-4 py-1">
                        <Crown className="h-3 w-3 mr-1" />
                        Best Value
                      </Badge>
                    </div>

                    <CardHeader className="text-center pb-2">
                      <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                        {plan.name}
                      </CardTitle>
                      <div className="text-4xl font-bold text-gray-900 mb-2">
                        ₹{plan.price[billingCycle].toLocaleString()}
                        <span className="text-lg font-normal text-gray-500">
                          /{billingCycle === "yearly" ? "year" : "month"}
                        </span>
                      </div>
                      <p className="text-gray-600">{plan.description}</p>
                    </CardHeader>

                    <CardContent className="pt-4">
                      <ul className="space-y-3 mb-8">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                            <span className="text-gray-600">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <OptimizedButton
                        className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-3"
                        onClick={() => {
                          if (typeof window !== "undefined") {
                            router.push("/subscription");
                          }
                        }}
                      >
                        {plan.cta}
                      </OptimizedButton>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Start Your
              <span className="block">Tender Journey?</span>
            </h2>
            <p className="text-xl text-blue-100 mb-12">
              Join us in building the future of tender discovery. Get complete
              access to all features and never miss an opportunity.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <OptimizedButton
                size="lg"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    router.push("/subscription");
                  }
                }}
                className="px-8 py-4 bg-white text-blue-600 hover:bg-gray-50 text-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                <span>Get Started - ₹1,499/month</span>
                <ArrowRight className="ml-2 h-5 w-5" />
              </OptimizedButton>

              <OptimizedButton
                variant="outline"
                size="lg"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    router.push("/");
                  }
                }}
                className="px-8 py-4 text-lg border-2 border-white text-black hover:bg-white hover:text-blue-600"
              >
                Browse Tenders
              </OptimizedButton>
            </div>

            <div className="mt-8 text-blue-100 text-sm">
              ✓ All features included ✓ No setup fees ✓ Cancel anytime
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default LandingPage;
