"use client";
import React from "react";

interface FastAuthUser {
  id: string;
  email: string;
  name?: string;
}

interface FastAuthState {
  user: FastAuthUser | null;
  loading: boolean;
}

class FastAuthService {
  private state: FastAuthState = { user: null, loading: true };
  private listeners: Array<(state: FastAuthState) => void> = [];
  private initialized = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.initializeFromCache();
    }
  }

  private initializeFromCache() {
    try {
      const cached = localStorage.getItem("fast-auth-user");
      if (cached) {
        const user = JSON.parse(cached);
        if (this.isValidUser(user)) {
          this.state.user = user;
        }
      }
    } catch (error) {
      console.warn("Fast auth cache error:", error);
    } finally {
      this.state.loading = false;
      this.initialized = true;
      this.notify();
    }
  }

  private isValidUser(user: any): user is FastAuthUser {
    return user && typeof user.id === "string" && typeof user.email === "string";
  }

  private notify() {
    this.listeners.forEach(listener => {
      try {
        listener({ ...this.state });
      } catch (error) {
        console.error("Fast auth listener error:", error);
      }
    });
  }

  subscribe(listener: (state: FastAuthState) => void) {
    this.listeners.push(listener);

    // If already initialized, notify immediately
    if (this.initialized) {
      listener({ ...this.state });
    }

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  async signIn(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Simulate network delay for demo
      await new Promise(resolve => setTimeout(resolve, 500));

      const user: FastAuthUser = {
        id: Date.now().toString(),
        email,
        name: email.split("@")[0]
      };

      this.state.user = user;

      if (typeof window !== "undefined") {
        localStorage.setItem("fast-auth-user", JSON.stringify(user));
      }

      this.notify();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Sign in failed"
      };
    }
  }

  async signOut(): Promise<void> {
    this.state.user = null;

    if (typeof window !== "undefined") {
      localStorage.removeItem("fast-auth-user");
    }

    this.notify();
  }

  getState(): FastAuthState {
    return { ...this.state };
  }

  isAuthenticated(): boolean {
    return !!this.state.user;
  }
}

// Singleton instance
export const fastAuth = new FastAuthService();

// React hook
export function useFastAuth() {
  const [state, setState] = React.useState<FastAuthState>(() => fastAuth.getState());

  React.useEffect(() => {
    return fastAuth.subscribe(setState);
  }, []);

  return {
    ...state,
    signIn: fastAuth.signIn.bind(fastAuth),
    signOut: fastAuth.signOut.bind(fastAuth),
    isAuthenticated: fastAuth.isAuthenticated.bind(fastAuth)
  };
}

// For non-React usage
export { FastAuthService };