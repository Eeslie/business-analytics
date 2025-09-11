export default function ComplianceReportsPage() {
  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-orange-900">Compliance and Regulatory Reporting</h2>
        <p className="text-black/80 mt-1 max-w-3xl">
          Create audit trails and compliant financial statements while maintaining historical reports for audits and inspections.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-black/10 p-5">
          <h3 className="text-lg font-semibold text-green-900">Audit Readiness</h3>
          <ul className="list-disc ml-5 mt-2 text-black/90 space-y-1">
            <li>Comprehensive audit trails</li>
            <li>Immutable history</li>
            <li>Time-stamped exports</li>
          </ul>
        </div>

        <div className="rounded-lg border border-black/10 p-5">
          <h3 className="text-lg font-semibold text-green-900">Standards Compliance</h3>
          <ul className="list-disc ml-5 mt-2 text-black/90 space-y-1">
            <li>Local/legal format templates</li>
            <li>Validation before export</li>
            <li>Retention policies</li>
          </ul>
        </div>
      </div>
    </section>
  );
}


