export default function BiHomePage() {
  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-3xl font-bold text-green-900">ERP Module: Business Intelligence / Report</h2>
        <p className="text-black/80 max-w-3xl">
          Central hub for analytics and reporting across your ERP. Explore the capabilities below or use the navigation above to jump directly to a section.
        </p>
      </header>

      <div className="grid sm:grid-cols-2 gap-6">
        <a href="/bi/standard-custom" className="block rounded-lg border border-black/10 p-5 hover:bg-black/[.03]">
          <h3 className="text-xl font-semibold text-orange-900">Standard & Custom Report Generation</h3>
          <p className="text-black/80 mt-1">Built-in reports with customization for layout, filters, and scheduling.</p>
        </a>

        <a href="/bi/real-time" className="block rounded-lg border border-black/10 p-5 hover:bg-black/[.03]">
          <h3 className="text-xl font-semibold text-green-900">Real-Time Data Retrieval</h3>
          <p className="text-black/80 mt-1">Live reports powered by up-to-date operational data from the ERP.</p>
        </a>

        <a href="/bi/compliance" className="block rounded-lg border border-black/10 p-5 hover:bg-black/[.03]">
          <h3 className="text-xl font-semibold text-orange-900">Compliance & Regulatory Reporting</h3>
          <p className="text-black/80 mt-1">Generate compliant statements with audit trails and historical retention.</p>
        </a>

        <a href="/bi/access" className="block rounded-lg border border-black/10 p-5 hover:bg-black/[.03]">
          <h3 className="text-xl font-semibold text-green-900">Role-Based Access & Security</h3>
          <p className="text-black/80 mt-1">Control access, define permissions and track report access logs.</p>
        </a>
      </div>
    </section>
  );
}


