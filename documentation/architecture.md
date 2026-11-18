# EPL Platform Architecture & System Design

## 1. System Overview

The **EPL (Exotica Premier League) Historical Cricket Analytics & Player Auction Intelligence Platform** is a local-first full-stack system designed to ingest CricHeroes match scorecards from PDF archives, normalize and audit tournament statistics, compute explainable player ratings, and provide auction intelligence for six franchise owners.

```
+-------------------------------------------------------------+
|                 Next.js Frontend (Port 3000)                |
|  14 Responsive Pages • Lucide Icons • Recharts • 5-Color UI |
+------------------------------+------------------------------+
                               | REST / WebSockets
+------------------------------v------------------------------+
|                 FastAPI Backend (Port 8000)                 |
|  Analytics Services • Valuation Engine • Similarity Clusters|
+--------------+-------------------------------+--------------+
               |                               |
+--------------v---------------+ +-------------v--------------+
|      SQLite Database         | |     Local Ollama (Opt)     |
|   SQLAlchemy ORM + Models    | |   11434/api/generate (LLM) |
+------------------------------+ +----------------------------+
               ^
               | Extract & Validate
+--------------+----------------------------------------------+
|         PDF Extraction Engine (PyMuPDF / fitz)              |
|   27 Match Scorecards (2023, 2024, 2025) • Data Quality Audit|
+-------------------------------------------------------------+
```

---

## 2. Directory Layout

- `data/raw/`: Original extracted PDF files from `epl_data_historical.zip`.
- `data/extracted/`: Structured JSON extract (`matches.json`) of all 27 matches.
- `data/database/`: SQLite database `epl_analytics.db`.
- `backend/`: FastAPI application, endpoints, analytics engines, services, and live auction manager.
- `frontend/`: Next.js 14 App Router application with Tailwind CSS and 5-brand-color design system.
- `reports/`: Data quality reports and import audit logs.
- `tests/`: Automated pytest verification suite.
- `documentation/`: System architecture and statistical formula documentation.

---

## 3. Five-Brand Color Palette Implementation

1. **Midnight Black**: `#02000D` — Darkest background, footer surfaces, high-contrast text.
2. **Deep Navy**: `#07203F` — Primary card surfaces, navigation header, table headers.
3. **Warm Beige**: `#EBDED4` — Primary application background, neutral editorial canvas.
4. **Dusty Peach**: `#D9AA90` — Subdued borders, metadata accents, secondary highlights.
5. **Terracotta**: `#A65E46` — Primary interactive callouts, ratings highlights, key statistics.
