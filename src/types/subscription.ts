export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  colleges_access: number;
  alert_type: string;
  alert_delay_days: number;
  has_filters: boolean;
  has_keyword_filter: boolean;
  has_advanced_filters: boolean;
  has_priority_support: boolean;
  has_api_access: boolean;
  has_erp_integration: boolean;
  popular?: boolean;
  display_order: number;
}

export interface UserSubscription {
  id: string;
  plan: SubscriptionPlan;
  subscription_type: "monthly" | "yearly";
  status: "active" | "pending" | "halted" | "cancelled" | "paused" | "completed" | string;
  current_period_start: string;
  current_period_end: string;
  razorpay_subscription_id: string;
  cancelled_at?: string;
  pause_start?: string;
  pause_end?: string;
  total_count: number;
  paid_count: number;
  next_billing_at: string;
}

export interface PaymentHistory {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  method?: string;
  card_last4?: string;
  bank?: string;
  error_description?: string;
}

export type BillingCycle = "monthly" | "yearly";