import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy - RGUKT Tenders Portal",
  description: "Refund and cancellation policy for RGUKT Tenders Portal subscriptions and services.",
};

export default function RefundPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Refund & Cancellation Policy</h2>
      <p className="text-sm text-gray-500 mb-6">Effective Date: 11th July 2025</p>

      <p className="mb-4">
        At <strong>TendersNotify.site</strong>, we offer digital services through a subscription model. Please read this policy carefully before purchasing.
      </p>

      <h3 className="font-semibold text-lg mt-6 mb-2">1. Refund Policy</h3>
      <p className="mb-4">
        Subscriptions are generally <strong>non-refundable</strong>. However, refunds may be granted in the following cases:
      </p>
      <ul className="list-disc ml-6 mb-4">
        <li>Double billing or payment errors</li>
        <li>Platform unavailability for more than 48 consecutive hours</li>
      </ul>

      <h3 className="font-semibold text-lg mt-6 mb-2">2. Cancellation Policy</h3>
      <p className="mb-4">
        You may cancel your subscription at any time. Your access will remain active until the end of the current billing cycle, and you will not be charged again.
      </p>

      <h3 className="font-semibold text-lg mt-6 mb-2">3. Contact for Refunds</h3>
      <p className="mb-4">
        To request a refund, email us within 7 days of the issue at <a href="mailto:billing@tendersnotify.site" className="text-blue-600 underline">billing@tendersnotify.site</a>.
      </p>
    </div>
  );
}
