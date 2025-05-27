// src/components/subscription/SubscriptionManager.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import {
  SubscriptionPlan,
  UserSubscription,
  PaymentHistory,
} from "../../types/subscription";
import PlansTab from "./PlansTab";
import CurrentSubscriptionTab from "./CurrentSubscriptionTab";
import FAQTab from "./FAQTab";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

type RazorpayOptions = Record<string, unknown>;
type RazorpayInstance = {
  open: () => void;
  // Add other methods if needed
};

type RazorpayPaymentResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  // Add other fields if needed
};

const SubscriptionManager: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] =
    useState<UserSubscription | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "yearly"
  );
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("plans");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user?.email) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user, fetchData]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch plans
      const plansResponse = await fetch("/api/subscription/plans");
      const plansData = await plansResponse.json();
      if (plansData.success) {
        setPlans(
          plansData.plans.sort(
            (a: SubscriptionPlan, b: SubscriptionPlan) =>
              a.display_order - b.display_order
          )
        );
      }

      // Fetch current subscription
      if (user?.email) {
        const subResponse = await fetch(
          `/api/subscription/current?email=${user.email}`
        );
        const subData = await subResponse.json();
        if (subData.success) {
          setCurrentSubscription(subData.subscription);
        }

        // Fetch payment history
        const historyResponse = await fetch(
          `/api/subscription/history?email=${user.email}`
        );
        const historyData = await historyResponse.json();
        if (historyData.success) {
          setPaymentHistory(historyData.payments || []);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load subscription data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (!user?.email) {
      router.push("/login?redirect=/subscription");
      return;
    }

    setProcessingPlanId(planId);
    setError(null);

    try {
      // Create payment order
      const response = await fetch("/api/subscription/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          subscriptionType: billingCycle,
          userId: user.id,
          userEmail: user.email,
          collegePreferences: ["all"],
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to create subscription order");
      }

      // Check if Razorpay is loaded
      if (!window.Razorpay) {
        throw new Error(
          "Razorpay not loaded. Please refresh the page and try again."
        );
      }

      // Configure Razorpay options
      const options = {
        key: data.razorpayKeyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id: data.orderId,
        amount: data.amount,
        currency: data.currency,
        name: "RGUKT Tenders Portal",
        description: `${data.plan.name} Subscription`,
        image: "/logo.png",
        handler: async function (response: RazorpayPaymentResponse) {
          try {
            // Verify payment
            const verifyResponse = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId,
                subscriptionType: billingCycle,
                userEmail: user.email,
                userId: user.id,
                collegePreferences: ["all"],
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              setSuccess(
                "Payment successful! Your subscription has been activated."
              );
              await fetchData();
              setActiveTab("current");
            } else {
              throw new Error(
                verifyData.error || "Payment verification failed"
              );
            }
          } catch (verifyError) {
            console.error("Payment verification error:", verifyError);
            setError(
              verifyError instanceof Error
                ? verifyError.message
                : "Payment verification failed. Please contact support."
            );
          }
        },
        prefill: {
          name: user.profile?.full_name || "",
          email: user.email,
          contact: user.profile?.phone || "",
        },
        theme: {
          color: "#3b82f6",
        },
        modal: {
          ondismiss: function () {
            setProcessingPlanId(null);
          },
        },
      };

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Error creating subscription:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create subscription"
      );
    } finally {
      setProcessingPlanId(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (
      !currentSubscription ||
      !confirm(
        "Are you sure you want to cancel your subscription? You'll continue to have access until the end of your billing period."
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId: currentSubscription.id,
          userEmail: user?.email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(
          "Subscription cancelled successfully. You'll continue to have access until the end of your billing period."
        );
        await fetchData();
      } else {
        throw new Error(data.error || "Failed to cancel subscription");
      }
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      setError(
        error instanceof Error ? error.message : "Failed to cancel subscription"
      );
    }
  };

  // Note: Pause and Resume are not needed for one-time payments
  // These subscriptions expire naturally at the end of the period
  const handlePauseSubscription = async () => {
    setError(
      "Pause feature is not available for this subscription type. You can cancel if needed."
    );
  };

  const handleResumeSubscription = async () => {
    setError("Resume feature is not available for this subscription type.");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          Choose Your Perfect Plan
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 mb-8">
          Get instant access to all RGUKT tenders with advanced features
        </p>

        {/* Alerts */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {success}
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-8"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="plans" data-value="plans">
            Subscription Plans
          </TabsTrigger>
          <TabsTrigger value="current" data-value="current">
            My Subscription
          </TabsTrigger>
          <TabsTrigger value="faq" data-value="faq">
            FAQ
          </TabsTrigger>
        </TabsList>

        {/* Plans Tab */}
        <TabsContent value="plans">
          <PlansTab
            plans={plans}
            currentSubscription={currentSubscription}
            billingCycle={billingCycle}
            setBillingCycle={setBillingCycle}
            processingPlanId={processingPlanId}
            handleSubscribe={handleSubscribe}
            user={user}
            router={router}
          />
        </TabsContent>

        {/* Current Subscription Tab */}
        <TabsContent value="current">
          <CurrentSubscriptionTab
            currentSubscription={currentSubscription}
            paymentHistory={paymentHistory}
            handleCancelSubscription={handleCancelSubscription}
            handlePauseSubscription={handlePauseSubscription}
            handleResumeSubscription={handleResumeSubscription}
            user={user}
          />
        </TabsContent>

        {/* FAQ Tab */}
        <TabsContent value="faq">
          <FAQTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SubscriptionManager;
