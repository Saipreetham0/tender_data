"use client";
import React from "react";
import { OptimizedButton } from "@/components/ui/OptimizedButton";
import { Building2, Menu, X } from "lucide-react";

interface FastNavbarProps {
  isAuthenticated?: boolean;
  userEmail?: string;
  onSignIn?: () => void;
  onSignOut?: () => void;
  onGetStarted?: () => void;
  onNavigate?: (path: string) => void;
}

const FastNavbar = React.memo(({
  isAuthenticated = false,
  userEmail,
  onSignIn,
  onSignOut,
  onGetStarted,
  onNavigate
}: FastNavbarProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleNavigation = React.useCallback((path: string) => {
    setMobileMenuOpen(false);
    onNavigate?.(path);
  }, [onNavigate]);

  const handleSignOut = React.useCallback(() => {
    setMobileMenuOpen(false);
    onSignOut?.();
  }, [onSignOut]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <button
            onClick={() => handleNavigation("/")}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
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

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <button
              onClick={() => handleNavigation("/")}
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Tenders
            </button>
            <button
              onClick={() => handleNavigation("/subscription")}
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Pricing
            </button>

            {/* Auth Section */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">
                  {userEmail?.split("@")[0]}
                </span>
                <OptimizedButton
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                >
                  Sign Out
                </OptimizedButton>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <OptimizedButton
                  variant="ghost"
                  size="sm"
                  onClick={onSignIn}
                >
                  Sign In
                </OptimizedButton>
                <OptimizedButton
                  size="sm"
                  onClick={onGetStarted}
                >
                  Get Started
                </OptimizedButton>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 py-4 space-y-2">
            <button
              onClick={() => handleNavigation("/")}
              className="block w-full text-left px-2 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
            >
              Tenders
            </button>
            <button
              onClick={() => handleNavigation("/subscription")}
              className="block w-full text-left px-2 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
            >
              Pricing
            </button>

            <div className="border-t border-gray-200 pt-4 mt-4">
              {isAuthenticated ? (
                <div className="space-y-2">
                  <p className="px-2 text-sm text-gray-600">
                    Signed in as {userEmail?.split("@")[0]}
                  </p>
                  <OptimizedButton
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </OptimizedButton>
                </div>
              ) : (
                <div className="space-y-2">
                  <OptimizedButton
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={onSignIn}
                  >
                    Sign In
                  </OptimizedButton>
                  <OptimizedButton
                    className="w-full"
                    onClick={onGetStarted}
                  >
                    Get Started
                  </OptimizedButton>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
});

FastNavbar.displayName = "FastNavbar";

export { FastNavbar };