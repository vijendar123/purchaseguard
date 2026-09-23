from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.documents import router as documents_router
from app.routes.notifications import router as notifications_router
from app.scheduler import start_scheduler, stop_scheduler


# ---------------------------------------------------------
# PurchaseGuard API
# ---------------------------------------------------------

app = FastAPI(
    title="PurchaseGuard API",
    description=(
        "AI-powered warranty and subscription management platform. "
        "Processes invoices, receipts, and warranty documents using "
        "Azure AI Document Intelligence and Groq AI."
    ),
    version="1.0.0",
)


# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://purchaseguard-ten.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# Routes
# ---------------------------------------------------------

app.include_router(documents_router)
app.include_router(notifications_router)


# ---------------------------------------------------------
# Scheduler
# ---------------------------------------------------------

@app.on_event("startup")
async def startup_event():
    start_scheduler()


@app.on_event("shutdown")
async def shutdown_event():
    stop_scheduler()


# ---------------------------------------------------------
# Root
# ---------------------------------------------------------

@app.get("/")
async def root():
    return {
        "application": "PurchaseGuard API",
        "status": "running",
        "version": "1.0.0",
    }


# ---------------------------------------------------------
# Health Check
# ---------------------------------------------------------

@app.get("/health")
async def health():
    return {
        "status": "healthy"
    }