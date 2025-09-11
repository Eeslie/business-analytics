export default function RealTimeReportsPage() {
  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-green-900">Real-Time Data Retrieval</h2>
        <p className="text-black/80 mt-1 max-w-3xl">
          Pull live data from transactions and logs to generate on-the-fly reports without waiting for batch processing.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-black/10 p-5">
          <h3 className="text-lg font-semibold text-orange-900">Instant Insights</h3>
          <ul className="list-disc ml-5 mt-2 text-black/90 space-y-1">
            <li>Live KPIs and metrics</li>
            <li>Transaction-level drill-down</li>
            <li>No batch delays</li>
          </ul>
        </div>

        <div className="rounded-lg border border-black/10 p-5">
          <h3 className="text-lg font-semibold text-orange-900">Decision Support</h3>
          <ul className="list-disc ml-5 mt-2 text-black/90 space-y-1">
            <li>Dashboards auto-refresh</li>
            <li>Prevent data silos & outdated views</li>
            <li>API-ready data access</li>
          </ul>
        </div>
      </div>
    </section>
  );
}


