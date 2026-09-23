"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);
    };

    loadUser();
  }, [router]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (!user) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-black" />
          <p className="text-sm text-gray-500">
            Loading PurchaseGuard...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-gray-900">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/90 backdrop-blur-xl">

        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">

          {/* Logo */}

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white shadow-sm">
              <ShieldIcon />
            </div>

            <div>
              <p className="text-[15px] font-bold tracking-tight">
                PurchaseGuard
              </p>

              <p className="hidden text-[9px] font-semibold uppercase tracking-[0.18em] text-gray-400 sm:block">
                Purchase protection
              </p>
            </div>

          </div>

          {/* User */}

          <div className="flex items-center gap-3">

            <div className="hidden items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 sm:flex">

              <div className="h-2 w-2 rounded-full bg-emerald-500" />

              <span className="max-w-[190px] truncate text-xs text-gray-600">
                {user.email}
              </span>

            </div>

            <button
              onClick={logout}
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            >
              Sign out
            </button>

          </div>

        </div>

      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-14">

        {/* Welcome */}

        <section className="mb-10">

          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">

            <div>

              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 shadow-sm">

                <SparkleIcon />

                <span className="text-xs font-semibold text-gray-600">
                  Your purchase command center
                </span>

              </div>

              <h1 className="text-4xl font-bold tracking-[-0.04em] text-gray-950 sm:text-5xl">
                Welcome back 👋
              </h1>

              <p className="mt-3 max-w-2xl text-base leading-7 text-gray-500">
                Keep your purchases, warranties, and important
                renewal dates organized in one place.
              </p>

            </div>

            <button
              onClick={() => router.push("/documents")}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-gray-800"
            >
              <UploadIcon />
              Add document
            </button>

          </div>

        </section>

        {/* =====================================================
            STATS
        ===================================================== */}

        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <StatCard
            label="Protected purchases"
            value="0"
            description="Documents analyzed"
            icon={<DocumentIcon />}
          />

          <StatCard
            label="Active warranties"
            value="0"
            description="Currently protected"
            icon={<ShieldIcon />}
          />

          <StatCard
            label="Expiring soon"
            value="0"
            description="Next 30 days"
            icon={<ClockIcon />}
          />

          <StatCard
            label="Upcoming renewals"
            value="0"
            description="Subscriptions"
            icon={<BellIcon />}
          />

        </section>

        {/* =====================================================
            PRIMARY CARDS
        ===================================================== */}

        <section className="grid gap-6 lg:grid-cols-3">

          {/* Documents */}

          <DashboardCard
            icon={<DocumentIcon />}
            eyebrow="Documents"
            title="Your purchases"
            description="Upload and organize invoices, receipts, and warranty cards."
            buttonText="Manage documents"
            onClick={() => router.push("/documents")}
          />

          {/* Warranties */}

          <DashboardCard
            icon={<ShieldIcon />}
            eyebrow="Warranties"
            title="Warranty protection"
            description="Track coverage, warranty periods, and expiration dates."
            buttonText="View warranties"
            onClick={() => router.push("/warranties")}
          />

          {/* Reminders */}

          <DashboardCard
            icon={<BellIcon />}
            eyebrow="Reminders"
            title="Never miss a renewal"
            description="Stay ahead of warranty expirations and subscription renewals."
            buttonText="View reminders"
            onClick={() => router.push("/reminders")}
          />

        </section>

        {/* =====================================================
            QUICK ACTIONS + AI
        ===================================================== */}

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">

          {/* Quick actions */}

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_10px_40px_rgba(0,0,0,0.04)]">

            <div className="mb-6">

              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                Quick actions
              </p>

              <h2 className="mt-2 text-xl font-bold tracking-tight">
                What would you like to do?
              </h2>

            </div>

            <div className="space-y-3">

              <ActionButton
                icon={<UploadIcon />}
                title="Upload a document"
                description="Analyze an invoice or warranty card"
                onClick={() => router.push("/documents")}
              />

              <ActionButton
                icon={<ShieldIcon />}
                title="Check warranties"
                description="See your current warranty coverage"
                onClick={() => router.push("/warranties")}
              />

              <ActionButton
                icon={<BellIcon />}
                title="Check reminders"
                description="Review upcoming dates"
                onClick={() => router.push("/reminders")}
              />

            </div>

          </div>

          {/* AI card */}

          <div className="relative overflow-hidden rounded-3xl bg-black p-7 text-white shadow-[0_20px_50px_rgba(0,0,0,0.12)] sm:p-8">

            {/* Background decoration */}

            <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />

            <div className="absolute -bottom-24 -left-16 h-60 w-60 rounded-full bg-white/5 blur-3xl" />

            <div className="relative">

              <div className="mb-7 flex items-center justify-between">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                  <SparkleIcon />
                </div>

                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/70">
                  AI powered
                </span>

              </div>

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
                PurchaseGuard intelligence
              </p>

              <h2 className="mt-3 max-w-lg text-3xl font-bold tracking-[-0.03em]">
                Your documents should work for you.
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-6 text-white/60">
                Upload your purchase documents and PurchaseGuard
                can extract product details, purchase dates,
                serial numbers, and warranty information.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">

                <Feature
                  icon={<ScanIcon />}
                  text="Reads documents"
                />

                <Feature
                  icon={<SparkleIcon />}
                  text="Extracts details"
                />

                <Feature
                  icon={<BellIcon />}
                  text="Tracks dates"
                />

              </div>

              <button
                onClick={() => router.push("/documents")}
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-gray-100"
              >
                Analyze a document
                <ArrowRightIcon />
              </button>

            </div>

          </div>

        </section>

        {/* =====================================================
            EMPTY STATE
        ===================================================== */}

        <section className="mt-8 rounded-3xl border border-dashed border-gray-300 bg-white p-8 text-center sm:p-12">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
            <DocumentIcon />
          </div>

          <h2 className="mt-5 text-xl font-bold">
            Start protecting your purchases
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
            Your dashboard will become more useful as you add
            invoices, receipts, and warranty documents.
          </p>

          <button
            onClick={() => router.push("/documents")}
            className="mt-6 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Upload your first document
          </button>

        </section>

        {/* Footer */}

        <footer className="mt-10 flex items-center justify-center gap-2 text-xs text-gray-400">
          <LockIcon />
          PurchaseGuard keeps your purchase information secure.
        </footer>

      </div>

    </main>
  );
}


/* =========================================================
   COMPONENTS
========================================================= */

function StatCard({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_6px_25px_rgba(0,0,0,0.03)] transition hover:-translate-y-0.5 hover:shadow-md">

      <div className="flex items-start justify-between">

        <div>
          <p className="text-xs font-semibold text-gray-400">
            {label}
          </p>

          <p className="mt-3 text-3xl font-bold tracking-tight text-gray-950">
            {value}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            {description}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
          {icon}
        </div>

      </div>

    </div>
  );
}


function DashboardCard({
  icon,
  eyebrow,
  title,
  description,
  buttonText,
  onClick,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  buttonText: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group text-left rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_10px_40px_rgba(0,0,0,0.04)] transition duration-200 hover:-translate-y-1 hover:shadow-xl"
    >

      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-800 transition group-hover:bg-black group-hover:text-white">
        {icon}
      </div>

      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
        {eyebrow}
      </p>

      <h2 className="mt-2 text-xl font-bold tracking-tight text-gray-950">
        {title}
      </h2>

      <p className="mt-2 min-h-[48px] text-sm leading-6 text-gray-500">
        {description}
      </p>

      <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-gray-900">
        {buttonText}
        <ArrowRightIcon />
      </div>

    </button>
  );
}


function ActionButton({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-4 rounded-xl border border-gray-100 p-3 text-left transition hover:border-gray-200 hover:bg-gray-50"
    >

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700 transition group-hover:bg-black group-hover:text-white">
        {icon}
      </div>

      <div className="flex-1">

        <p className="text-sm font-semibold text-gray-900">
          {title}
        </p>

        <p className="mt-0.5 text-xs text-gray-400">
          {description}
        </p>

      </div>

      <ArrowRightIcon />

    </button>
  );
}


function Feature({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3">

      <div className="text-white/70">
        {icon}
      </div>

      <span className="text-xs font-medium text-white/70">
        {text}
      </span>

    </div>
  );
}


/* =========================================================
   ICONS
========================================================= */

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l8 4v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V7l8-4z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}


function DocumentIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h6" />
    </svg>
  );
}


function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 00-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}


function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}


function UploadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 16V4" />
      <path d="M7 9l5-5 5 5" />
      <path d="M5 20h14" />
    </svg>
  );
}


function SparkleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3z" />
      <path d="M19 16l.6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6L19 16z" />
    </svg>
  );
}


function ScanIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 012-2h2" />
      <path d="M17 3h2a2 2 0 012 2v2" />
      <path d="M21 17v2a2 2 0 01-2 2h-2" />
      <path d="M7 21H5a2 2 0 01-2-2v-2" />
      <path d="M7 12h10" />
    </svg>
  );
}


function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}


function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 018 0v3" />
    </svg>
  );
}