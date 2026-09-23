import requests

from app.config import (
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
)


def upload_document(
    storage_path: str,
    file_bytes: bytes,
    content_type: str,
    access_token: str,
) -> dict:

    url = (
        f"{SUPABASE_URL}"
        f"/storage/v1/object/documents/"
        f"{storage_path}"
    )

    headers = {
        "Authorization": f"Bearer {access_token}",
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type": content_type,
        "x-upsert": "false",
    }

    response = requests.post(
        url,
        headers=headers,
        data=file_bytes,
        timeout=60,
    )

    if response.status_code >= 400:
        raise RuntimeError(
            "Supabase Storage upload failed: "
            f"{response.status_code} "
            f"{response.text}"
        )

    return response.json()


def delete_document(
    storage_path: str,
    access_token: str,
) -> None:

    url = (
        f"{SUPABASE_URL}"
        f"/storage/v1/object/documents/"
        f"{storage_path}"
    )

    headers = {
        "Authorization": f"Bearer {access_token}",
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
    }

    response = requests.delete(
        url,
        headers=headers,
        timeout=60,
    )

    if response.status_code >= 400:
        print(
            "Storage cleanup failed:",
            response.status_code,
            response.text,
        )