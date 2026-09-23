"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type Notification = {
  id: string;
  type: string;
  reference_id: string | null;
  scheduled_at: string;
  status: string;
  sent_at: string | null;
};

export default function RemindersPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [message, setMessage] = useState("");

  // ============================================
  // LOAD REMINDERS
  // ============================================

  useEffect(() => {
    async function loadReminders() {
      try {
        setLoading(true);

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          setMessage("Please log in first.");
          return;
        }

        const response = await fetch(`${API_URL}/notifications`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Unable to load reminders."
          );
        }

        setNotifications(data.notifications || []);
      } catch (error) {
        console.error("Load reminders error:", error);

        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to load reminders."
        );
      } finally {
        setLoading(false);
      }
    }

    loadReminders();
  }, []);

  // ============================================
  // PROCESS PENDING NOTIFICATIONS
  // ============================================

  async function handleProcessPending() {
    if (processing || sendingTest) {
      return;
    }

    try {
      setProcessing(true);
      setMessage("Processing notifications...");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setMessage("Please log in first.");
        return;
      }

      const response = await fetch(
        `${API_URL}/notifications/process-pending`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to process notifications."
        );
      }

      if (data.processed === 0) {
        setMessage(
          "✅ No pending notifications are due right now."
        );
      } else {
        setMessage(
          `✅ ${data.processed} notification(s) processed successfully.`
        );
      }

      // Update notifications that were sent
      if (Array.isArray(data.results)) {
        const sentIds = data.results
          .filter(
            (item: { status?: string }) =>
              item.status === "sent"
          )
          .map(
            (item: { notification_id?: string }) =>
              item.notification_id
          )
          .filter(Boolean);

        if (sentIds.length > 0) {
          setNotifications((current) =>
            current.map((notification) =>
              sentIds.includes(notification.id)
                ? {
                    ...notification,
                    status: "sent",
                    sent_at: new Date().toISOString(),
                  }
                : notification
            )
          );
        }
      }
    } catch (error) {
      console.error(
        "Process notification error:",
        error
      );

      setMessage(
        error instanceof Error
          ? `❌ ${error.message}`
          : "❌ Unable to process notifications."
      );
    } finally {
      setProcessing(false);
    }
  }

  // ============================================
  // TEST EMAIL
  // ============================================

  async function handleTestEmail() {
    if (sendingTest || processing) {
      return;
    }

    try {
      setSendingTest(true);
      setMessage("Sending test email...");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setMessage("Please log in first.");
        return;
      }

      const response = await fetch(
        `${API_URL}/notifications/test-email`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to send test email."
        );
      }

      setMessage(
        `✅ Test email sent successfully to ${data.email}.`
      );
    } catch (error) {
      console.error("Test email error:", error);

      setMessage(
        error instanceof Error
          ? `❌ ${error.message}`
          : "❌ Unable to send test email."
      );
    } finally {
      setSendingTest(false);
    }
  }

  // ============================================
  // HELPERS
  // ============================================

  function getTitle(type: string) {
    switch (type) {
      case "warranty_30_days":
        return "Warranty expires in 30 days";

      case "warranty_7_days":
        return "Warranty expires in 7 days";

      case "warranty_1_days":
        return "Warranty expires tomorrow";

      default:
        return "Warranty Reminder";
    }
  }

  function getIcon(type: string) {
    switch (type) {
      case "warranty_30_days":
        return "📅";

      case "warranty_7_days":
        return "⚠️";

      case "warranty_1_days":
        return "🚨";

      default:
        return "🔔";
    }
  }

function formatDate(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
  // ============================================
  // PAGE UI
  // ============================================

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Reminders
          </h1>

          <p className="mt-2 text-gray-600">
            Stay informed before your warranties expire.
          </p>
        </div>

        {/* MESSAGE */}
        {message && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
            {message}
          </div>
        )}

        {/* EMAIL NOTIFICATIONS */}
        <section className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            Email Notifications
          </h2>

          <p className="mt-2 text-gray-600">
            Test the PurchaseGuard email system and process
            pending warranty notifications.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">

            {/* TEST EMAIL */}
            <button
              type="button"
              onClick={handleTestEmail}
              disabled={sendingTest || processing}
              className="rounded-lg bg-gray-900 px-5 py-3 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sendingTest
                ? "Sending..."
                : "📧 Send Test Email"}
            </button>

            {/* PROCESS PENDING */}
            <button
              type="button"
              onClick={handleProcessPending}
              disabled={processing || sendingTest}
              className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processing
                ? "Processing..."
                : "⚙️ Process Pending Notifications"}
            </button>

          </div>
        </section>

        {/* REMINDERS */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Your Reminders
          </h2>

          {loading ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500 shadow-sm">
              Loading reminders...
            </div>
          ) : notifications.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <div className="text-4xl">
                🔔
              </div>

              <h3 className="mt-3 text-lg font-semibold text-gray-900">
                No reminders yet
              </h3>

              <p className="mt-2 text-gray-500">
                Your warranty reminders will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">

                    <div className="flex items-start gap-4">

                      <div className="text-2xl">
                        {getIcon(notification.type)}
                      </div>

                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {getTitle(notification.type)}
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                          Reminder date:{" "}
                          {formatDate(
                            notification.scheduled_at
                          )}
                        </p>
                      </div>

                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        notification.status === "sent"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {notification.status === "sent"
                        ? "Sent"
                        : "Pending"}
                    </span>

                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}