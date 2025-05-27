export const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price / 100);
};

export const calculateYearlySavings = (monthly: number, yearly: number) => {
  const yearlyEquivalent = monthly * 12;
  const savings = yearlyEquivalent - yearly;
  return Math.round((savings / yearlyEquivalent) * 100);
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800 border-green-200";
    case "authenticated":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "halted":
      return "bg-red-100 text-red-800 border-red-200";
    case "cancelled":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "paused":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "completed":
      return "bg-purple-100 text-purple-800 border-purple-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export const getPlanIcon = (name: string) => {
  return (
    {
      Free: "Users",
      Basic: "Mail",
      "All Colleges": "Building2",
      Pro: "Zap",
      Enterprise: "Crown",
    }[name] || "Star"
  );
};

export const getFeatureIcon = (feature: string) => {
  if (feature.includes("college")) return "Building2";
  if (feature.includes("alert") || feature.includes("notification"))
    return "Mail";
  if (feature.includes("filter")) return "Filter";
  if (feature.includes("API")) return "Code";
  if (feature.includes("support")) return "HeadphonesIcon";
  if (feature.includes("delay")) return "Clock";
  if (feature.includes("Export") || feature.includes("Excel"))
    return "TrendingUp";
  return "CheckCircle";
};

type IconName =
  | "Building2"
  | "Mail"
  | "Filter"
  | "Code"
  | "HeadphonesIcon"
  | "Clock"
  | "TrendingUp"
  | "CheckCircle";

export const getFeatureIconColor = (icon: string) => {
  const colors: Record<IconName, string> = {
    Building2: "text-blue-500",
    Mail: "text-green-500",
    Filter: "text-purple-500",
    Code: "text-orange-500",
    HeadphonesIcon: "text-indigo-500",
    Clock: "text-yellow-500",
    TrendingUp: "text-emerald-500",
    CheckCircle: "text-gray-500",
  };

  return colors[icon as IconName] || "text-gray-500";
};
