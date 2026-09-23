import os

from dotenv import load_dotenv


# Load variables from backend/.env
load_dotenv()


# ---------------------------------------------------------
# SUPABASE
# ---------------------------------------------------------

SUPABASE_URL = os.getenv(
    "SUPABASE_URL"
)

SUPABASE_SERVICE_ROLE_KEY = os.getenv(
    "SUPABASE_SERVICE_ROLE_KEY"
)


# ---------------------------------------------------------
# GROQ
# ---------------------------------------------------------

GROQ_API_KEY = os.getenv(
    "GROQ_API_KEY"
)


# ---------------------------------------------------------
# AZURE DOCUMENT INTELLIGENCE
# ---------------------------------------------------------

AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT = os.getenv(
    "AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT"
)

AZURE_DOCUMENT_INTELLIGENCE_KEY = os.getenv(
    "AZURE_DOCUMENT_INTELLIGENCE_KEY"
)


# ---------------------------------------------------------
# VALIDATION
# ---------------------------------------------------------

if not SUPABASE_URL:
    raise RuntimeError(
        "SUPABASE_URL is missing from backend/.env"
    )


if not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError(
        "SUPABASE_SERVICE_ROLE_KEY is missing from backend/.env"
    )


if not GROQ_API_KEY:
    raise RuntimeError(
        "GROQ_API_KEY is missing from backend/.env"
    )

RESEND_API_KEY = os.getenv("RESEND_API_KEY")

if not RESEND_API_KEY:
    raise RuntimeError("RESEND_API_KEY is missing from backend/.env")