from datetime import date, timedelta

from fastapi import APIRouter, Header, HTTPException

from app.supabase_client import create_admin_client
from app.services.email_service import send_email


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"],
)

admin_client = create_admin_client()


# =========================================================
# AUTHENTICATION
# =========================================================

async def get_current_user(
    authorization: str | None = Header(default=None),
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Authorization required.",
        )

    access_token = authorization.replace(
        "Bearer ",
        "",
        1,
    ).strip()

    try:
        response = admin_client.auth.get_user(
            access_token
        )

        if not response or not response.user:
            raise HTTPException(
                status_code=401,
                detail="Invalid access token.",
            )

        return response.user

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired access token.",
        )


# =========================================================
# GET NOTIFICATIONS
# =========================================================

@router.get("")
async def get_notifications(
    authorization: str | None = Header(default=None),
):
    user = await get_current_user(
        authorization
    )

    user_id = str(user.id)

    try:
        response = (
            admin_client
            .table("notifications")
            .select("*")
            .eq("user_id", user_id)
            .order(
                "scheduled_at",
                desc=False,
            )
            .execute()
        )

        return {
            "success": True,
            "notifications": response.data or [],
        }

    except Exception as exc:

        print(
            "Notification fetch error:",
            repr(exc),
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to load notifications.",
        )


# =========================================================
# GENERATE WARRANTY NOTIFICATIONS
# =========================================================

@router.post("/generate")
async def generate_warranty_notifications(
    authorization: str | None = Header(default=None),
):
    user = await get_current_user(
        authorization
    )

    user_id = str(user.id)

    today = date.today()

    try:

        # -------------------------------------------------
        # GET USER'S ACTIVE WARRANTIES
        # -------------------------------------------------

        warranties = (
            admin_client
            .table("warranties")
            .select(
                "id,warranty_end,product_id,"
                "products!inner("
                "product_name,user_id"
                ")"
            )
            .eq(
                "products.user_id",
                user_id,
            )
            .eq(
                "status",
                "active",
            )
            .execute()
        )

        created = []

        # -------------------------------------------------
        # PROCESS EACH WARRANTY
        # -------------------------------------------------

        for warranty in warranties.data or []:

            warranty_end = warranty.get(
                "warranty_end"
            )

            product = (
                warranty.get("products")
                or {}
            )

            if not warranty_end:
                continue

            # Convert warranty end date
            end_date = date.fromisoformat(
                str(warranty_end)
            )

            product_name = (
                product.get("product_name")
                or "your product"
            )

            # -------------------------------------------------
            # REMINDER DAYS
            # -------------------------------------------------

            reminder_days = [
                30,
                7,
                1,
            ]

            # -------------------------------------------------
            # CREATE EACH REMINDER
            # -------------------------------------------------

            for days in reminder_days:

                reminder_date = (
                    end_date
                    - timedelta(
                        days=days
                    )
                )

                # Do not create reminders
                # that are already in the past.
                if reminder_date < today:
                    continue

                # -------------------------------------------------
                # INSERT REMINDER SAFELY
                #
                # The database has a UNIQUE constraint:
                #
                # user_id + reference_id + type
                #
                # Therefore duplicate reminders are ignored.
                # -------------------------------------------------

                notification = (
                    admin_client
                    .table("notifications")
                    .upsert(
                        {
                            "user_id": user_id,
                            "type": (
                                f"warranty_{days}_days"
                            ),
                            "reference_id": warranty["id"],
                            "scheduled_at": (
                                reminder_date.isoformat()
                            ),
                            "status": "pending",
                        },
                        on_conflict=(
                            "user_id,reference_id,type"
                        ),
                        ignore_duplicates=True,
                    )
                    .execute()
                )

                # -------------------------------------------------
                # ONLY ADD TO CREATED LIST IF A NEW
                # NOTIFICATION WAS ACTUALLY CREATED
                # -------------------------------------------------

                if notification.data:

                    created.append(
                        {
                            "product": product_name,
                            "days_before": days,
                            "scheduled_at": (
                                reminder_date.isoformat()
                            ),
                        }
                    )

        return {
            "success": True,
            "created": created,
            "count": len(created),
        }

    except Exception as exc:

        print(
            "Notification generation error:",
            repr(exc),
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to generate warranty notifications.",
        )


# =========================================================
# TEST EMAIL
# =========================================================

@router.post("/test-email")
async def test_email(
    authorization: str | None = Header(default=None),
):
    user = await get_current_user(
        authorization
    )

    user_email = user.email

    if not user_email:
        raise HTTPException(
            status_code=400,
            detail=(
                "Your account does not have "
                "an email address."
            ),
        )

    try:

        response = send_email(
            to_email=user_email,
            subject="PurchaseGuard Test Email",
            html="""
            <div style="
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: auto;
            ">

                <h2>🛡️ PurchaseGuard</h2>

                <p>
                    Your email notification system
                    is working.
                </p>

                <p>
                    This is a test email from
                    PurchaseGuard.
                </p>

                <hr>

                <p style="color: #666;">
                    Warranty and subscription reminders
                    will be delivered to this email address.
                </p>

            </div>
            """,
        )

        print(
            "Test email sent:",
            response,
        )

        return {
            "success": True,
            "message": (
                "Test email sent successfully."
            ),
            "email": user_email,
        }

    except Exception as exc:

        print(
            "Test email error:",
            repr(exc),
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to send test email.",
        )


# =========================================================
# PROCESS PENDING NOTIFICATIONS
# =========================================================

@router.post("/process-pending")
async def process_pending(
    authorization: str | None = Header(default=None),
):
    await get_current_user(
        authorization
    )

    try:

        from app.services.notification_worker import (
            process_pending_notifications,
        )

        results = (
            process_pending_notifications()
        )

        return {
            "success": True,
            "processed": len(results),
            "results": results,
        }

    except Exception as exc:

        print(
            "Pending notification error:",
            repr(exc),
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to process "
                "pending notifications."
            ),
        )