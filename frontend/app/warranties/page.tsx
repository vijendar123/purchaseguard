"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Warranty = {
  id: string;
  warranty_start: string | null;
  warranty_end: string | null;
  duration_months: number | null;
  status: string;
  product: {
    product_name: string;
    brand: string | null;
    model: string | null;
    serial_number: string | null;
  } | null;
};

export default function WarrantiesPage() {
  const router = useRouter();
  const supabase = createClient();

  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadWarranties();
  }, []);

  async function loadWarranties() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    // ---------------------------------------------------------
    // Generate warranty reminders
    // ---------------------------------------------------------

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.access_token) {
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/notifications/generate`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );
      }
    } catch (error) {
      console.error("Reminder generation failed:", error);
      // Do not stop the warranty page if reminders fail.
    }

    // ---------------------------------------------------------
    // Load warranties
    // ---------------------------------------------------------

    const { data, error } = await supabase
      .from("warranties")
      .select(`
        id,
        warranty_start,
        warranty_end,
        duration_months,
        status,
        products (
          product_name,
          brand,
          model,
          serial_number
        )
      `)
      .eq("products.user_id", user.id)
      .order("warranty_end", { ascending: true });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const formattedData: Warranty[] = (data ?? []).map((item: any) => ({
      id: item.id,
      warranty_start: item.warranty_start,
      warranty_end: item.warranty_end,
      duration_months: item.duration_months,
      status: item.status,
      product: Array.isArray(item.products)
        ? item.products[0] ?? null
        : item.products ?? null,
    }));

    setWarranties(formattedData);
    setLoading(false);
  }

  function getWarrantyStatus(endDate: string | null) {
    if (!endDate) {
      return {
        text: "Unknown",
        className: "bg-gray-100 text-gray-700",
      };
    }

    const today = new Date();
    const expiry = new Date(endDate);

    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);

    const difference =
      expiry.getTime() - today.getTime();

    const daysRemaining = Math.ceil(
      difference / (1000 * 60 * 60 * 24)
    );

    if (daysRemaining < 0) {
      return {
        text: "Expired",
        className: "bg-red-100 text-red-700",
      };
    }

    if (daysRemaining <= 30) {
      return {
        text: `${daysRemaining} days left`,
        className: "bg-yellow-100 text-yellow-700",
      };
    }

    return {
      text: "Active",
      className: "bg-green-100 text-green-700",
    };
  }

  function formatDate(date: string | null) {
    if (!date) return "Not available";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="flex items-center justify-between bg-white px-8 py-4 shadow">
        <h1 className="text-2xl font-bold text-blue-600">
          🛡️ PurchaseGuard
        </h1>

        <button
          onClick={() => router.push("/dashboard")}
          className="rounded-lg bg-gray-200 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-300"
        >
          Dashboard
        </button>
      </nav>

      {/* Main Content */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              Your Warranties
            </h2>

            <p className="mt-2 text-gray-600">
              Track your products and warranty expiration dates.
            </p>
          </div>

          <button
            onClick={() => router.push("/documents")}
            className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            + Add Document
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">
            {message}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="mt-8 rounded-2xl bg-white p-10 text-center shadow">
            <p className="text-gray-600">
              Loading warranties...
            </p>
          </div>
        ) : warranties.length === 0 ? (
          /* Empty State */
          <div className="mt-8 rounded-2xl bg-white p-10 text-center shadow">
            <div className="text-5xl">🛡️</div>

            <h3 className="mt-4 text-xl font-bold text-gray-900">
              No warranties found
            </h3>

            <p className="mt-2 text-gray-600">
              Upload an invoice or warranty card to start
              tracking your warranty.
            </p>

            <button
              onClick={() => router.push("/documents")}
              className="mt-6 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Upload Document
            </button>
          </div>
        ) : (
          /* Warranty Cards */
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {warranties.map((warranty) => {
              const status = getWarrantyStatus(
                warranty.warranty_end
              );

              return (
                <div
                  key={warranty.id}
                  className="rounded-2xl bg-white p-6 shadow transition hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-3xl">
                        🛡️
                      </div>

                      <h3 className="mt-3 text-xl font-bold text-gray-900">
                        {warranty.product?.product_name ??
                          "Unknown Product"}
                      </h3>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${status.className}`}
                    >
                      {status.text}
                    </span>
                  </div>

                  <div className="mt-5 space-y-3 text-sm">
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-gray-500">
                        Brand
                      </span>

                      <span className="font-semibold text-gray-900">
                        {warranty.product?.brand ??
                          "Not available"}
                      </span>
                    </div>

                    <div className="flex justify-between border-b pb-2">
                      <span className="text-gray-500">
                        Model
                      </span>

                      <span className="font-semibold text-gray-900">
                        {warranty.product?.model ??
                          "Not available"}
                      </span>
                    </div>

                    <div className="flex justify-between border-b pb-2">
                      <span className="text-gray-500">
                        Serial Number
                      </span>

                      <span className="max-w-[220px] break-all text-right font-semibold text-gray-900">
                        {warranty.product?.serial_number ??
                          "Not available"}
                      </span>
                    </div>

                    <div className="flex justify-between border-b pb-2">
                      <span className="text-gray-500">
                        Warranty Start
                      </span>

                      <span className="font-semibold text-gray-900">
                        {formatDate(
                          warranty.warranty_start
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between border-b pb-2">
                      <span className="text-gray-500">
                        Warranty End
                      </span>

                      <span className="font-semibold text-gray-900">
                        {formatDate(
                          warranty.warranty_end
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        Duration
                      </span>

                      <span className="font-semibold text-gray-900">
                        {warranty.duration_months
                          ? `${warranty.duration_months} months`
                          : "Not available"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}