import resend

from app.config import RESEND_API_KEY


resend.api_key = RESEND_API_KEY


def send_email(
    to_email: str,
    subject: str,
    html: str,
):
    response = resend.Emails.send({
        "from": "PurchaseGuard <onboarding@resend.dev>",
        "to": [to_email],
        "subject": subject,
        "html": html,
    })

    return response