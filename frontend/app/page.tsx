import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900">

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-xl shadow-sm">
              🛡️
            </div>

            <div>
              <div className="text-lg font-bold tracking-tight">
                PurchaseGuard
              </div>
              <div className="hidden text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400 sm:block">
                Purchase protection
              </div>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-500 lg:flex">
            <a href="#features" className="transition hover:text-slate-900">
              Features
            </a>

            <a href="#how-it-works" className="transition hover:text-slate-900">
              How it works
            </a>

            <a href="#security" className="transition hover:text-slate-900">
              Security
            </a>
          </nav>

          {/* Auth buttons */}
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Login
            </Link>

            <Link
              href="/signup"
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">

        {/* Background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-[-250px] h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-blue-100/70 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-20 sm:px-8 lg:pb-28 lg:pt-28">

          <div className="grid items-center gap-16 lg:grid-cols-2">

            {/* LEFT */}
            <div>

              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
                <span className="h-2 w-2 rounded-full bg-blue-600" />
                Smart purchase management
              </div>

              <h1 className="max-w-2xl text-5xl font-bold leading-[1.05] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
                Every purchase.
                <br />
                <span className="text-blue-600">
                  Protected.
                </span>
              </h1>

              <p className="mt-7 max-w-xl text-lg leading-8 text-slate-500">
                PurchaseGuard keeps your invoices, warranties and subscription
                information organized in one secure place — and reminds you
                before important dates arrive.
              </p>

              {/* CTA */}
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">

                <Link
                  href="/signup"
                  className="group flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                >
                  Get Started Free
                  <span className="transition group-hover:translate-x-1">
                    →
                  </span>
                </Link>

                <Link
                  href="/login"
                  className="flex items-center justify-center rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Login to PurchaseGuard
                </Link>

              </div>

              {/* Trust points */}
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500">

                <div className="flex items-center gap-2">
                  <span className="text-emerald-600">✓</span>
                  Private storage
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-emerald-600">✓</span>
                  AI document extraction
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-emerald-600">✓</span>
                  Warranty reminders
                </div>

              </div>
            </div>

            {/* RIGHT PRODUCT PREVIEW */}
            <div className="relative">

              <div className="absolute -inset-8 rounded-[3rem] bg-blue-200/40 blur-3xl" />

              <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/40">

                {/* Browser header */}
                <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">

                  <div className="h-2.5 w-2.5 rounded-full bg-red-300" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-300" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-300" />

                  <div className="ml-4 flex-1 rounded-lg bg-slate-50 px-4 py-2 text-center text-xs text-slate-400">
                    app.purchaseguard
                  </div>

                </div>

                {/* Dashboard */}
                <div className="p-6">

                  <div className="flex items-center justify-between">

                    <div>
                      <p className="text-xs font-medium text-slate-400">
                        Dashboard
                      </p>

                      <h3 className="mt-1 text-xl font-bold">
                        Your purchases
                      </h3>
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                      🛡️
                    </div>

                  </div>

                  {/* Stats */}
                  <div className="mt-6 grid grid-cols-3 gap-3">

                    <DashboardStat
                      title="Products"
                      value="12"
                    />

                    <DashboardStat
                      title="Warranties"
                      value="8"
                    />

                    <DashboardStat
                      title="Reminders"
                      value="3"
                    />

                  </div>

                  {/* Product */}
                  <div className="mt-5 rounded-2xl border border-slate-100 p-5">

                    <div className="flex items-center justify-between">

                      <div className="flex items-center gap-3">

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-xl">
                          📱
                        </div>

                        <div>
                          <p className="text-sm font-bold">
                            Samsung Galaxy S24
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            Warranty protection
                          </p>
                        </div>

                      </div>

                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-600">
                        ACTIVE
                      </span>

                    </div>

                    <div className="mt-6">

                      <div className="mb-2 flex justify-between text-xs">

                        <span className="text-slate-400">
                          Warranty period
                        </span>

                        <span className="font-medium text-slate-600">
                          Active
                        </span>

                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">

                        <div className="h-full w-[70%] rounded-full bg-blue-600" />

                      </div>

                    </div>

                  </div>

                  {/* Reminder */}
                  <div className="mt-4 flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
                      🔔
                    </div>

                    <div>

                      <p className="text-sm font-semibold text-slate-800">
                        Upcoming reminder
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Warranty reminder scheduled
                      </p>

                    </div>

                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* PRODUCT STRIP */}
      <section className="border-y border-slate-200 bg-white">

        <div className="mx-auto flex max-w-7xl flex-wrap justify-center gap-x-12 gap-y-5 px-5 py-7 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 sm:px-8 lg:justify-between">

          <span>Invoices</span>
          <span>Receipts</span>
          <span>Warranty Cards</span>
          <span>Purchase Records</span>
          <span>Subscriptions</span>

        </div>

      </section>

      {/* FEATURES */}
      <section id="features">

        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32">

          <div className="max-w-2xl">

            <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">
              Everything organized
            </p>

            <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              One place for everything
              <br />
              you need after a purchase.
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-500">
              Instead of searching through emails, galleries and folders,
              keep important purchase information together.
            </p>

          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">

            <Feature
              icon="📄"
              title="Document storage"
              description="Keep invoices, receipts and warranty documents organized inside your account."
            />

            <Feature
              icon="✨"
              title="AI extraction"
              description="Extract product and warranty information from uploaded purchase documents."
            />

            <Feature
              icon="🔔"
              title="Warranty reminders"
              description="Receive reminders before your warranty reaches important deadlines."
            />

            <Feature
              icon="📊"
              title="Purchase dashboard"
              description="See your products, warranties and upcoming reminders from one dashboard."
            />

            <Feature
              icon="💳"
              title="Subscription tracking"
              description="Track recurring services and upcoming subscription payments."
            />

            <Feature
              icon="🔐"
              title="Private access"
              description="Your documents are associated with your authenticated PurchaseGuard account."
            />

          </div>

        </div>

      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="border-y border-slate-200 bg-white"
      >

        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32">

          <div className="text-center">

            <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">
              How it works
            </p>

            <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Simple from day one.
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-500">
              Upload your documents and let PurchaseGuard handle the
              organization and reminders.
            </p>

          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">

            <Step
              number="01"
              title="Upload"
              description="Upload your invoice, receipt or warranty card."
            />

            <Step
              number="02"
              title="Analyze"
              description="AI extracts the useful information from your document."
            />

            <Step
              number="03"
              title="Protect"
              description="PurchaseGuard stores the information and creates reminders."
            />

          </div>

        </div>

      </section>

      {/* SECURITY */}
      <section id="security">

        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32">

          <div className="grid items-center gap-16 lg:grid-cols-2">

            <div>

              <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">
                Built around your data
              </p>

              <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                Your purchase information
                <br />
                stays organized.
              </h2>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-500">
                PurchaseGuard is designed around authenticated accounts,
                private document storage and controlled access to purchase
                information.
              </p>

              <div className="mt-8 space-y-4">

                <SecurityItem text="Private document storage" />
                <SecurityItem text="Authenticated account access" />
                <SecurityItem text="Database access controls" />
                <SecurityItem text="AI does not guess missing warranty information" />

              </div>

            </div>

            <div>

              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
                  🔐
                </div>

                <h3 className="mt-7 text-2xl font-bold">
                  Designed for personal purchase records.
                </h3>

                <p className="mt-4 leading-7 text-slate-500">
                  Your documents, products, warranties and reminders are
                  connected to your PurchaseGuard account.
                </p>

                <div className="mt-8 grid grid-cols-2 gap-3">

                  <SecurityCard title="Private" />
                  <SecurityCard title="Authenticated" />
                  <SecurityCard title="Organized" />
                  <SecurityCard title="Controlled" />

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* CTA */}
      <section className="px-5 pb-24 sm:px-8">

        <div className="mx-auto max-w-5xl rounded-[2rem] bg-slate-900 px-6 py-20 text-center text-white sm:px-12">

          <div className="mx-auto max-w-2xl">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-2xl">
              🛡️
            </div>

            <h2 className="mt-7 text-4xl font-bold tracking-tight sm:text-5xl">
              Start protecting your purchases.
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-400">
              Create your PurchaseGuard account and keep your important
              purchase information in one place.
            </p>

            <Link
              href="/signup"
              className="mt-9 inline-flex rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-slate-900 transition hover:bg-slate-100"
            >
              Create Account →
            </Link>

          </div>

        </div>

      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white">

        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 sm:px-8 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-sm">
              🛡️
            </div>

            <div>
              <p className="text-sm font-bold">
                PurchaseGuard
              </p>

              <p className="text-xs text-slate-400">
                Protect every purchase.
              </p>
            </div>

          </div>

          <div className="flex gap-6 text-sm text-slate-500">

            <Link
              href="/login"
              className="transition hover:text-slate-900"
            >
              Login
            </Link>

            <Link
              href="/signup"
              className="transition hover:text-slate-900"
            >
              Sign Up
            </Link>

          </div>

          <p className="text-xs text-slate-400">
            © 2026 PurchaseGuard
          </p>

        </div>

      </footer>

    </main>
  );
}


/* COMPONENTS */

function DashboardStat({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">

      <p className="text-[11px] font-medium text-slate-400">
        {title}
      </p>

      <p className="mt-2 text-xl font-bold">
        {value}
      </p>

    </div>
  );
}


function Feature({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">

      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-xl">
        {icon}
      </div>

      <h3 className="mt-6 text-lg font-bold">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-7 text-slate-500">
        {description}
      </p>

    </div>
  );
}


function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8">

      <div className="text-sm font-bold tracking-[0.15em] text-blue-600">
        {number}
      </div>

      <h3 className="mt-6 text-xl font-bold">
        {title}
      </h3>

      <p className="mt-4 leading-7 text-slate-500">
        {description}
      </p>

    </div>
  );
}


function SecurityItem({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 text-sm font-medium text-slate-700">

      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-xs text-emerald-600">
        ✓
      </span>

      {text}

    </div>
  );
}


function SecurityCard({
  title,
}: {
  title: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-xs font-semibold text-slate-500">
      {title}
    </div>
  );
}