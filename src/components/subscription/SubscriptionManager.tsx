// src/components/subscription/SubscriptionManager.tsx - UPDATED for Simple Payment System
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
import { useSubscriptionData } from "@/hooks/useSubscriptionData";
import { useQuery } from "@tanstack/react-query";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

type RazorpayOptions = Record<string, unknown>;
type RazorpayInstance = {
  open: () => void;
};

type RazorpayPaymentResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

const SubscriptionManager: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();

  // Use optimized subscription hook with React Query
  const {
    subscription: currentSubscription,
    paymentHistory,
    isLoading: subscriptionLoading,
    refetch
  } = useSubscriptionData();

  // Fetch plans with caching
  const { data: plans = [], isLoading: plansLoading, error: plansError } = useQuery({
    queryKey: ['subscription', 'plans'],
    queryFn: async (): Promise<SubscriptionPlan[]> => {
      const response = await fetch("/api/subscription/plans");
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch plans");
      }

      return data.plans.sort((a: SubscriptionPlan, b: SubscriptionPlan) =>
        a.display_order - b.display_order
      );
    },
    staleTime: 15 * 60 * 1000, // 15 minutes - plans don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });

  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("plans");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loading = subscriptionLoading || plansLoading;

  // Handle errors from React Query
  useEffect(() => {
    if (plansError) {
      setError(plansError instanceof Error ? plansError.message : "Failed to load plans data");
    }
  }, [plansError]);

  const handleSubscribe = async (planId: string) => {
    if (!user?.email) {
      router.push("/login?redirect=/subscription");
      return;
    }

    setProcessingPlanId(planId);
    setError(null);
    setSuccess(null);

    try {
      // Step 1: Create payment order using the new simple payment API
      const orderResponse = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          subscriptionType: billingCycle,
          userEmail: user.email,
          userId: user.id,
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderData.success) {
        throw new Error(orderData.error || "Failed to create payment order");
      }

      // Check if Razorpay is loaded
      if (!window.Razorpay) {
        throw new Error(
          "Razorpay not loaded. Please refresh the page and try again."
        );
      }

      // Step 2: Configure Razorpay options for one-time payment
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id: orderData.orderId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "RGUKT Tenders Portal",
        description: `${orderData.plan.name} - ${billingCycle} Plan`,
        image: "/logo.png",
        handler: async function (response: RazorpayPaymentResponse) {
          try {
            // Step 3: Verify payment and create fixed-duration subscription
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
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              // Use the actual subscription end date from the API response
              const expiryDate = verifyData.subscription?.ends_at || verifyData.subscription?.current_period_end;
              const formattedExpiryDate = expiryDate
                ? new Date(expiryDate).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                : 'subscription period';

              setSuccess(
                `Payment successful! Your ${billingCycle} subscription is now active and will expire on ${formattedExpiryDate}.`
              );
              await refetch();
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
          } finally {
            setProcessingPlanId(null);
          }
        },
        prefill: {
          name: user.profile?.full_name || user.email.split('@')[0],
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
        notes: {
          planId,
          subscriptionType: billingCycle,
          userEmail: user.email,
        },
      };

      // Step 4: Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Error creating payment:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create payment order"
      );
      setProcessingPlanId(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentSubscription) {
      setError("No active subscription found");
      return;
    }

    const confirmMessage = `Are you sure you want to cancel your subscription?

⚠️ Important: This is a one-time payment subscription.
• You will continue to have access until ${new Date(currentSubscription.current_period_end || currentSubscription.next_billing_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
• No automatic renewal will occur
• You will need to manually renew when it expires

This action cannot be undone.`;

    if (!confirm(confirmMessage)) {
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
          "Subscription cancelled successfully. You'll continue to have access until your subscription expires. No future charges will occur as this was a one-time payment."
        );
        await refetch();
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

  // These are not needed for one-time payments since subscriptions expire naturally
  const handlePauseSubscription = async () => {
    setError(
      "Pause feature is not available. This is a one-time payment subscription that expires automatically. You can cancel if needed or wait for natural expiry."
    );
  };

  const handleResumeSubscription = async () => {
    setError(
      "Resume feature is not available. To reactivate, please purchase a new subscription when your current one expires."
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading subscription data...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Info Badge */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-800 rounded-lg text-sm">
          <CheckCircle className="h-4 w-4 mr-2" />
          One-time payment • No auto-renewal
        </div>
      </div>

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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="current">My Subscription</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>

        <TabsContent value="plans">
          <PlansTab
            plans={plans}
            currentSubscription={currentSubscription || null}
            billingCycle={billingCycle}
            setBillingCycle={setBillingCycle}
            processingPlanId={processingPlanId}
            handleSubscribe={handleSubscribe}
            user={user}
            router={router}
          />
        </TabsContent>

        <TabsContent value="current">
          <CurrentSubscriptionTab
            currentSubscription={currentSubscription || null}
            paymentHistory={paymentHistory}
            handleCancelSubscription={handleCancelSubscription}
            handlePauseSubscription={handlePauseSubscription}
            handleResumeSubscription={handleResumeSubscription}
            user={user}
          />
        </TabsContent>

        <TabsContent value="faq">
          <FAQTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SubscriptionManager;