import os

from azure.ai.documentintelligence import (
    DocumentIntelligenceClient,
)
from azure.core.credentials import AzureKeyCredential
from azure.core.pipeline.transport import RequestsTransport
from dotenv import load_dotenv


load_dotenv()


AZURE_ENDPOINT = os.getenv(
    "AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT"
)

AZURE_KEY = os.getenv(
    "AZURE_DOCUMENT_INTELLIGENCE_KEY"
)


def create_document_intelligence_client():

    if not AZURE_ENDPOINT:
        raise RuntimeError(
            "AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT "
            "is missing from backend/.env"
        )

    if not AZURE_KEY:
        raise RuntimeError(
            "AZURE_DOCUMENT_INTELLIGENCE_KEY "
            "is missing from backend/.env"
        )

    transport = RequestsTransport(
        connection_verify=True
    )

    return DocumentIntelligenceClient(
        endpoint=AZURE_ENDPOINT,
        credential=AzureKeyCredential(
            AZURE_KEY
        ),
        transport=transport,
    )


def extract_text_from_file(
    file_path: str,
) -> str:

    if not os.path.exists(file_path):
        raise FileNotFoundError(
            f"File not found: {file_path}"
        )

    client = (
        create_document_intelligence_client()
    )

    with open(
        file_path,
        "rb",
    ) as document_file:

        document_bytes = (
            document_file.read()
        )

    poller = (
        client.begin_analyze_document(
            "prebuilt-read",
            body=document_bytes,
        )
    )

    result = poller.result()

    extracted_lines = []

    for page in result.pages:

        for line in page.lines:

            extracted_lines.append(
                line.content
            )

    return "\n".join(
        extracted_lines
    ).strip()