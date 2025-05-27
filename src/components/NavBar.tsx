"use client";
import React, { useState, useEffect } from "react";
import {
  Menu,
  X,
  Home,
  FileText,
  User,
  Settings,
  LogOut,
  Crown,
  Building2,
  Mail,
  ChevronDown,
  Moon,
  Sun,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

// Import your actual auth context
import { useAuth } from "@/contexts/AuthContext";

// Avatar component with enhanced functionality for Google OAuth and Magic Link users
interface User {
  email?: string;
  profile?: {
    full_name?: string;
    avatar_url?: string;
    organization?: string;
  };
}

interface UserAvatarProps {
  user: User;
  size?: "sm" | "md" | "lg";
}

const UserAvatar = ({ user, size = "sm" }: UserAvatarProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-lg",
  };

  // Generate initials from name or email
  const getInitials = (user: User) => {
    if (user.profile?.full_name) {
      return user.profile.full_name
        .split(" ")
        .map((name) => name[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user.email?.charAt(0).toUpperCase() || "U";
  };

  // Generate a consistent color based on user email
  const getAvatarColor = (email: string | undefined) => {
    const colors = [
      "from-blue-500 to-indigo-600",
      "from-purple-500 to-pink-600",
      "from-green-500 to-teal-600",
      "from-yellow-500 to-orange-600",
      "from-red-500 to-rose-600",
      "from-indigo-500 to-purple-600",
      "from-teal-500 to-cyan-600",
      "from-orange-500 to-red-600",
      "from-emerald-500 to-green-600",
      "from-violet-500 to-purple-600",
    ];

    const hash =
      email?.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
    return colors[hash % colors.length];
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  // Reset states when user changes
  useEffect(() => {
    if (user.profile?.avatar_url) {
      setImageLoading(true);
      setImageError(false);
    }
  }, [user.profile?.avatar_url]);

  // If we have a valid avatar URL and no error, show the image
  if (user.profile?.avatar_url && !imageError) {
    return (
      <div className={`${sizeClasses[size]} relative`}>
        {/* Loading skeleton */}
        {imageLoading && (
          <div
            className={`${sizeClasses[size]} bg-gray-200 rounded-full animate-pulse absolute inset-0 border-2 border-gray-200`}
          />
        )}

        {/* Actual image */}
        <Image
          src={user.profile.avatar_url}
          alt={`${user.profile?.full_name || "User"} avatar`}
          className={`${sizeClasses[size]} rounded-full border-2 border-gray-200 object-cover transition-opacity duration-300 ${
            imageLoading ? "opacity-0" : "opacity-100"
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
          width={sizeClasses[size]}
          height={sizeClasses[size]}
        />
      </div>
    );
  }

  // Fallback to initials with colored background
  return (
    <div
      className={`${sizeClasses[size]} bg-gradient-to-br ${getAvatarColor(user.email)} rounded-full flex items-center justify-center border-2 border-white shadow-sm transition-all duration-200 hover:shadow-md`}
      title={user.profile?.full_name || user.email || "User"}
    >
      <span
        className={`text-white font-semibold ${textSizes[size]} select-none`}
      >
        {getInitials(user)}
      </span>
    </div>
  );
};

// Loading avatar component
type AvatarSize = "sm" | "md" | "lg";

const LoadingAvatar = ({ size = "sm" }: { size?: AvatarSize }) => {
  const sizeClasses: Record<AvatarSize, string> = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  return (
    <div
      className={`${sizeClasses[size]} bg-gray-200 rounded-full animate-pulse border-2 border-gray-200`}
    />
  );
};

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [theme, setTheme] = useState("light");

  // Use the actual auth context
  const { user, loading, signOut } = useAuth();

  // Mock subscription data - replace with actual subscription hook when available
  const subscription = user
    ? {
        plan: { name: "Professional" },
        status: "active",
      }
    : null;

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showUserMenu) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showUserMenu]);

  // Initialize theme from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme") || "light";
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const navigationLinks = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      description: "Main dashboard",
    },
    {
      name: "Tenders",
      href: "/",
      icon: FileText,
      description: "Browse tenders",
    },
    {
      name: "Pricing",
      href: "/subscription",
      icon: CreditCard,
      description: "View plans",
    },
  ];

  const handleSignOut = async () => {
    try {
      setShowUserMenu(false); // Close menu immediately
      const result = await signOut();

      // Force redirect to login page after successful sign out
      window.location.href = "/login";

      // Clear any local storage or session data
      localStorage.removeItem("user");
      sessionStorage.clear();

      return result;
    } catch (error) {
      console.error("Error signing out:", error);
      // Show error message to user
      alert("Failed to sign out. Please try again.");

      // Optionally force a page reload as a last resort
      if (error instanceof Error && error.message.includes("session")) {
        window.location.reload();
      }
    }
  };

  const handleNavigation = (href: string) => {
    window.location.href = href;
    setIsOpen(false);
  };

  const handleUserMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowUserMenu(!showUserMenu);
  };

  const handleProfileClick = () => {
    window.location.href = "/profile";
    setShowUserMenu(false);
  };

  const handleSubscriptionClick = () => {
    window.location.href = "/subscription";
    setShowUserMenu(false);
  };

  const handleSettingsClick = () => {
    // In real implementation, navigate to settings page
    console.log("Navigate to settings");
    setShowUserMenu(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200"
          : "bg-white/90 backdrop-blur-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <button
              onClick={() => handleNavigation("/")}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity duration-200"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  RGUKT Tenders
                </h1>
                <p className="text-xs text-gray-500 -mt-1">Portal</p>
              </div>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.name}
                  onClick={() => handleNavigation(link.href)}
                  className="relative flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 group"
                  title={link.description}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium text-sm">{link.name}</span>
                </button>
              );
            })}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200"
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </button>

            {/* User Menu or Auth Buttons */}
            {loading ? (
              <div className="flex items-center space-x-3">
                <LoadingAvatar size="sm" />
                <div className="hidden sm:block">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-20 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
                </div>
              </div>
            ) : user ? (
              <div className="relative">
                <button
                  onClick={handleUserMenuClick}
                  className="flex items-center space-x-3 p-1 rounded-lg hover:bg-gray-50 transition-all duration-200 group"
                >
                  <UserAvatar user={user} size="sm" />

                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-700 max-w-32 truncate group-hover:text-blue-600 transition-colors">
                      {user.profile?.full_name || user.email?.split("@")[0]}
                    </p>
                    {subscription && subscription.status === "active" && (
                      <div className="flex items-center space-x-1">
                        <Crown className="h-3 w-3 text-yellow-500" />
                        <span className="text-xs text-gray-500">
                          {subscription.plan?.name}
                        </span>
                      </div>
                    )}
                  </div>

                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform duration-200 group-hover:text-gray-600 ${
                      showUserMenu ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* User Dropdown */}
                {showUserMenu && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 animate-in fade-in-0 zoom-in-95 duration-200">
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <UserAvatar user={user} size="lg" />

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {user.profile?.full_name || "User"}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {user.email}
                          </p>
                          {user.profile?.organization && (
                            <p className="text-xs text-gray-400 truncate">
                              {user.profile.organization}
                            </p>
                          )}
                        </div>
                      </div>

                      {subscription && subscription.status === "active" ? (
                        <div className="mt-3 flex items-center justify-between">
                          <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center space-x-1">
                            <Crown className="h-3 w-3" />
                            <span>{subscription.plan?.name} Plan</span>
                          </Badge>
                          <span className="text-xs text-green-600 font-medium">
                            Active
                          </span>
                        </div>
                      ) : (
                        <div className="mt-3">
                          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                            Free Plan
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <button
                        onClick={handleProfileClick}
                        className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 w-full text-left"
                      >
                        <User className="h-4 w-4" />
                        <span>Profile Settings</span>
                      </button>

                      <button
                        onClick={handleSubscriptionClick}
                        className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 w-full text-left"
                      >
                        <Crown className="h-4 w-4" />
                        <span>Subscription & Billing</span>
                      </button>

                      <button
                        onClick={handleSettingsClick}
                        className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 w-full text-left"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Account Settings</span>
                      </button>

                      <button
                        onClick={() => handleNavigation("/notifications")}
                        className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 w-full text-left"
                      >
                        <Mail className="h-4 w-4" />
                        <span>Email Preferences</span>
                      </button>

                      <hr className="my-2 border-gray-100" />

                      <button
                        onClick={handleSignOut}
                        className="flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 w-full text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNavigation("/login")}
                  className="hover:bg-blue-50 hover:text-blue-600"
                >
                  Sign In
                </Button>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 shadow-sm"
                  onClick={() => handleNavigation("/subscription")}
                >
                  Get Started
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200"
            >
              {isOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 py-4 space-y-2 animate-in slide-in-from-top-5 duration-300">
            {/* Mobile Navigation Links */}
            {navigationLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.name}
                  onClick={() => handleNavigation(link.href)}
                  className="flex items-center space-x-3 px-2 py-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150 w-full text-left"
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{link.name}</span>
                </button>
              );
            })}

            {/* Mobile User Actions */}
            {user ? (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="px-2 pb-3">
                  <div className="flex items-center space-x-3">
                    <UserAvatar user={user} size="md" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {user.profile?.full_name || "User"}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleProfileClick}
                  className="flex items-center space-x-3 px-2 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150 rounded-lg w-full text-left"
                >
                  <User className="h-5 w-5" />
                  <span>Profile</span>
                </button>

                <button
                  onClick={handleSubscriptionClick}
                  className="flex items-center space-x-3 px-2 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150 rounded-lg w-full text-left"
                >
                  <Crown className="h-5 w-5" />
                  <span>Subscription</span>
                </button>

                <button
                  onClick={() => {
                    handleSignOut();
                    setIsOpen(false);
                  }}
                  className="flex items-center space-x-3 px-2 py-3 text-red-600 hover:bg-red-50 transition-colors duration-150 rounded-lg w-full text-left"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start hover:bg-blue-50 hover:text-blue-600"
                  onClick={() => handleNavigation("/login")}
                >
                  Sign In
                </Button>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => handleNavigation("/subscription")}
                >
                  Get Started
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
