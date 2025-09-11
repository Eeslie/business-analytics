import Link from "next/link";

export default function BiLayout({ children }) {
  return (
    <div className="min-h-screen bg-white text-black">
      <header className="border-b border-black/10">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            <span className="text-green-900">Business Intelligence</span>
            <span className="mx-2 text-black">/</span>
            <span className="text-orange-900">Report Module</span>
          </h1>
          <nav className="text-sm font-medium">
            <ul className="flex gap-4 sm:gap-6">
              <li>
                <Link className="hover:underline" href="/bi">Overview</Link>
              </li>
              <li>
                <Link className="hover:underline" href="/bi/standard-custom">Standard & Custom</Link>
              </li>
              <li>
                <Link className="hover:underline" href="/bi/real-time">Real‑Time</Link>
              </li>
              <li>
                <Link className="hover:underline" href="/bi/compliance">Compliance</Link>
              </li>
              <li>
                <Link className="hover:underline" href="/bi/access">Access & Security</Link>
              </li>
              <li>
                <Link className="hover:underline" href="/bi/tal">Time & Leave</Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 sm:py-10">{children}</main>
    </div>
  );
}


