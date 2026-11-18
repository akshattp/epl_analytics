from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from backend.database.db import get_db
from backend.analytics.tournament_intelligence import TournamentIntelligenceEngine
from backend.analytics.llm_explainer import LLMExplainer

router = APIRouter(prefix="/api/insights", tags=["Insights"])

@router.get("")
def get_insights(db: Session = Depends(get_db)):
    engine = TournamentIntelligenceEngine(db)
    insights_dict = engine.generate_all_insights()
    
    # Flatten for overall list and keep categorized
    all_list = []
    for cat, items in insights_dict.items():
        all_list.extend(items)

    return {
        "total_insights": len(all_list),
        "categories": insights_dict,
        "all": all_list
    }

@router.post("/explain")
def explain_insight_llm(insight: Dict[str, Any] = Body(...)):
    explainer = LLMExplainer()
    explanation = explainer.explain_insight(insight)
    return explanation
