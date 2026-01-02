export default function Home() {
  return (
    <main className="min-h-screen p-8 sm:p-12 bg-white text-black">
      <section className="max-w-3xl space-y-4">
        <h1 className="text-3xl font-bold text-green-900">Welcome</h1>
        <p className="text-black/80">Explore the ERP Business Intelligence / Report module.</p>
        <div className="pt-2">
          <a
            href="/bi"
            className="inline-block rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 font-medium shadow-md hover:from-green-700 hover:to-emerald-700 transition-all duration-200 hover:shadow-lg"
          >
            Go to BI / Report Module
          </a>
        </div>
      </section>
    </main>
  );
}
