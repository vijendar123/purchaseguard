import os
import tempfile
import uuid
from datetime import date, timedelta
from pathlib import Path
from typing import Any

from fastapi import APIRouter, File, Header, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app.supabase_client import create_admin_client
from app.services.ocr_service import extract_text_from_file
from app.services.ai_extraction import extract_purchase_information
from app.services.storage_service import (
    upload_document,
    delete_document,
)


router = APIRouter(
    prefix="/documents",
    tags=["Documents"],
)


# =========================================================
# SUPABASE ADMIN CLIENT
# =========================================================

admin_client = create_admin_client()


# =========================================================
# AUTHENTICATION
# =========================================================

async def get_current_user(
    authorization: str | None = Header(default=None),
):
    """
    Verify the Supabase access token sent by the frontend.
    """

    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization header is required.",
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header.",
        )

    access_token = authorization.replace(
        "Bearer ",
        "",
        1,
    ).strip()

    if not access_token:
        raise HTTPException(
            status_code=401,
            detail="Access token is missing.",
        )

    try:
        response = admin_client.auth.get_user(
            access_token
        )

        if not response or not response.user:
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired access token.",
            )

        return response.user

    except HTTPException:
        raise

    except Exception as exc:
        print(
            "Authentication error:",
            repr(exc),
        )

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired access token.",
        )


# =========================================================
# FILE SETTINGS
# =========================================================

ALLOWED_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".pdf",
}

MAX_FILE_SIZE = 10 * 1024 * 1024


# =========================================================
# DOCUMENT TYPE
# =========================================================

def normalize_document_type(
    extracted_data: dict[str, Any],
) -> str:

    document_type = extracted_data.get(
        "document_type"
    )

    if not document_type:
        return "other"

    document_type = str(
        document_type
    ).strip().lower()

    allowed_types = {
        "invoice",
        "receipt",
        "warranty_card",
        "purchase_document",
        "other",
    }

    if document_type in allowed_types:
        return document_type

    if "invoice" in document_type:
        return "invoice"

    if "receipt" in document_type:
        return "receipt"

    if "warranty" in document_type:
        return "warranty_card"

    if "purchase" in document_type:
        return "purchase_document"

    return "other"


# =========================================================
# PROCESS DOCUMENT
# =========================================================

@router.post("/process")
async def process_document(
    file: UploadFile = File(...),
    authorization: str | None = Header(default=None),
):

    user = await get_current_user(
        authorization
    )

    user_id = str(user.id)

    access_token = authorization.replace(
        "Bearer ",
        "",
        1,
    ).strip()

    print("----------------------------------------")
    print("PurchaseGuard document processing")
    print("User:", user_id)
    print("Filename:", file.filename)
    print("----------------------------------------")

    temporary_path = None
    storage_path = None
    document_id = None

    try:

        # =================================================
        # 1. VALIDATE FILE
        # =================================================

        if not file.filename:
            raise HTTPException(
                status_code=400,
                detail="File name is missing.",
            )

        original_filename = file.filename

        extension = Path(
            original_filename
        ).suffix.lower()

        if extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Unsupported file type. "
                    "Allowed: JPG, JPEG, PNG, WEBP, PDF."
                ),
            )

        file_bytes = await file.read()

        if not file_bytes:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is empty.",
            )

        if len(file_bytes) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail="File size must not exceed 10 MB.",
            )

        print("File validation completed.")

        # =================================================
        # 2. CREATE TEMPORARY FILE
        # =================================================

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=extension,
        ) as temp_file:

            temp_file.write(file_bytes)

            temporary_path = temp_file.name

        print("Temporary file created.")

        # =================================================
        # 3. AZURE OCR
        # =================================================

        print("Starting Azure OCR...")

        ocr_text = extract_text_from_file(
            temporary_path
        )

        if not ocr_text:
            raise HTTPException(
                status_code=422,
                detail=(
                    "No readable text was found "
                    "in the document."
                ),
            )

        print(
            "Azure OCR completed successfully."
        )

        # =================================================
        # 4. GROQ AI EXTRACTION
        # =================================================

        print("Starting Groq AI extraction...")

        extracted_data = (
            extract_purchase_information(
                ocr_text
            )
        )

        if not extracted_data:
            raise HTTPException(
                status_code=422,
                detail=(
                    "AI could not extract information "
                    "from the document."
                ),
            )

        print(
            "Groq AI extraction completed successfully."
        )

        # =================================================
        # 5. DOCUMENT TYPE
        # =================================================

        document_type = normalize_document_type(
            extracted_data
        )

        print(
            "Detected document type:",
            document_type,
        )

        # =================================================
        # 6. STORAGE PATH
        # =================================================

        unique_filename = (
            f"{uuid.uuid4()}{extension}"
        )

        storage_path = (
            f"{user_id}/{unique_filename}"
        )

        content_type = (
            file.content_type
            or "application/octet-stream"
        )

        print(
            "Uploading file to Storage:",
            storage_path,
        )

        # =================================================
        # 7. UPLOAD TO PRIVATE SUPABASE STORAGE
        # =================================================

        upload_document(
            storage_path=storage_path,
            file_bytes=file_bytes,
            content_type=content_type,
            access_token=access_token,
        )

        print(
            "Storage upload completed."
        )

        # =================================================
        # 8. CREATE DOCUMENT DATABASE RECORD
        # =================================================

        print(
            "Creating documents database record..."
        )

        document_insert = (
            admin_client
            .table("documents")
            .insert(
                {
                    "user_id": user_id,
                    "product_id": None,
                    "document_type": document_type,
                    "file_path": storage_path,
                }
            )
            .execute()
        )

        if not document_insert.data:
            raise RuntimeError(
                "Unable to create document record."
            )

        document_id = (
            document_insert.data[0]["id"]
        )

        print(
            "Document record created:",
            document_id,
        )

        # =================================================
        # 9. RETURN RESULT
        # =================================================

        return {
            "success": True,
            "user_id": user_id,
            "document_id": document_id,
            "filename": original_filename,
            "document_type": document_type,
            "ocr_text": ocr_text,
            "extracted_data": extracted_data,
        }

    except HTTPException:
        raise

    except Exception as exc:

        print(
            "Document processing error:",
            repr(exc),
        )

        # -------------------------------------------------
        # DATABASE CLEANUP
        # -------------------------------------------------

        if document_id:

            try:

                (
                    admin_client
                    .table("documents")
                    .delete()
                    .eq(
                        "id",
                        document_id,
                    )
                    .eq(
                        "user_id",
                        user_id,
                    )
                    .execute()
                )

            except Exception as cleanup_error:

                print(
                    "Document cleanup error:",
                    repr(cleanup_error),
                )

        # -------------------------------------------------
        # STORAGE CLEANUP
        # -------------------------------------------------

        if storage_path:

            try:

                delete_document(
                    storage_path,
                    access_token,
                )

            except Exception as cleanup_error:

                print(
                    "Storage cleanup error:",
                    repr(cleanup_error),
                )

        raise HTTPException(
            status_code=500,
            detail="Document processing failed.",
        )

    finally:

        if (
            temporary_path
            and os.path.exists(
                temporary_path
            )
        ):

            os.remove(
                temporary_path
            )

            print(
                "Temporary file removed."
            )


# =========================================================
# SAVE DOCUMENT REQUEST
# =========================================================

class SaveDocumentRequest(BaseModel):

    document_id: str = Field(
        ...,
        min_length=1,
    )

    extracted_data: dict[str, Any]


# =========================================================
# SAVE DOCUMENT
# =========================================================

@router.post("/save")
async def save_document(
    request: SaveDocumentRequest,
    authorization: str | None = Header(default=None),
):

    # =====================================================
    # 1. AUTHENTICATE
    # =====================================================

    user = await get_current_user(
        authorization
    )

    user_id = str(user.id)

    extracted_data = (
        request.extracted_data
    )

    # =====================================================
    # 2. GET PRODUCT / WARRANTY DATA
    # =====================================================

    product_data = (
        extracted_data.get("product")
        or {}
    )

    warranty_data = (
        extracted_data.get("warranty")
        or {}
    )

    # =====================================================
    # 3. VALIDATE PRODUCT
    # =====================================================

    product_name = (
        product_data.get(
            "product_name"
        )
    )

    if not product_name:

        raise HTTPException(
            status_code=422,
            detail=(
                "Product name is missing. "
                "Please confirm the product information."
            ),
        )

    # =====================================================
    # 4. VALIDATE WARRANTY DATES
    # =====================================================

    warranty_start = (
        warranty_data.get(
            "warranty_start"
        )
    )

    warranty_end = (
        warranty_data.get(
            "warranty_end"
        )
    )

    if not warranty_start or not warranty_end:

        raise HTTPException(
            status_code=422,
            detail=(
                "Warranty dates are missing or uncertain. "
                "Please confirm the warranty dates manually."
            ),
        )

    # =====================================================
    # 5. VALIDATE DATE FORMAT
    # =====================================================

    try:

        start_date = date.fromisoformat(
            str(warranty_start)
        )

        end_date = date.fromisoformat(
            str(warranty_end)
        )

    except ValueError:

        raise HTTPException(
            status_code=422,
            detail=(
                "Invalid warranty date format. "
                "Expected YYYY-MM-DD."
            ),
        )

    # =====================================================
    # 6. VALIDATE DATE ORDER
    # =====================================================

    if end_date < start_date:

        raise HTTPException(
            status_code=422,
            detail=(
                "Warranty end date cannot be "
                "before warranty start date."
            ),
        )

    try:

        # =================================================
        # 7. FIND DOCUMENT
        # =================================================

        document_response = (
            admin_client
            .table("documents")
            .select(
                "id,user_id,product_id,"
                "file_path,document_type"
            )
            .eq(
                "id",
                request.document_id,
            )
            .eq(
                "user_id",
                user_id,
            )
            .maybe_single()
            .execute()
        )

        document = (
            document_response.data
        )

        if not document:

            raise HTTPException(
                status_code=404,
                detail="Document not found.",
            )

        # =================================================
        # 8. PREVENT DUPLICATE SAVE
        # =================================================

        if document.get(
            "product_id"
        ):

            return {
                "success": True,
                "message": (
                    "Document has already "
                    "been saved."
                ),
                "product_id": (
                    document["product_id"]
                ),
                "document_id": (
                    request.document_id
                ),
            }

        # =================================================
        # 9. CREATE PRODUCT
        # =================================================

        print("Creating product...")

        product_insert = (
            admin_client
            .table("products")
            .insert(
                {
                    "user_id": user_id,
                    "product_name": product_name,
                    "brand": product_data.get(
                        "brand"
                    ),
                    "model": product_data.get(
                        "model"
                    ),
                    "serial_number": product_data.get(
                        "serial_number"
                    ),
                    "purchase_date": product_data.get(
                        "purchase_date"
                    ),
                }
            )
            .execute()
        )

        if not product_insert.data:

            raise RuntimeError(
                "Unable to save product."
            )

        product = (
            product_insert.data[0]
        )

        product_id = product["id"]

        print(
            "Product created:",
            product_id,
        )

        # =================================================
        # 10. CREATE WARRANTY
        # =================================================

        print("Creating warranty...")

        warranty_insert = (
            admin_client
            .table("warranties")
            .insert(
                {
                    "product_id": product_id,
                    "warranty_start": (
                        start_date.isoformat()
                    ),
                    "warranty_end": (
                        end_date.isoformat()
                    ),
                    "duration_months": (
                        warranty_data.get(
                            "duration_months"
                        )
                    ),
                    "source": (
                        warranty_data.get(
                            "source"
                        )
                    ),
                    "status": "active",
                }
            )
            .execute()
        )

        if not warranty_insert.data:

            try:

                (
                    admin_client
                    .table("products")
                    .delete()
                    .eq(
                        "id",
                        product_id,
                    )
                    .eq(
                        "user_id",
                        user_id,
                    )
                    .execute()
                )

            except Exception as cleanup_error:

                print(
                    "Product cleanup error:",
                    repr(cleanup_error),
                )

            raise RuntimeError(
                "Unable to save warranty."
            )

        warranty = (
            warranty_insert.data[0]
        )

        warranty_id = warranty["id"]

        print(
            "Warranty created:",
            warranty_id,
        )

        # =================================================
        # 11. CREATE AUTOMATIC WARRANTY REMINDERS
        # =================================================

        print(
            "Creating automatic warranty reminders..."
        )

        today = date.today()

        reminder_days = [30, 7, 1]

        for days_before in reminder_days:

            reminder_date = (
                end_date
                - timedelta(days=days_before)
            )

            # Don't create reminders that are
            # already in the past.
            if reminder_date < today:
                continue

            notification_insert = (
                admin_client
                .table("notifications")
                .insert(
                    {
                        "user_id": user_id,
                        "type": (
                            f"warranty_{days_before}_days"
                        ),
                        "reference_id": warranty_id,
                        "scheduled_at": (
                            reminder_date.isoformat()
                        ),
                        "status": "pending",
                    }
                )
                .execute()
            )

            if not notification_insert.data:

                raise RuntimeError(
                    "Unable to create warranty reminder."
                )

            print(
                f"Reminder created: "
                f"{days_before} days before expiry "
                f"({reminder_date.isoformat()})"
            )

        # =================================================
        # 12. LINK DOCUMENT TO PRODUCT
        # =================================================

        print(
            "Linking document to product..."
        )

        (
            admin_client
            .table("documents")
            .update(
                {
                    "product_id": product_id
                }
            )
            .eq(
                "id",
                request.document_id,
            )
            .eq(
                "user_id",
                user_id,
            )
            .execute()
        )

        print(
            "Document linked successfully."
        )

        # =================================================
        # 13. RETURN
        # =================================================

        return {
            "success": True,
            "message": (
                "Product, warranty and automatic "
                "reminders saved successfully."
            ),
            "document_id": (
                request.document_id
            ),
            "product_id": product_id,
            "warranty_id": warranty_id,
            "product": product,
            "warranty": warranty,
        }

    except HTTPException:
        raise

    except Exception as exc:

        print(
            "Save document error:",
            repr(exc),
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to save document.",
        )