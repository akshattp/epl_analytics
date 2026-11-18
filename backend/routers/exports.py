from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from backend.database.db import get_db
from backend.services.export_service import (
    build_filtered_player_export_rows,
    generate_players_csv,
    generate_players_excel,
    generate_players_pdf,
    generate_individual_player_pdf,
    generate_auction_results_excel,
    generate_auction_results_pdf
)
from backend.routers.auction_setup import compute_auction_results

router = APIRouter(prefix="/api/exports", tags=["Exports & Reports"])


@router.get("/players")
def export_players(
    format: str = "csv",
    search: Optional[str] = None,
    role: Optional[str] = None,
    category: Optional[str] = None,
    min_matches: int = 0,
    sort_by: str = "overall_rating",
    sort_dir: str = "desc",
    db: Session = Depends(get_db)
):
    rows = build_filtered_player_export_rows(
        db=db,
        search=search,
        role=role,
        category=category,
        min_matches=min_matches,
        sort_by=sort_by,
        sort_dir=sort_dir
    )

    parts = []
    if role and role != "ALL": parts.append(f"Role={role}")
    if category and category != "ALL": parts.append(f"Category={category}")
    if search: parts.append(f"Search='{search}'")
    if min_matches > 0: parts.append(f"MinMatches>={min_matches}")
    filter_note = ", ".join(parts) if parts else "All 73 Canonical Players"

    fmt = format.lower().strip()
    if fmt == "csv":
        data = generate_players_csv(rows)
        return Response(
            content=data,
            media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": 'attachment; filename="EPL_Player_Statistics.csv"'}
        )
    elif fmt in ("xlsx", "excel"):
        data = generate_players_excel(rows, filter_note=filter_note)
        return Response(
            content=data,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": 'attachment; filename="EPL_Player_Statistics.xlsx"'}
        )
    elif fmt == "pdf":
        data = generate_players_pdf(rows, filter_note=filter_note)
        return Response(
            content=data,
            media_type="application/pdf",
            headers={"Content-Disposition": 'attachment; filename="EPL_Player_Statistics.pdf"'}
        )
    else:
        raise HTTPException(status_code=400, detail="Unsupported format. Use csv, xlsx, or pdf.")


@router.get("/player/{player_id}/pdf")
def export_player_profile_pdf(player_id: str, db: Session = Depends(get_db)):
    pdf_bytes = generate_individual_player_pdf(db, player_id)
    if not pdf_bytes:
        raise HTTPException(status_code=404, detail="Player not found.")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="EPL_Player_Report_{player_id}.pdf"'}
    )


@router.get("/auction-results")
def export_auction_results(format: str = "pdf", db: Session = Depends(get_db)):
    results = compute_auction_results(db)
    fmt = format.lower().strip()
    if fmt in ("xlsx", "excel"):
        data = generate_auction_results_excel(results)
        return Response(
            content=data,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": 'attachment; filename="EPL_Auction_Results.xlsx"'}
        )
    elif fmt == "pdf":
        data = generate_auction_results_pdf(results)
        return Response(
            content=data,
            media_type="application/pdf",
            headers={"Content-Disposition": 'attachment; filename="EPL_Auction_Results.pdf"'}
        )
    else:
        raise HTTPException(status_code=400, detail="Unsupported format. Use pdf or xlsx.")
