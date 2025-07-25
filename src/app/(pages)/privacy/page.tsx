export default function PrivacyPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Privacy Policy</h2>
      <p className="text-sm text-gray-500 mb-6">Effective Date: 11th July 2025</p>

      <p className="mb-4">
        Your privacy is important to us. This Privacy Policy explains how <strong>TendersNotify.site</strong> collects, uses, and protects your personal data.
      </p>

      <h3 className="font-semibold text-lg mt-6 mb-2">1. Information We Collect</h3>
      <ul className="list-disc ml-6 mb-4">
        <li>Name, email address, and phone number</li>
        <li>Payment and subscription details (via secure payment providers)</li>
        <li>IP address, browser type, device info (for analytics)</li>
      </ul>

      <h3 className="font-semibold text-lg mt-6 mb-2">2. How We Use Your Data</h3>
      <ul className="list-disc ml-6 mb-4">
        <li>To send tender updates and manage subscriptions</li>
        <li>To improve our services and platform performance</li>
        <li>To notify you of new features, offers, or account updates</li>
      </ul>

      <h3 className="font-semibold text-lg mt-6 mb-2">3. Sharing of Data</h3>
      <p className="mb-4">
        We do <strong>not sell</strong> your data. We may share it only with trusted third parties such as payment gateways or analytics tools to operate and improve the platform.
      </p>

      <h3 className="font-semibold text-lg mt-6 mb-2">4. Data Security</h3>
      <p className="mb-4">
        We implement industry-standard encryption and security practices to keep your information safe.
      </p>

      <h3 className="font-semibold text-lg mt-6 mb-2">5. Your Rights</h3>
      <p className="mb-4">
        You can request to update, correct, or delete your personal data at any time by emailing us at <a href="mailto:support@tendersnotify.site" className="text-blue-600 underline">support@tendersnotify.site</a>.
      </p>
    </div>
  );
}
