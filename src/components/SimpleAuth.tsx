"use client";
import React, { useState } from "react";
import { OptimizedButton } from "@/components/ui/OptimizedButton";

interface SimpleAuthProps {
  onSignIn?: () => void;
  onGetStarted?: () => void;
}

const SimpleAuth = React.memo(({ onSignIn, onGetStarted }: SimpleAuthProps) => {
  const [signInLoading, setSignInLoading] = useState(false);
  const [getStartedLoading, setGetStartedLoading] = useState(false);

  const handleSignIn = async () => {
    setSignInLoading(true);
    try {
      onSignIn?.();
    } finally {
      setSignInLoading(false);
    }
  };

  const handleGetStarted = async () => {
    setGetStartedLoading(true);
    try {
      onGetStarted?.();
    } finally {
      setGetStartedLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <OptimizedButton
        variant="ghost"
        size="sm"
        loading={signInLoading}
        onClick={handleSignIn}
        className="hover:bg-blue-50 hover:text-blue-600"
      >
        Sign In
      </OptimizedButton>

      <OptimizedButton
        size="sm"
        loading={getStartedLoading}
        onClick={handleGetStarted}
        className="bg-blue-600 hover:bg-blue-700 shadow-sm"
      >
        Get Started
      </OptimizedButton>
    </div>
  );
});

SimpleAuth.displayName = "SimpleAuth";

export { SimpleAuth };