// src/hooks/usePaymentModal.ts
import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

type RazorpayOptions = Record<string, unknown>;
type RazorpayInstance = {
  open: () => void;
};
type RazorpayPaymentResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  // Add other fields if needed
};

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface UsePaymentModalReturn {
  isProcessing: boolean;
  openPaymentModal: (options: {
    planId: string;
    subscriptionType: "monthly" | "yearly";
    onSuccess?: (paymentData: RazorpayPaymentResponse) => void;
    onError?: (error: string) => void;
  }) => Promise<void>;
}

export function usePaymentModal(): UsePaymentModalReturn {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const openPaymentModal = useCallback(
    async ({
      planId,
      subscriptionType,
      onSuccess,
      onError,
    }: {
      planId: string;
      subscriptionType: "monthly" | "yearly";
      onSuccess?: (paymentData: RazorpayPaymentResponse) => void;
      onError?: (error: string) => void;
    }) => {
      if (!user?.email) {
        onError?.("Please log in to continue");
        return;
      }

      setIsProcessing(true);

      try {
        // Create payment order
        const response = await fetch("/api/payment/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId,
            subscriptionType,
            userEmail: user.email,
            userId: user.id,
            collegePreferences: ["all"],
          }),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to create payment order");
        }

        // Check if Razorpay is loaded
        if (!window.Razorpay) {
          throw new Error(
            "Razorpay not loaded. Please refresh the page and try again."
          );
        }

        // Configure Razorpay options
        const options: RazorpayOptions = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
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
                  subscriptionType,
                  userEmail: user.email,
                  userId: user.id,
                  collegePreferences: ["all"],
                }),
              });

              const verifyData = await verifyResponse.json();

              if (verifyData.success) {
                onSuccess?.(verifyData);
              } else {
                throw new Error(
                  verifyData.error || "Payment verification failed"
                );
              }
            } catch (verifyError) {
              console.error("Payment verification error:", verifyError);
              onError?.(
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
              setIsProcessing(false);
            },
          },
        };

        // Open Razorpay checkout
        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } catch (error) {
        console.error("Error opening payment modal:", error);
        onError?.(
          error instanceof Error
            ? error.message
            : "Failed to open payment modal"
        );
        setIsProcessing(false);
      }
    },
    [user]
  );

  return {
    isProcessing,
    openPaymentModal,
  };
}
