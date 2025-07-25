


"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  ChevronRight,
  Pause,
  Play,
  CreditCard,
  Calendar,
  AlertCircle,
  Users,
  Mail,
  Building2,
  Zap,
  Crown,
  Star,
} from "lucide-react";
import { UserSubscription, PaymentHistory } from "@/types/subscription";
import { formatPrice, getStatusColor } from "@/utils/subscription";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface User {
  id?: string;
  email?: string;
  // Add other user properties as needed
}

interface CurrentSubscriptionTabProps {
  currentSubscription: UserSubscription | null;
  paymentHistory: PaymentHistory[];
  handleCancelSubscription: () => void;
  handlePauseSubscription: () => void;
  handleResumeSubscription: () => void;
  user?: User | null;
}

const CurrentSubscriptionTab: React.FC<CurrentSubscriptionTabProps> = ({
  currentSubscription,
  paymentHistory,
  handleCancelSubscription,
  handlePauseSubscription,
  handleResumeSubscription,
}) => {
  const [showManageModal, setShowManageModal] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);

  const getPlanIcon = (name: string) => {
    switch (name) {
      case "Free":
        return <Users className="h-6 w-6" />;
      case "Basic":
        return <Mail className="h-6 w-6" />;
      case "All Colleges":
        return <Building2 className="h-6 w-6" />;
      case "Pro":
        return <Zap className="h-6 w-6" />;
      case "Enterprise":
        return <Crown className="h-6 w-6" />;
      default:
        return <Star className="h-6 w-6" />;
    }
  };

  if (!currentSubscription) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Active Subscription
        </h3>
        <p className="text-gray-500 mb-6 text-center max-w-md">
          You don&apos;t have an active subscription. Choose a plan to get
          started with advanced features.
        </p>
        <Button
          onClick={() =>
            document
              .querySelector('[data-value="plans"]')
              ?.dispatchEvent(new Event("click"))
          }
          className="bg-blue-600 hover:bg-blue-700"
        >
          View Plans
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Subscription Overview */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-full">
                {getPlanIcon(currentSubscription.plan.name)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {currentSubscription.plan.name} Plan
                </h3>
                <p className="text-sm text-gray-600">
                  {currentSubscription.subscription_type === "monthly"
                    ? "Monthly"
                    : "Yearly"}{" "}
                  billing
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(currentSubscription.status)}>
                {currentSubscription.status === "active" && (
                  <CheckCircle className="h-3 w-3 mr-1" />
                )}
                {currentSubscription.status === "paused" && (
                  <Pause className="h-3 w-3 mr-1" />
                )}
                {currentSubscription.status}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowManageModal(true)}
                className="transition-all hover:bg-blue-50"
              >
                Manage <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Details */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Billing Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Current Period</span>
              <span className="font-medium">
                {new Date(
                  currentSubscription.current_period_start
                ).toLocaleDateString()}{" "}
                -{" "}
                {new Date(
                  currentSubscription.current_period_end
                ).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Next Billing Date</span>
              <span className="font-medium">
                {new Date(
                  currentSubscription.next_billing_at
                ).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount</span>
              <span className="font-medium">
                {formatPrice(
                  currentSubscription.subscription_type === "monthly"
                    ? currentSubscription.plan.price_monthly
                    : currentSubscription.plan.price_yearly
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Status</span>
              <Badge
                variant="outline"
                className={getStatusColor(currentSubscription.status)}
              >
                {currentSubscription.status}
              </Badge>
            </div>
            {currentSubscription.cancelled_at && (
              <div className="flex justify-between">
                <span className="text-gray-600">Cancelled On</span>
                <span className="font-medium">
                  {new Date(
                    currentSubscription.cancelled_at
                  ).toLocaleDateString()}
                </span>
              </div>
            )}
            {currentSubscription.status === "paused" &&
              currentSubscription.pause_start && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Paused On</span>
                  <span className="font-medium">
                    {new Date(
                      currentSubscription.pause_start
                    ).toLocaleDateString()}
                  </span>
                </div>
              )}
            {currentSubscription.pause_end && (
              <div className="flex justify-between">
                <span className="text-gray-600">Pause Until</span>
                <span className="font-medium">
                  {new Date(currentSubscription.pause_end).toLocaleDateString()}
                </span>
              </div>
            )}
            <div className="flex justify-between mt-4">
              <span className="text-gray-600">Subscription ID</span>
              <span className="font-medium text-xs text-gray-500">
                {currentSubscription.razorpay_subscription_id}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Payment History</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPaymentHistory(!showPaymentHistory)}
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
            >
              {showPaymentHistory ? "Hide" : "View All"}
            </Button>
          </CardHeader>
          <CardContent>
            {paymentHistory.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">
                No payment records found.
              </p>
            ) : (
              <div className="space-y-4">
                {(showPaymentHistory
                  ? paymentHistory
                  : paymentHistory.slice(0, 3)
                ).map((payment) => (
                  <div
                    key={payment.id}
                    className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`p-2 rounded-full ${
                          payment.status === "captured" ||
                          payment.status === "paid"
                            ? "bg-green-100"
                            : payment.status === "refunded"
                              ? "bg-blue-100"
                              : "bg-red-100"
                        }`}
                      >
                        {payment.status === "captured" ||
                        payment.status === "paid" ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : payment.status === "refunded" ? (
                          <CreditCard className="h-4 w-4 text-blue-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {formatPrice(payment.amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        payment.status === "captured" ||
                        payment.status === "paid"
                          ? "bg-green-100 text-green-800 border-green-200"
                          : payment.status === "refunded"
                            ? "bg-blue-100 text-blue-800 border-blue-200"
                            : "bg-red-100 text-red-800 border-red-200"
                      }
                    >
                      {payment.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Manage Subscription Modal */}
      <Dialog open={showManageModal} onOpenChange={setShowManageModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Your Subscription</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h3 className="font-medium">Subscription Details</h3>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Plan</span>
                <span>{currentSubscription.plan.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <Badge className={getStatusColor(currentSubscription.status)}>
                  {currentSubscription.status}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Billing</span>
                <span>
                  {currentSubscription.subscription_type === "monthly"
                    ? "Monthly"
                    : "Yearly"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Next payment</span>
                <span>
                  {new Date(
                    currentSubscription.next_billing_at
                  ).toLocaleDateString()}
                </span>
              </div>
            </div>

            <Alert className="bg-amber-50 border-amber-200 text-amber-800">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription>
                Changes to your subscription will take effect immediately.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            {currentSubscription.status === "paused" ? (
              <Button
                onClick={handleResumeSubscription}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
              >
                <Play className="h-4 w-4 mr-2" />
                Resume Subscription
              </Button>
            ) : currentSubscription.status === "active" ? (
              <Button
                onClick={handlePauseSubscription}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause Subscription
              </Button>
            ) : null}

            {(currentSubscription.status === "active" ||
              currentSubscription.status === "paused") && (
              <Button
                onClick={handleCancelSubscription}
                variant="destructive"
                className="w-full sm:w-auto"
              >
                Cancel Subscription
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() =>
                document
                  .querySelector('[data-value="plans"]')
                  ?.dispatchEvent(new Event("click"))
              }
              className="w-full sm:w-auto"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Change Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CurrentSubscriptionTab;