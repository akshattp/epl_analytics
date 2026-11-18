import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database.db import engine, Base, SessionLocal
from backend.routers import (
    overview, players, analytics, insights, teams, seasons, auction, admin, auth,
    version, advanced_analytics, exports, auction_setup
)
from backend.auction.live_auction_manager import auction_manager

# Create tables if not present
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="EPL - Exotica Premier League Analytics & Auction Intelligence API",
    description="Historical Cricket Intelligence, Player Auction Intelligence & Tournament Auction Management Platform.",
    version="1.1.0"
)

# CORS configuration for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(overview.router)
app.include_router(players.router)
app.include_router(analytics.router)
app.include_router(insights.router)
app.include_router(teams.router)
app.include_router(seasons.router)
app.include_router(auction_setup.router)
app.include_router(auction.router)
app.include_router(admin.router)
app.include_router(auth.router)
app.include_router(version.router)
app.include_router(advanced_analytics.router)
app.include_router(exports.router)


@app.on_event("startup")
def recover_auction_state_on_startup():
    db = SessionLocal()
    try:
        auction_manager.sync_from_db(db)
    finally:
        db.close()


@app.get("/")
def health_check():
    return {
        "status": "online",
        "app": "EPL - Exotica Premier League Analytics & Auction Intelligence Platform",
        "version": "1.1.0",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
