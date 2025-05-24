"use client";
// src/app/test/page.tsx
// This is a test page for the subscription manager component
// It includes the subscription manager component and some test data
// for demonstration purposes
// The component is designed to manage user subscriptions, including
// viewing available plans, subscribing to a plan, and managing current subscriptions
// It also includes a payment integration with Razorpay for handling
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Crown, Star, Zap, AlertCircle } from "lucide-react";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  popular?: boolean;
}

interface UserSubscription {
  id: string;
  plan: SubscriptionPlan;
  subscription_type: "monthly" | "yearly";
  status: string;
  ends_at: string;
}

const SubscriptionManager = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] =
    useState<UserSubscription | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "yearly"
  );

  useEffect(() => {
    fetchPlans();
    // In a real app, you'd get the user email from authentication
    const email = localStorage.getItem("userEmail") || "";
    setUserEmail(email);
    if (email) {
      fetchCurrentSubscription(email);
    }
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/subscription/plans");
      const data = await response.json();

      // Mark Professional plan as popular
      const plansWithPopular =
        data.plans?.map((plan: SubscriptionPlan) => ({
          ...plan,
          popular: plan.name === "Professional",
        })) || [];

      setPlans(plansWithPopular);
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentSubscription = async (email: string) => {
    try {
      const response = await fetch(`/api/subscription/current?email=${email}`);
      const data = await response.json();
      setCurrentSubscription(data.subscription);
    } catch (error) {
      console.error("Error fetching current subscription:", error);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (!userEmail) {
      alert("Please enter your email address first");
      return;
    }

    try {
      // Create payment order
      const orderResponse = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          subscriptionType: billingCycle,
          userEmail,
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderData.success) {
        throw new Error(orderData.error);
      }

      // Initialize Razorpay
      interface RazorpayResponse {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "RGUKT Tenders Portal",
        description: `${orderData.plan.name} Subscription`,
        order_id: orderData.orderId,
        handler: async function (response: RazorpayResponse) {
          // Verify payment
          const verifyResponse = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...response,
              planId,
              subscriptionType: billingCycle,
              userEmail,
              amount: orderData.amount,
            }),
          });

          const verifyData = await verifyResponse.json();

          if (verifyData.success) {
            alert("Payment successful! Your subscription is now active.");
            fetchCurrentSubscription(userEmail);
          } else {
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          email: userEmail,
        },
        theme: {
          color: "#3b82f6",
        },
      };

      // @ts-expect-error - Razorpay is loaded via script
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Error initiating payment:", error);
      alert("Failed to initiate payment. Please try again.");
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const calculateYearlySavings = (monthly: number, yearly: number) => {
    const yearlyEquivalent = monthly * 12;
    const savings = yearlyEquivalent - yearly;
    return Math.round((savings / yearlyEquivalent) * 100);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Choose Your Subscription Plan
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Get unlimited access to RGUKT tenders with our premium features
        </p>

        {/* Email Input */}
        <div className="max-w-md mx-auto mb-6">
          <input
            type="email"
            placeholder="Enter your email address"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center items-center space-x-4 mb-8">
          <span
            className={
              billingCycle === "monthly" ? "font-semibold" : "text-gray-500"
            }
          >
            Monthly
          </span>
          <button
            onClick={() =>
              setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              billingCycle === "yearly" ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                billingCycle === "yearly" ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span
            className={
              billingCycle === "yearly" ? "font-semibold" : "text-gray-500"
            }
          >
            Yearly
          </span>
          {billingCycle === "yearly" && (
            <Badge className="bg-green-100 text-green-800 border-green-200">
              Save up to 73%
            </Badge>
          )}
        </div>
      </div>

      {/* Current Subscription */}
      {currentSubscription && (
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-blue-600" />
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">{currentSubscription.plan.name}</p>
                <p className="text-sm text-gray-600">
                  Expires on{" "}
                  {new Date(currentSubscription.ends_at).toLocaleDateString()}
                </p>
              </div>
              <Badge className="bg-green-100 text-green-800 border-green-200">
                {currentSubscription.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const price =
            billingCycle === "yearly" ? plan.price_yearly : plan.price_monthly;
          const isCurrentPlan = currentSubscription?.plan.id === plan.id;
          const isFree = plan.name === "Free";

          return (
            <Card
              key={plan.id}
              className={`relative ${
                plan.popular
                  ? "border-blue-500 shadow-lg scale-105"
                  : "border-gray-200"
              } ${isCurrentPlan ? "ring-2 ring-blue-500" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white px-3 py-1">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center">
                <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-3xl font-bold">
                    {formatPrice(price)}
                  </span>
                  {!isFree && (
                    <span className="text-gray-500">
                      /{billingCycle === "yearly" ? "year" : "month"}
                    </span>
                  )}
                </div>
                {billingCycle === "yearly" && !isFree && (
                  <p className="text-sm text-green-600 font-medium">
                    Save{" "}
                    {calculateYearlySavings(
                      plan.price_monthly,
                      plan.price_yearly
                    )}
                    %
                  </p>
                )}
                <p className="text-gray-600 text-sm mt-2">{plan.description}</p>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {isCurrentPlan ? (
                  <Button disabled className="w-full">
                    Current Plan
                  </Button>
                ) : isFree ? (
                  <Button variant="outline" disabled className="w-full">
                    Free Forever
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleSubscribe(plan.id)}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={!userEmail}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Subscribe Now
                  </Button>
                )}

                {!userEmail && !isFree && (
                  <p className="text-xs text-gray-500 text-center mt-2 flex items-center justify-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Enter email to subscribe
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Features Comparison */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-center mb-8">
          Compare Features
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 p-4 text-left">
                  Feature
                </th>
                {plans.map((plan) => (
                  <th
                    key={plan.id}
                    className="border border-gray-200 p-4 text-center"
                  >
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-200 p-4 font-medium">
                  Tender Views
                </td>
                <td className="border border-gray-200 p-4 text-center">
                  10/day
                </td>
                <td className="border border-gray-200 p-4 text-center">
                  Unlimited
                </td>
                <td className="border border-gray-200 p-4 text-center">
                  Unlimited
                </td>
              </tr>
              <tr>
                <td className="border border-gray-200 p-4 font-medium">
                  Email Notifications
                </td>
                <td className="border border-gray-200 p-4 text-center">
                  Weekly
                </td>
                <td className="border border-gray-200 p-4 text-center">
                  Real-time
                </td>
                <td className="border border-gray-200 p-4 text-center">
                  Real-time
                </td>
              </tr>
              <tr>
                <td className="border border-gray-200 p-4 font-medium">
                  Export Features
                </td>
                <td className="border border-gray-200 p-4 text-center">❌</td>
                <td className="border border-gray-200 p-4 text-center">✅</td>
                <td className="border border-gray-200 p-4 text-center">✅</td>
              </tr>
              <tr>
                <td className="border border-gray-200 p-4 font-medium">
                  API Access
                </td>
                <td className="border border-gray-200 p-4 text-center">❌</td>
                <td className="border border-gray-200 p-4 text-center">❌</td>
                <td className="border border-gray-200 p-4 text-center">✅</td>
              </tr>
              <tr>
                <td className="border border-gray-200 p-4 font-medium">
                  Analytics
                </td>
                <td className="border border-gray-200 p-4 text-center">❌</td>
                <td className="border border-gray-200 p-4 text-center">❌</td>
                <td className="border border-gray-200 p-4 text-center">✅</td>
              </tr>
              <tr>
                <td className="border border-gray-200 p-4 font-medium">
                  Support
                </td>
                <td className="border border-gray-200 p-4 text-center">
                  Standard
                </td>
                <td className="border border-gray-200 p-4 text-center">
                  Priority
                </td>
                <td className="border border-gray-200 p-4 text-center">
                  Dedicated
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Can I cancel anytime?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Yes, you can cancel your subscription at any time. You&apos;ll
                continue to have access until the end of your billing period.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                What payment methods do you accept?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                We accept all major credit cards, debit cards, UPI, net banking,
                and wallets through Razorpay&apos;s secure payment gateway.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Is there a refund policy?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                We offer a 7-day money-back guarantee. If you&apos;re not
                satisfied with our service, contact us within 7 days for a full
                refund.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                How often is tender data updated?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Our system automatically checks for new tenders every hour,
                ensuring you get the most up-to-date information available.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManager;
