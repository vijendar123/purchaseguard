"use client";

import {
  ChangeEvent,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ExtractedData = {
  document_type?: string | null;

  product?: {
    product_name?: string | null;
    brand?: string | null;
    model?: string | null;
    serial_number?: string | null;
    purchase_date?: string | null;
  };

  warranty?: {
    warranty_start?: string | null;
    warranty_end?: string | null;
    duration_months?: number | null;
    source?: string | null;
  };

  confidence?: {
    product?: number;
    purchase_date?: number;
    warranty?: number;
  };

  needs_user_confirmation?: boolean;

  missing_information?: string[];
};

export default function DocumentsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  const [documentCount, setDocumentCount] = useState(0);
  const [warrantyCount, setWarrantyCount] = useState(0);
  const [reminderCount, setReminderCount] = useState(0);

  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [result, setResult] =
    useState<ExtractedData | null>(null);

  const [resultFilename, setResultFilename] =
    useState("");

  const [resultDocumentId, setResultDocumentId] =
    useState("");

  useEffect(() => {
    loadPage();
  }, []);

  // =========================================================
  // LOAD PAGE
  // =========================================================

  async function loadPage() {
    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setEmail(user.email ?? "");

      const [
        documents,
        warranties,
        reminders,
      ] = await Promise.all([
        supabase
          .from("documents")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("user_id", user.id),

        supabase
          .from("products")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("user_id", user.id),

        supabase
          .from("notifications")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("user_id", user.id)
          .eq("status", "pending"),
      ]);

      setDocumentCount(documents.count ?? 0);
      setWarrantyCount(warranties.count ?? 0);
      setReminderCount(reminders.count ?? 0);
    } catch (err) {
      console.error(
        "Dashboard loading error:",
        err
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // LOGOUT
  // =========================================================

  async function handleLogout() {
    const supabase = createClient();

    await supabase.auth.signOut();

    router.replace("/login");
    router.refresh();
  }

  // =========================================================
  // FILE PICKER
  // =========================================================

  function openFilePicker() {
    setError("");
    setResult(null);
    setResultDocumentId("");

    fileInputRef.current?.click();
  }

  // =========================================================
  // FILE SELECTED
  // =========================================================

  async function handleFileSelected(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Unsupported file type. Please upload JPG, PNG, WEBP or PDF."
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError(
        "File size must not exceed 10 MB."
      );
      return;
    }

    await processDocument(file);
  }

  // =========================================================
  // PROCESS DOCUMENT
  // =========================================================

  async function processDocument(file: File) {
    setProcessing(true);
    setError("");
    setResult(null);
    setResultDocumentId("");
    setResultFilename(file.name);

    try {
      // -----------------------------------------------------
      // STEP 1 — FORM DATA
      // -----------------------------------------------------

      const formData = new FormData();

      formData.append(
        "file",
        file
      );

      // -----------------------------------------------------
      // STEP 2 — GET SUPABASE SESSION
      // -----------------------------------------------------

      setProcessingStep(
        "Authenticating your account..."
      );

      const supabase = createClient();

      const {
        data: { session },
        error: sessionError,
      } =
        await supabase.auth.getSession();

      if (sessionError) {
        throw new Error(
          "Unable to verify your login session."
        );
      }

      if (!session?.access_token) {
        throw new Error(
          "Your login session has expired. Please log in again."
        );
      }

      // -----------------------------------------------------
      // STEP 3 — FASTAPI
      // -----------------------------------------------------

      setProcessingStep(
        "Uploading document securely..."
      );

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "http://127.0.0.1:8000";

      const response =
        await fetch(
          `${apiUrl}/documents/process`,
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${session.access_token}`,
            },

            body: formData,
          }
        );

      // -----------------------------------------------------
      // STEP 4 — API ERROR
      // -----------------------------------------------------

      if (!response.ok) {
        let message =
          "Document processing failed.";

        try {
          const data =
            await response.json();

          if (data?.detail) {
            message =
              data.detail;
          }
        } catch {
          // Keep default error.
        }

        throw new Error(message);
      }

      // -----------------------------------------------------
      // STEP 5 — AZURE OCR
      // -----------------------------------------------------

      setProcessingStep(
        "Azure AI is reading your document..."
      );

      const data =
        await response.json();

      // -----------------------------------------------------
      // STEP 6 — GROQ AI
      // -----------------------------------------------------

      setProcessingStep(
        "Groq AI is extracting purchase and warranty information..."
      );

      await new Promise(
        (resolve) =>
          setTimeout(resolve, 500)
      );

      // -----------------------------------------------------
      // STEP 7 — VALIDATE RESULT
      // -----------------------------------------------------

      if (!data?.extracted_data) {
        throw new Error(
          "The AI did not return structured purchase information."
        );
      }

      // -----------------------------------------------------
      // STEP 8 — SAVE RESULT IN STATE
      // -----------------------------------------------------

      setResult(
        data.extracted_data
      );

      setResultDocumentId(
        data.document_id ?? ""
      );

    } catch (err) {
      console.error(
        "Document processing error:",
        err
      );

      if (
        err instanceof TypeError &&
        err.message.includes("fetch")
      ) {
        setError(
          "Cannot connect to PurchaseGuard API. Make sure FastAPI is running on port 8000."
        );
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Document processing failed."
        );
      }
    } finally {
      setProcessing(false);
      setProcessingStep("");
    }
  }

  // =========================================================
  // SAVE DOCUMENT + PRODUCT + WARRANTY
  // =========================================================

  async function saveDocument() {
    if (!result) {
      setError(
        "There is no AI result to save."
      );
      return;
    }

    if (!resultDocumentId) {
      setError(
        "Document ID is missing. Please upload the document again."
      );
      return;
    }

    // -------------------------------------------------------
    // Don't save uncertain warranty information
    // -------------------------------------------------------

    if (
      result.needs_user_confirmation ||
      !result.warranty?.warranty_start ||
      !result.warranty?.warranty_end
    ) {
      setError(
        "Warranty information needs confirmation before it can be saved."
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const supabase = createClient();

      // -----------------------------------------------------
      // GET SESSION
      // -----------------------------------------------------

      const {
        data: { session },
        error: sessionError,
      } =
        await supabase.auth.getSession();

      if (sessionError) {
        throw new Error(
          "Unable to verify your login session."
        );
      }

      if (!session?.access_token) {
        throw new Error(
          "Your login session has expired. Please log in again."
        );
      }

      // -----------------------------------------------------
      // API URL
      // -----------------------------------------------------

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "http://127.0.0.1:8000";

      // -----------------------------------------------------
      // SEND TO BACKEND
      // -----------------------------------------------------

      const response =
        await fetch(
          `${apiUrl}/documents/save`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${session.access_token}`,
            },

            body: JSON.stringify({
              document_id:
                resultDocumentId,

              extracted_data:
                result,
            }),
          }
        );

      let data: any = null;

      try {
        data =
          await response.json();
      } catch {
        // Ignore JSON parsing failure.
      }

      // -----------------------------------------------------
      // HANDLE ERROR
      // -----------------------------------------------------

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Unable to save the warranty."
        );
      }

      // -----------------------------------------------------
      // SUCCESS
      // -----------------------------------------------------

      setResult(null);
      setResultFilename("");
      setResultDocumentId("");

      await loadPage();

      router.push(
        "/warranties"
      );

      router.refresh();

    } catch (err) {
      console.error(
        "Save warranty error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save the warranty."
      );
    } finally {
      setSaving(false);
    }
  }

  // =========================================================
  // CLOSE RESULT
  // =========================================================

  function closeResult() {
    if (saving) {
      return;
    }

    setResult(null);
    setResultFilename("");
    setResultDocumentId("");
    setError("");
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa]">
        <div className="text-center">

          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-black" />

          <p className="mt-4 text-sm font-medium text-gray-500">
            Loading PurchaseGuard...
          </p>

        </div>
      </main>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-gray-900">

      {/* =================================================
          NAVBAR
      ================================================= */}

      <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-xl">

        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">

          <button
            type="button"
            onClick={() =>
              router.push("/dashboard")
            }
            className="flex items-center gap-3"
          >

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
              <ShieldIcon />
            </div>

            <div className="text-left">

              <p className="text-[16px] font-bold">
                PurchaseGuard
              </p>

              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-gray-400">
                Purchase protection
              </p>

            </div>

          </button>

          <div className="flex items-center gap-3">

            <div className="hidden items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-2 sm:flex">

              <span className="h-2 w-2 rounded-full bg-emerald-500" />

              <span className="max-w-[220px] truncate text-xs font-medium text-gray-600">
                {email}
              </span>

            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
            >
              Sign out
            </button>

          </div>

        </div>

      </nav>

      {/* =================================================
          HIDDEN FILE INPUT
      ================================================= */}

      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.pdf"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">

        {/* HEADER */}

        <div className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">

          <div>

            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 shadow-sm">

              <SparkleIcon />

              <span className="text-xs font-semibold text-gray-600">
                AI document intelligence
              </span>

            </div>

            <h1 className="text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
              Your documents
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-gray-500">
              Upload invoices, receipts and warranty
              cards. PurchaseGuard extracts important
              information automatically.
            </p>

          </div>

          <button
            type="button"
            onClick={openFilePicker}
            className="inline-flex items-center justify-center gap-3 rounded-xl bg-black px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-gray-800"
          >
            <UploadIcon />
            Upload document
          </button>

        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

            <div className="flex gap-3">

              <ErrorIcon />

              <div>

                <p className="font-bold">
                  Action required
                </p>

                <p className="mt-1">
                  {error}
                </p>

              </div>

            </div>

          </div>
        )}

        {/* =================================================
            STATS
        ================================================= */}

        <div className="mb-8 grid gap-4 sm:grid-cols-3">

          <StatCard
            title="Documents"
            value={documentCount}
            description="Uploaded documents"
            icon={<DocumentIcon />}
          />

          <StatCard
            title="Warranties"
            value={warrantyCount}
            description="Products protected"
            icon={<ShieldIcon />}
          />

          <StatCard
            title="Reminders"
            value={reminderCount}
            description="Pending reminders"
            icon={<BellIcon />}
          />

        </div>

        {/* =================================================
            UPLOAD AREA
        ================================================= */}

        <button
          type="button"
          onClick={openFilePicker}
          className="group w-full rounded-3xl border-2 border-dashed border-gray-300 bg-white p-10 text-center transition hover:border-gray-500 hover:bg-gray-50"
        >

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 transition group-hover:bg-black group-hover:text-white">
            <UploadIcon />
          </div>

          <h2 className="mt-5 text-2xl font-bold">
            Upload a purchase document
          </h2>

          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-500">
            Upload an invoice, receipt or warranty card
            and let PurchaseGuard analyze it.
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-2">

            <FileBadge text="PDF" />
            <FileBadge text="JPG" />
            <FileBadge text="PNG" />
            <FileBadge text="WEBP" />
            <FileBadge text="MAX 10MB" />

          </div>

        </button>

        {/* =================================================
            AI PIPELINE
        ================================================= */}

        <div className="mt-8 overflow-hidden rounded-3xl bg-black p-7 text-white">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
              <SparkleIcon />
            </div>

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">
                PurchaseGuard AI
              </p>

              <h2 className="mt-1 text-xl font-bold">
                Automatic document analysis
              </h2>

            </div>

          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">

            <SmallFeature
              icon={<ScanIcon />}
              text="Azure AI OCR"
            />

            <SmallFeature
              icon={<SparkleIcon />}
              text="Groq AI"
            />

            <SmallFeature
              icon={<BellIcon />}
              text="Smart reminders"
            />

          </div>

        </div>

        {/* =================================================
            NAVIGATION
        ================================================= */}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">

          <NavigationCard
            icon={<ShieldIcon />}
            title="Warranties"
            description="Track your warranty coverage."
            onClick={() =>
              router.push("/warranties")
            }
          />

          <NavigationCard
            icon={<BellIcon />}
            title="Reminders"
            description="View your upcoming alerts."
            onClick={() =>
              router.push("/reminders")
            }
          />

          <NavigationCard
            icon={<LockIcon />}
            title="Secure storage"
            description="Your documents are protected."
            onClick={() => {}}
          />

        </div>

      </section>

      {/* =================================================
          PROCESSING MODAL
      ================================================= */}

      {processing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-5 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-black text-white">
              <SparkleIcon />
            </div>

            <h2 className="mt-6 text-center text-2xl font-bold">
              Analyzing document
            </h2>

            <p className="mt-2 text-center text-sm text-gray-500">
              PurchaseGuard is securely processing
              your document.
            </p>

            <div className="mt-8 space-y-4">

              <ProcessingStep
                title="Document uploaded"
                active
              />

              <ProcessingStep
                title="Azure AI OCR"
                active
              />

              <ProcessingStep
                title="Groq AI extraction"
                active
              />

            </div>

            <div className="mt-7 rounded-xl bg-gray-50 p-4 text-center text-xs font-medium text-gray-500">
              {processingStep}
            </div>

          </div>

        </div>
      )}

      {/* =================================================
          RESULT MODAL
      ================================================= */}

      {result && !processing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/50 p-5 backdrop-blur-sm">

          <div className="my-8 w-full max-w-2xl rounded-3xl bg-white p-7 shadow-2xl">

            {/* MODAL HEADER */}

            <div className="flex items-start justify-between">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100">
                  <SparkleIcon />
                </div>

                <div>

                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    AI analysis complete
                  </p>

                  <h2 className="text-xl font-bold">
                    Purchase information
                  </h2>

                </div>

              </div>

              <button
                type="button"
                onClick={closeResult}
                disabled={saving}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CloseIcon />
              </button>

            </div>

            {/* FILE */}

            <div className="mt-6 rounded-2xl bg-gray-50 p-4">

              <p className="text-xs font-medium text-gray-400">
                FILE
              </p>

              <p className="mt-1 truncate text-sm font-semibold">
                {resultFilename}
              </p>

            </div>

            {/* PRODUCT */}

            <div className="mt-5 rounded-2xl border border-gray-200 p-5">

              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Product
              </p>

              <h3 className="mt-2 text-xl font-bold">
                {result.product?.product_name ||
                  "Not detected"}
              </h3>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">

                <InfoItem
                  label="Brand"
                  value={
                    result.product?.brand
                  }
                />

                <InfoItem
                  label="Model"
                  value={
                    result.product?.model
                  }
                />

                <InfoItem
                  label="Serial number"
                  value={
                    result.product?.serial_number
                  }
                />

                <InfoItem
                  label="Purchase date"
                  value={
                    result.product?.purchase_date
                  }
                />

              </div>

            </div>

            {/* WARRANTY */}

            <div className="mt-5 rounded-2xl border border-gray-200 p-5">

              <div className="flex items-center justify-between">

                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Warranty
                </p>

                {!result.needs_user_confirmation &&
                  result.warranty?.warranty_end && (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                      Detected
                    </span>
                  )}

              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">

                <InfoItem
                  label="Warranty start"
                  value={
                    result.warranty?.warranty_start
                  }
                />

                <InfoItem
                  label="Warranty end"
                  value={
                    result.warranty?.warranty_end
                  }
                />

                <InfoItem
                  label="Duration"
                  value={
                    result.warranty?.duration_months
                      ? `${result.warranty.duration_months} months`
                      : null
                  }
                />

                <InfoItem
                  label="Source"
                  value={
                    result.warranty?.source
                  }
                />

              </div>

            </div>

            {/* CONFIRMATION */}

            {result.needs_user_confirmation && (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">

                <p className="font-bold text-amber-900">
                  Confirmation required
                </p>

                <p className="mt-1 text-sm text-amber-800">
                  Some information could not be
                  confidently extracted.
                </p>

                {result.missing_information &&
                  result.missing_information.length >
                    0 && (
                    <ul className="mt-3 list-disc pl-5 text-sm text-amber-800">

                      {result.missing_information.map(
                        (item, index) => (
                          <li key={index}>
                            {item}
                          </li>
                        )
                      )}

                    </ul>
                  )}

              </div>
            )}

            {/* =================================================
                ACTION BUTTONS
            ================================================= */}

            <div className="mt-6 flex gap-3">

              <button
                type="button"
                onClick={closeResult}
                disabled={saving}
                className="flex-1 rounded-xl border border-gray-200 px-5 py-3 text-sm font-bold hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Close
              </button>

              <button
                type="button"
                onClick={saveDocument}
                disabled={
                  saving ||
                  !!result.needs_user_confirmation ||
                  !result.warranty?.warranty_start ||
                  !result.warranty?.warranty_end
                }
                className="flex-1 rounded-xl bg-black px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : "Confirm & Save Warranty"}
              </button>

            </div>

            {/* SAVE INFORMATION */}

            {!result.needs_user_confirmation &&
              result.warranty?.warranty_start &&
              result.warranty?.warranty_end && (
                <p className="mt-3 text-center text-xs text-gray-400">
                  Review the extracted information before saving.
                </p>
              )}

          </div>

        </div>
      )}

    </main>
  );
}


/* =========================================================
   SMALL FEATURE
========================================================= */

function SmallFeature({
  icon,
  text,
}: {
  icon: ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">

      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
        {icon}
      </div>

      <span className="text-xs font-semibold text-white/70">
        {text}
      </span>

    </div>
  );
}


/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-xs font-semibold text-gray-400">
            {title}
          </p>

          <p className="mt-3 text-3xl font-bold">
            {value}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            {description}
          </p>

        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
          {icon}
        </div>

      </div>

    </div>
  );
}


/* =========================================================
   FILE BADGE
========================================================= */

function FileBadge({
  text,
}: {
  text: string;
}) {
  return (
    <span className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-[10px] font-bold text-gray-500">
      {text}
    </span>
  );
}


/* =========================================================
   NAVIGATION CARD
========================================================= */

function NavigationCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >

      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 group-hover:bg-black group-hover:text-white">
        {icon}
      </div>

      <h3 className="mt-4 font-bold">
        {title}
      </h3>

      <p className="mt-1 text-sm text-gray-500">
        {description}
      </p>

      <p className="mt-4 text-sm font-bold">
        Open →
      </p>

    </button>
  );
}


/* =========================================================
   PROCESSING STEP
========================================================= */

function ProcessingStep({
  title,
  active,
}: {
  title: string;
  active: boolean;
}) {
  return (
    <div className="flex items-center gap-3">

      <div
        className={`flex h-7 w-7 items-center justify-center rounded-full ${
          active
            ? "bg-black text-white"
            : "bg-gray-100 text-gray-400"
        }`}
      >
        {active ? "✓" : ""}
      </div>

      <p className="text-sm font-medium text-gray-700">
        {title}
      </p>

    </div>
  );
}


/* =========================================================
   INFO ITEM
========================================================= */

function InfoItem({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div>

      <p className="text-xs text-gray-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-gray-900">
        {value || "Not detected"}
      </p>

    </div>
  );
}


/* =========================================================
   ICONS
========================================================= */

function ShieldIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l8 4v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V7l8-4z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}


function DocumentIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h6" />
    </svg>
  );
}


function BellIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8a6 6 0 00-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}


function UploadIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 16V4" />
      <path d="M7 9l5-5 5 5" />
      <path d="M5 20h14" />
    </svg>
  );
}


function SparkleIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3z" />
      <path d="M19 16l.6 2.4L22 19l-2.4.6L19 19l2.4-.6L19 16z" />
    </svg>
  );
}


function ScanIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7V5a2 2 0 012-2h2" />
      <path d="M17 3h2a2 2 0 012 2v2" />
      <path d="M21 17v2a2 2 0 01-2 2h-2" />
      <path d="M7 21H5a2 2 0 01-2-2v-2" />
      <path d="M7 12h10" />
    </svg>
  );
}


function LockIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect
        x="5"
        y="10"
        width="14"
        height="11"
        rx="2"
      />
      <path d="M8 10V7a4 4 0 018 0v3" />
    </svg>
  );
}


function ErrorIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}


function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}