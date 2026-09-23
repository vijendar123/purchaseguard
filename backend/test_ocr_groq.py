from app.services.ocr_service import extract_text_from_file
from app.services.ai_extraction import extract_purchase_information


FILE_PATH = r"C:\Users\ajmee\PurchaseGuard\backend\test_invoice - Copy.png"


print("===== STEP 1: AZURE OCR =====")

ocr_text = extract_text_from_file(FILE_PATH)

print(ocr_text)

if not ocr_text:
    raise RuntimeError("Azure OCR returned no text.")


print("\n===== STEP 2: GROQ AI EXTRACTION =====")

result = extract_purchase_information(ocr_text)

print(result)

print("\n===== PURCHASEGUARD PIPELINE COMPLETE =====")