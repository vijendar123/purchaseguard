from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.services.notification_worker import process_pending_notifications


scheduler = AsyncIOScheduler()


async def run_notification_job():
    print("🔔 PurchaseGuard: Checking pending notifications...")

    try:
        results = process_pending_notifications()

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

        print(
            f"✅ Notification check completed. "
            f"Sent: {sent_count}, Failed: {failed_count}"
        )

    except Exception as exc:
        print(
            "❌ Notification scheduler error:",
            repr(exc)
        )


def start_scheduler():
    if scheduler.running:
        return

    scheduler.add_job(
        run_notification_job,
        "date",
        id="initial_notification_check",
        replace_existing=True,
    )

    scheduler.add_job(
        run_notification_job,
        "interval",
        hours=1,
        id="notification_check",
        replace_existing=True,
    )

    scheduler.start()

    print("🚀 PurchaseGuard notification scheduler started.")


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()

        print(
            "🛑 PurchaseGuard notification scheduler stopped."
        )