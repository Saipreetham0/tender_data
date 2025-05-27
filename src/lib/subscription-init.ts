// src/lib/subscription-init.ts
import { RazorpayPaymentService } from "./razorpay-payment";
import { supabase } from "./supabase";

// Helper to check if a property exists and is not null/undefined
function hasProp<T extends object>(obj: T, prop: string): boolean {
  return (
    Object.prototype.hasOwnProperty.call(obj, prop) &&
    (obj as Record<string, unknown>)[prop] !== undefined &&
    (obj as Record<string, unknown>)[prop] !== null
  );
}

export interface SubscriptionPlan {
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  colleges_access: number;
  alert_type: string;
  alert_delay_days?: number;
  has_filters: boolean;
  has_keyword_filter: boolean;
  has_advanced_filters: boolean;
  has_priority_support: boolean;
  has_api_access: boolean;
  popular: boolean;
  display_order: number;
  is_active: boolean;
  // Add any other fields as needed
}

/**
 * Service to initialize subscription system on app startup
 */
export class SubscriptionInitService {
  /**
   * Initialize the entire subscription system
   */
  static async initialize(): Promise<void> {
    try {
      console.log("🚀 Initializing subscription system...");

      // Step 1: Validate subscription plans
      await this.validateSubscriptionPlans();

      // Step 2: Initialize Razorpay payment service
      await RazorpayPaymentService.initialize();

      // Step 3: Clean up expired data
      await this.cleanupExpiredData();

      // Step 4: Validate configuration
      await this.validateConfiguration();

      console.log("✅ Subscription system initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize subscription system:", error);
      // Don't throw - app should still work with limited functionality
    }
  }

  /**
   * Validate and ensure subscription plans exist
   */
  private static async validateSubscriptionPlans(): Promise<void> {
    try {
      console.log("📋 Validating subscription plans...");

      const { data: plans, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true);

      if (error) throw error;

      if (!plans || plans.length === 0) {
        console.log("📝 Creating default subscription plans...");
        await this.createDefaultPlans();
      } else {
        console.log(`✅ Found ${plans.length} subscription plans`);

        // Validate plan structure
        for (const plan of plans) {
          await this.validatePlan(plan);
        }
      }
    } catch (error) {
      console.error("❌ Error validating subscription plans:", error);
      throw error;
    }
  }

  /**
   * Create default subscription plans if none exist
   */
  private static async createDefaultPlans(): Promise<void> {
    const defaultPlans = [
      {
        name: "Free",
        description: "Basic access to one college tenders",
        price_monthly: 0,
        price_yearly: 0,
        features: [
          "Access to 1 college",
          "Weekly email alerts with 2-3 day delay",
          "Basic tender information",
        ],
        colleges_access: 1,
        alert_type: "weekly",
        alert_delay_days: 3,
        has_filters: false,
        has_keyword_filter: false,
        has_advanced_filters: false,
        has_priority_support: false,
        has_api_access: false,
        popular: false,
        display_order: 1,
        is_active: true,
      },
      {
        name: "Basic",
        description: "Enhanced access with faster alerts",
        price_monthly: 99900, // ₹999/month in paise
        price_yearly: 599400, // ₹5994/year (50% off) in paise
        features: [
          "Access to 1 college of choice",
          "Real-time email alerts",
          "No delay in tender information",
          "Email support",
        ],
        colleges_access: 1,
        alert_type: "realtime",
        alert_delay_days: 0,
        has_filters: true,
        has_keyword_filter: false,
        has_advanced_filters: false,
        has_priority_support: false,
        has_api_access: false,
        popular: false,
        display_order: 2,
        is_active: true,
      },
      {
        name: "All Colleges",
        description: "Complete access to all RGUKT campuses",
        price_monthly: 199900, // ₹1999/month in paise
        price_yearly: 999600, // ₹9996/year (58% off) in paise
        features: [
          "Access to all 5 colleges",
          "Real-time email alerts",
          "Keyword filtering",
          "Advanced search filters",
          "Priority email support",
        ],
        colleges_access: 5,
        alert_type: "realtime",
        alert_delay_days: 0,
        has_filters: true,
        has_keyword_filter: true,
        has_advanced_filters: true,
        has_priority_support: true,
        has_api_access: false,
        popular: true,
        display_order: 3,
        is_active: true,
      },
      {
        name: "Pro",
        description: "Advanced features for professionals",
        price_monthly: 399900, // ₹3999/month in paise
        price_yearly: 1999200, // ₹19992/year (58% off) in paise
        features: [
          "Everything in All Colleges plan",
          "API access for integration",
          "Export to Excel/PDF",
          "Advanced analytics",
          "Priority support",
        ],
        colleges_access: 5,
        alert_type: "realtime",
        alert_delay_days: 0,
        has_filters: true,
        has_keyword_filter: true,
        has_advanced_filters: true,
        has_priority_support: true,
        has_api_access: true,
        popular: false,
        display_order: 4,
        is_active: true,
      },
      {
        name: "Enterprise",
        description: "Custom solution for organizations",
        price_monthly: 0, // Custom pricing
        price_yearly: 0, // Custom pricing
        features: [
          "Custom tender filtering",
          "Custom reporting",
          "Dedicated account manager",
          "SLA guarantee",
          "Custom integrations",
        ],
        colleges_access: 5,
        alert_type: "realtime",
        alert_delay_days: 0,
        has_filters: true,
        has_keyword_filter: true,
        has_advanced_filters: true,
        has_priority_support: true,
        has_api_access: true,
        popular: false,
        display_order: 5,
        is_active: true,
      },
    ];

    const { error } = await supabase
      .from("subscription_plans")
      .upsert(defaultPlans, { onConflict: "name" });

    if (error) {
      throw new Error(`Failed to create default plans: ${error.message}`);
    }

    console.log("✅ Default subscription plans created");
  }

  /**
   * Validate individual plan structure
   */
  private static async validatePlan(plan: SubscriptionPlan): Promise<void> {
    const requiredFields = [
      "name",
      "description",
      "price_monthly",
      "price_yearly",
      "features",
      "colleges_access",
      "alert_type",
    ];

    for (const field of requiredFields) {
      if (!hasProp(plan, field)) {
        console.warn(`⚠️ Plan ${plan.name} missing required field: ${field}`);
      }
    }

    // Validate pricing
    if (plan.price_monthly < 0 || plan.price_yearly < 0) {
      console.warn(`⚠️ Plan ${plan.name} has negative pricing`);
    }

    // Validate yearly savings
    if (plan.price_yearly > 0 && plan.price_monthly > 0) {
      const yearlyEquivalent = plan.price_monthly * 12;
      if (plan.price_yearly >= yearlyEquivalent) {
        console.warn(`⚠️ Plan ${plan.name} yearly pricing offers no savings`);
      }
    }
  }

  /**
   * Clean up expired and old data
   */
  private static async cleanupExpiredData(): Promise<void> {
    try {
      console.log("🧹 Cleaning up expired data...");

      // Clean up old usage data (older than 90 days)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);

      const { error: usageError } = await supabase
        .from("user_usage")
        .delete()
        .lt("date", cutoffDate.toISOString().split("T")[0]);

      if (usageError) {
        console.warn("⚠️ Could not clean usage data:", usageError);
      }

      // Clean up old cron logs (older than 30 days)
      const cronCutoff = new Date();
      cronCutoff.setDate(cronCutoff.getDate() - 30);

      const { error: cronError } = await supabase
        .from("cron_logs")
        .delete()
        .lt("timestamp", cronCutoff.toISOString());

      if (cronError) {
        console.warn("⚠️ Could not clean cron logs:", cronError);
      }

      // Clean up old subscription events (older than 180 days)
      const eventsCutoff = new Date();
      eventsCutoff.setDate(eventsCutoff.getDate() - 180);

      const { error: eventsError } = await supabase
        .from("subscription_events")
        .delete()
        .lt("created_at", eventsCutoff.toISOString());

      if (eventsError) {
        console.warn("⚠️ Could not clean subscription events:", eventsError);
      }

      console.log("✅ Data cleanup completed");
    } catch (error) {
      console.warn("⚠️ Error during data cleanup:", error);
    }
  }

  /**
   * Validate system configuration
   */
  private static async validateConfiguration(): Promise<void> {
    try {
      console.log("🔧 Validating system configuration...");

      const issues: string[] = [];

      // Check required environment variables
      const requiredEnvVars = [
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_ROLE_KEY",
        "NEXT_PUBLIC_RAZORPAY_KEY_ID",
        "RAZORPAY_KEY_SECRET",
        "RESEND_API_KEY",
        "CRON_API_SECRET_KEY",
      ];

      for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
          issues.push(`Missing environment variable: ${envVar}`);
        }
      }

      // Check Supabase connection
      try {
        const { error } = await supabase
          .from("subscription_plans")
          .select("count")
          .limit(1);
        if (error) issues.push(`Supabase connection issue: ${error.message}`);
      } catch {
        issues.push("Cannot connect to Supabase");
      }

      // Check Razorpay configuration
      if (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
        const isTestMode =
          process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID.startsWith("rzp_test_");
        const isLiveMode =
          process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID.startsWith("rzp_live_");

        if (!isTestMode && !isLiveMode) {
          issues.push("Invalid Razorpay key format");
        }

        if (process.env.NODE_ENV === "production" && isTestMode) {
          console.warn("⚠️ Using Razorpay test keys in production");
        }
      }

      // Check email configuration
      if (!process.env.RESEND_FROM_EMAIL) {
        issues.push("RESEND_FROM_EMAIL not configured");
      }

      if (!process.env.NOTIFICATION_EMAILS) {
        console.warn(
          "⚠️ NOTIFICATION_EMAILS not configured - notifications disabled"
        );
      }

      // Report issues
      if (issues.length > 0) {
        console.error("❌ Configuration issues found:");
        issues.forEach((issue) => console.error(`  - ${issue}`));
        throw new Error(
          `Configuration validation failed: ${issues.length} issues found`
        );
      }

      console.log("✅ System configuration validated successfully");
    } catch (error) {
      console.error("❌ Configuration validation failed:", error);
      throw error;
    }
  }

  /**
   * Get system health status
   */
  static async getSystemHealth(): Promise<{
    healthy: boolean;
    issues: string[];
    services: {
      database: boolean;
      razorpay: boolean;
      email: boolean;
      cron: boolean;
    };
  }> {
    const issues: string[] = [];
    const services = {
      database: false,
      razorpay: false,
      email: false,
      cron: false,
    };

    try {
      // Test database
      try {
        const { error } = await supabase
          .from("subscription_plans")
          .select("count")
          .limit(1);
        services.database = !error;
        if (error) issues.push(`Database: ${error.message}`);
      } catch (error) {
        issues.push(error + " Database: Connection failed");
      }

      // Test Razorpay configuration
      if (
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID &&
        process.env.RAZORPAY_KEY_SECRET
      ) {
        services.razorpay = true;
      } else {
        issues.push("Razorpay: Missing API keys");
      }

      // Test email configuration
      if (process.env.RESEND_API_KEY) {
        services.email = true;
      } else {
        issues.push("Email: Missing Resend API key");
      }

      // Test cron configuration
      if (process.env.CRON_API_SECRET_KEY) {
        services.cron = true;
      } else {
        issues.push("Cron: Missing API secret key");
      }

      const healthy = Object.values(services).every((status) => status);

      return {
        healthy,
        issues,
        services,
      };
    } catch (error) {
      return {
        healthy: false,
        issues: [`System health check failed: ${error}`],
        services,
      };
    }
  }

  /**
   * Update subscription plan pricing (for admin use)
   */
  static async updatePlanPricing(
    planName: string,
    monthlyPrice: number,
    yearlyPrice: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("subscription_plans")
        .update({
          price_monthly: monthlyPrice,
          price_yearly: yearlyPrice,
          updated_at: new Date().toISOString(),
        })
        .eq("name", planName);

      if (error) throw error;

      console.log(`✅ Updated pricing for ${planName} plan`);
    } catch (error) {
      console.error(`❌ Failed to update pricing for ${planName}:`, error);
      throw error;
    }
  }

  /**
   * Get subscription statistics
   */
  static async getSubscriptionStats(): Promise<{
    totalActiveSubscriptions: number;
    totalRevenue: number;
    planDistribution: Record<string, number>;
    recentSignups: number;
  }> {
    try {
      // Get active subscriptions
      const { data: activeSubscriptions, error: activeError } = await supabase
        .from("user_subscriptions")
        .select(
          `
          id,
          plan:subscription_plans(name),
          amount_paid
        `
        )
        .eq("status", "active");

      if (activeError) throw activeError;

      // Get recent signups (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentSubs, error: recentError } = await supabase
        .from("user_subscriptions")
        .select("id")
        .gte("created_at", thirtyDaysAgo.toISOString());

      if (recentError) throw recentError;

      // Calculate statistics
      const totalActiveSubscriptions = activeSubscriptions?.length || 0;
      const totalRevenue =
        activeSubscriptions?.reduce(
          (sum, sub) => sum + (sub.amount_paid || 0),
          0
        ) || 0;
      const recentSignups = recentSubs?.length || 0;

      // Plan distribution
      const planDistribution: Record<string, number> = {};
      activeSubscriptions?.forEach((sub) => {
        let planName = "Unknown";
        if (
          sub.plan &&
          typeof sub.plan === "object" &&
          "name" in sub.plan &&
          typeof sub.plan.name === "string"
        ) {
          planName = sub.plan.name;
        }
        planDistribution[planName] = (planDistribution[planName] || 0) + 1;
      });

      return {
        totalActiveSubscriptions,
        totalRevenue,
        planDistribution,
        recentSignups,
      };
    } catch (error) {
      console.error("Error fetching subscription stats:", error);
      return {
        totalActiveSubscriptions: 0,
        totalRevenue: 0,
        planDistribution: {},
        recentSignups: 0,
      };
    }
  }

  /**
   * Run health checks and log results
   */
  static async runHealthCheck(): Promise<void> {
    try {
      console.log("🏥 Running system health check...");
      const health = await this.getSystemHealth();

      if (health.healthy) {
        console.log("✅ System is healthy");
      } else {
        console.log("⚠️ System health issues detected:");
        health.issues.forEach((issue) => console.log(`  - ${issue}`));
      }

      console.log("Service status:");
      Object.entries(health.services).forEach(([service, status]) => {
        console.log(`  ${service}: ${status ? "✅" : "❌"}`);
      });

      // Log to database
      await supabase.from("cron_logs").insert({
        timestamp: new Date().toISOString(),
        job_name: "health_check",
        status: health.healthy ? "healthy" : "unhealthy",
        message: `System health check completed. ${health.issues.length} issues found.`,
        level: health.healthy ? "info" : "warn",
        details: health,
      });
    } catch (error) {
      console.error("❌ Health check failed:", error);
    }
  }
}
