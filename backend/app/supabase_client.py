from supabase import create_client, Client

from app.config import (
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
)


def create_admin_client() -> Client:
    """
    Creates a Supabase client using the backend server-side secret key.

    IMPORTANT:
    This key must NEVER be exposed to the frontend.
    """

    if not SUPABASE_URL:
        raise RuntimeError("SUPABASE_URL is missing from backend/.env")

    if not SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError(
            "SUPABASE_SERVICE_ROLE_KEY is missing from backend/.env"
        )

    return create_client(
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY,
    )