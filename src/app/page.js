export default function Home() {
  return (
    <main className="min-h-screen p-8 sm:p-12 bg-white text-black">
      <section className="max-w-3xl space-y-4">
        <h1 className="text-3xl font-bold text-green-900">Welcome</h1>
        <p className="text-black/80">Explore the ERP Business Intelligence / Report module.</p>
        <div className="pt-2">
          <a
            href="/bi"
            className="inline-block rounded-lg border border-black/10 bg-white px-4 py-2 text-orange-900 hover:bg-black/[.03]"
          >
            Go to BI / Report Module
          </a>
        </div>
      </section>
    </main>
  );
}
