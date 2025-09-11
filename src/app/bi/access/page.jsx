export default function AccessSecurityReportsPage() {
  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-green-900">Role-Based Report Access and Security</h2>
        <p className="text-black/80 mt-1 max-w-3xl">
          Control access to sensitive reports, define permissions for view, edit, and export, and track access logs to support data privacy and integrity.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-black/10 p-5">
          <h3 className="text-lg font-semibold text-orange-900">Access Control</h3>
          <ul className="list-disc ml-5 mt-2 text-black/90 space-y-1">
            <li>Restrict sensitive reports (salary, revenue)</li>
            <li>Department or role-based scopes</li>
            <li>Least-privilege defaults</li>
          </ul>
        </div>

        <div className="rounded-lg border border-black/10 p-5">
          <h3 className="text-lg font-semibold text-orange-900">Governance</h3>
          <ul className="list-disc ml-5 mt-2 text-black/90 space-y-1">
            <li>Access logs and analytics</li>
            <li>Export permissions and watermarking</li>
            <li>Privacy and integrity checks</li>
          </ul>
        </div>
      </div>
    </section>
  );
}


