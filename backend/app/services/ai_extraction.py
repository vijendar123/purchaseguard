import json
from typing import Any

from openai import OpenAI

from app.config import GROQ_API_KEY


# Groq provides an OpenAI-compatible API
client = OpenAI(
    api_key=GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1",
)


# Model currently supported by Groq
MODEL_NAME = "openai/gpt-oss-120b"


SYSTEM_PROMPT = """
You are PurchaseGuard's document extraction AI.

Your job is to extract factual information from purchase
documents such as invoices, receipts and warranty cards.

IMPORTANT RULES:

1. Never invent information.
2. Never guess a warranty date.
3. If a value is not clearly present, return null.
4. If warranty information is unclear, return null.
5. Dates must use YYYY-MM-DD format when possible.
6. Extract only information supported by the document text.
7. Do not assume information that is not present.
8. If important information is missing or uncertain,
   set needs_user_confirmation to true.
9. Return valid JSON only.

Return exactly this structure:

{
  "document_type": null,
  "product": {
    "product_name": null,
    "brand": null,
    "model": null,
    "serial_number": null,
    "purchase_date": null
  },
  "warranty": {
    "warranty_start": null,
    "warranty_end": null,
    "duration_months": null,
    "source": null
  },
  "confidence": {
    "product": 0,
    "purchase_date": 0,
    "warranty": 0
  },
  "needs_user_confirmation": false,
  "missing_information": []
}
"""


def extract_purchase_information(
    document_text: str,
) -> dict[str, Any]:
    """
    Extract product, purchase and warranty information
    from OCR text using Groq.
    """

    if not document_text or not document_text.strip():
        raise ValueError("Document text is empty.")

    response = client.chat.completions.create(
        model=MODEL_NAME,
        temperature=0,
        messages=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT,
            },
            {
                "role": "user",
                "content": f"""
Extract the purchase and warranty information
from the following document text.

DOCUMENT TEXT:

{document_text}
""",
            },
        ],
        response_format={
            "type": "json_object"
        },
    )

    if not response.choices:
        raise RuntimeError(
            "Groq returned no choices."
        )

    content = response.choices[0].message.content

    if not content:
        raise RuntimeError(
            "Groq returned an empty response."
        )

    try:
        result = json.loads(content)
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            "Groq returned invalid JSON."
        ) from exc

    return result