"use client";
import Navbar from "@/components/NavBar";
import SubscriptionManager from "@/components/subscription/SubscriptionManager";

export default function SubscriptionPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="pt-16">
          <SubscriptionManager />
        </div>
      </div>
    </>
  );
}
