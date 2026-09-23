from datetime import date

from app.supabase_client import create_admin_client
from app.services.email_service import send_email


admin_client = create_admin_client()

MAX_RETRIES = 3


def process_pending_notifications():
    today = date.today().isoformat()

    # =====================================================
    # GET DUE NOTIFICATIONS
    # =====================================================

    response = (
        admin_client
        .table("notifications")
        .select("*")
        .eq("status", "pending")
        .lte("scheduled_at", today)
        .is_("sent_at", "null")
        .execute()
    )

    notifications = response.data or []

    results = []

    print(
        f"🔔 PurchaseGuard: "
        f"Found {len(notifications)} pending notification(s)."
    )

    # =====================================================
    # PROCESS EACH NOTIFICATION
    # =====================================================

    for notification in notifications:

        notification_id = notification.get("id")

        try:

            user_id = notification.get("user_id")
            reference_id = notification.get("reference_id")

            if not user_id:
                raise ValueError(
                    "Notification user_id is missing."
                )

            if not reference_id:
                raise ValueError(
                    "Notification reference_id is missing."
                )

            # =================================================
            # GET USER
            # =================================================

            user_response = (
                admin_client
                .auth.admin
                .get_user_by_id(user_id)
            )

            user = user_response.user

            if not user or not user.email:
                raise ValueError(
                    "User email not found."
                )

            # =================================================
            # GET WARRANTY
            # =================================================

            warranty_response = (
                admin_client
                .table("warranties")
                .select(
                    "id,product_id,warranty_end"
                )
                .eq(
                    "id",
                    reference_id,
                )
                .limit(1)
                .execute()
            )

            warranties = (
                warranty_response.data or []
            )

            if not warranties:
                raise ValueError(
                    "Warranty not found."
                )

            warranty = warranties[0]

            product_id = warranty.get(
                "product_id"
            )

            warranty_end = warranty.get(
                "warranty_end"
            )

            if not product_id:
                raise ValueError(
                    "Warranty product_id is missing."
                )

            # =================================================
            # GET PRODUCT
            # =================================================

            product_response = (
                admin_client
                .table("products")
                .select(
                    "id,product_name,brand,model"
                )
                .eq(
                    "id",
                    product_id,
                )
                .limit(1)
                .execute()
            )

            products = (
                product_response.data or []
            )

            if not products:
                raise ValueError(
                    "Product not found."
                )

            product = products[0]

            product_name = (
                product.get(
                    "product_name"
                )
                or "your product"
            )

            # =================================================
            # DETERMINE REMINDER TYPE
            # =================================================

            reminder_type = notification.get(
                "type",
                "warranty_reminder",
            )

            if reminder_type == "warranty_30_days":

                subject = (
                    f"Your {product_name} warranty "
                    f"expires in 30 days"
                )

                message = (
                    f"Your warranty for "
                    f"<strong>{product_name}</strong> "
                    f"will expire in 30 days."
                )

            elif reminder_type == "warranty_7_days":

                subject = (
                    f"Your {product_name} warranty "
                    f"expires in 7 days"
                )

                message = (
                    f"Your warranty for "
                    f"<strong>{product_name}</strong> "
                    f"will expire in 7 days."
                )

            elif reminder_type == "warranty_1_days":

                subject = (
                    f"Your {product_name} warranty "
                    f"expires tomorrow"
                )

                message = (
                    f"Your warranty for "
                    f"<strong>{product_name}</strong> "
                    f"expires tomorrow."
                )

            else:

                subject = (
                    f"PurchaseGuard warranty reminder: "
                    f"{product_name}"
                )

                message = (
                    f"Your warranty reminder for "
                    f"<strong>{product_name}</strong> "
                    f"is due."
                )

            # =================================================
            # EMAIL HTML
            # =================================================

            html = f"""
            <div style="
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: auto;
                padding: 30px;
                background: #f8fafc;
                border-radius: 12px;
            ">

                <h2 style="color: #2563eb;">
                    🛡️ PurchaseGuard
                </h2>

                <p>Hello,</p>

                <p>
                    {message}
                </p>

                <div style="
                    background: white;
                    padding: 20px;
                    border-radius: 10px;
                    margin-top: 20px;
                ">

                    <p>
                        <strong>Product:</strong>
                        {product_name}
                    </p>

                    <p>
                        <strong>Warranty end:</strong>
                        {warranty_end or "Not available"}
                    </p>

                </div>

                <p style="
                    margin-top: 25px;
                    color: #64748b;
                    font-size: 14px;
                ">
                    This reminder was sent automatically by
                    PurchaseGuard.
                </p>

            </div>
            """

            # =================================================
            # SEND EMAIL
            # =================================================

            print(
                f"📧 Sending notification "
                f"{notification_id}..."
            )

            # TEMPORARY RESEND TEST MODE
            # Change this back to user.email
            # after verifying your Resend domain.

            send_email(
                to_email="ajmeeravijendar98@gmail.com",
                subject=subject,
                html=html,
            )

            # =================================================
            # MARK AS SENT
            # =================================================

            (
                admin_client
                .table("notifications")
                .update(
                    {
                        "status": "sent",
                        "sent_at": today,
                        "last_error": None,
                    }
                )
                .eq(
                    "id",
                    notification_id,
                )
                .execute()
            )

            print(
                f"✅ Notification {notification_id} sent."
            )

            results.append(
                {
                    "notification_id": notification_id,
                    "email": user.email,
                    "product": product_name,
                    "status": "sent",
                }
            )

        except Exception as exc:

            error_message = str(exc)

            current_retry_count = (
                notification.get(
                    "retry_count",
                    0,
                )
                or 0
            )

            new_retry_count = (
                current_retry_count + 1
            )

            print(
                "❌ Notification processing error:",
                repr(exc),
            )

            # =================================================
            # MAX RETRIES REACHED
            # =================================================

            if new_retry_count >= MAX_RETRIES:

                (
                    admin_client
                    .table("notifications")
                    .update(
                        {
                            "status": "failed",
                            "retry_count": new_retry_count,
                            "last_error": error_message,
                        }
                    )
                    .eq(
                        "id",
                        notification_id,
                    )
                    .execute()
                )

                print(
                    f"🚫 Notification {notification_id} "
                    f"marked as FAILED after "
                    f"{new_retry_count} attempts."
                )

                results.append(
                    {
                        "notification_id": notification_id,
                        "status": "failed",
                        "retry_count": new_retry_count,
                        "reason": error_message,
                    }
                )

            # =================================================
            # RETRY LATER
            # =================================================

            else:

                (
                    admin_client
                    .table("notifications")
                    .update(
                        {
                            "status": "pending",
                            "retry_count": new_retry_count,
                            "last_error": error_message,
                        }
                    )
                    .eq(
                        "id",
                        notification_id,
                    )
                    .execute()
                )

                print(
                    f"🔄 Notification {notification_id} "
                    f"will be retried. "
                    f"Attempt {new_retry_count}/"
                    f"{MAX_RETRIES}."
                )

                results.append(
                    {
                        "notification_id": notification_id,
                        "status": "retrying",
                        "retry_count": new_retry_count,
                        "reason": error_message,
                    }
                )

    # =====================================================
    # SUMMARY
    # =====================================================

    sent_count = sum(
        1
        for result in results
        if result.get("status") == "sent"
    )

    failed_count = sum(
        1
        for result in results
        if result.get("status") == "failed"
    )

    retry_count = sum(
        1
        for result in results
        if result.get("status") == "retrying"
    )

    print(
        f"✅ Notification check completed. "
        f"Sent: {sent_count}, "
        f"Retrying: {retry_count}, "
        f"Failed: {failed_count}"
    )

    return results