export default function DisclaimerPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Disclaimer</h2>
      <p className="text-sm text-gray-500 mb-6">Effective Date: 11th July 2025</p>

      <p className="mb-4">
        <strong>TendersNotify.site</strong> is an independent platform that aggregates publicly available tender data from various sources.
      </p>

      <ul className="list-disc ml-6 mb-4">
        <li>We are <strong>not affiliated with or endorsed by any government department or RGUKT</strong>.</li>
        <li>All data is sourced from publicly accessible tender portals and presented as-is.</li>
        <li>We do not guarantee the accuracy, completeness, or real-time availability of the data.</li>
        <li>Users are responsible for verifying details from official sources before making any business decisions.</li>
      </ul>

      <p className="mb-4">
        If you believe any information on our platform violates copyright or misrepresents a public body, please contact us immediately.
      </p>
    </div>
  );
}
