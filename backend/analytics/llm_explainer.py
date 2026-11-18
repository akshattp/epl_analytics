import os
import json
import urllib.request
import urllib.error
from typing import Dict, Any, Optional

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")

class LLMExplainer:
    def __init__(self, host: str = OLLAMA_HOST, model: str = OLLAMA_MODEL):
        self.host = host
        self.model = model

    def is_available(self) -> bool:
        """Checks if local Ollama daemon is reachable."""
        try:
            req = urllib.request.Request(f"{self.host}/api/tags", headers={"User-Agent": "EPL-Analytics"})
            with urllib.request.urlopen(req, timeout=1.5) as resp:
                return resp.status == 200
        except Exception:
            return False

    def explain_insight(self, insight: Dict[str, Any]) -> Dict[str, Any]:
        """
        Takes verified analytical insight JSON and returns an explainable commentary.
        Falls back to verified deterministic explanation if Ollama is unavailable.
        """
        deterministic_explanation = {
            "source": "DETERMINISTIC_STATISTICAL_ENGINE",
            "headline": insight.get("title", ""),
            "summary": insight.get("short_explanation", ""),
            "numerical_proof": insight.get("supporting_evidence", ""),
            "methodology": insight.get("methodology", ""),
            "data_confidence": insight.get("confidence_level", "High"),
            "limitations": insight.get("data_limitations", "None noted")
        }

        if not self.is_available():
            return deterministic_explanation

        # If Ollama is running, query it with strict constraint prompt
        prompt = f"""
You are a Senior Cricket Analyst for EPL (Exotica Premier League).
Explain the following verified cricket statistics in clear, editorial prose.
CRITICAL RULES:
1. NEVER change or invent any numerical values. Only use the numbers provided below.
2. Clearly separate statistical fact from analytical interpretation.
3. Keep the commentary concise and professional.

Verified Input JSON:
{json.dumps(insight, indent=2)}

Provide your response in JSON format with keys:
"headline", "summary", "analytical_context", "tactical_takeaway".
"""
        payload = json.dumps({
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "format": "json"
        }).encode("utf-8")

        try:
            req = urllib.request.Request(
                f"{self.host}/api/generate",
                data=payload,
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=5.0) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                llm_text = data.get("response", "{}")
                parsed_llm = json.loads(llm_text)
                return {
                    "source": f"OLLAMA_LOCAL_LLM ({self.model})",
                    "headline": parsed_llm.get("headline", insight.get("title")),
                    "summary": parsed_llm.get("summary", insight.get("short_explanation")),
                    "analytical_context": parsed_llm.get("analytical_context", ""),
                    "tactical_takeaway": parsed_llm.get("tactical_takeaway", ""),
                    "numerical_proof": insight.get("supporting_evidence"),
                    "methodology": insight.get("methodology"),
                    "data_confidence": insight.get("confidence_level")
                }
        except Exception:
            return deterministic_explanation
