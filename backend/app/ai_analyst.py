import json
import os
import socket
import urllib.error
import urllib.request
from pathlib import Path

from dotenv import load_dotenv


# Load backend/.env independent of the process working directory. Existing
# environment variables take precedence over values in the local file.
load_dotenv(Path(__file__).resolve().parents[1] / ".env", override=False)

DEFAULT_GEMINI_MODEL = "gemini-3.8-flash"


class AiUnavailable(Exception):
    """Raised when the analyst cannot run (missing key, HTTP error, or bad reply)."""


SYSTEM_INSTRUCTIONS = """You are the StigGrid AI Grid Analyst.
You explain IEEE-14 coordination ticks for college students and professors.

Rules:
- Use only the JSON snapshot. Never invent voltages, loadings, agent IDs, or gate results.
- If a field is missing, say it is not in the snapshot.
- Facts are values from the snapshot. Possible explanations must be labeled as such.
- Never say SafetyGate accepted an action if status is rejected or skipped.
- Recommendations are advisory only. Do not tell the user to bypass SafetyGate or apply generator setpoints directly.
- Keep each section to a few short sentences. Use plain English.
- Keep essential terms: stigmergy (agents coordinate by leaving fading signals in shared memory), power flow, agent, SafetyGate (every proposed change is checked against grid safety limits before it is applied).

Return JSON only with this shape:
{
  "what_happened": "string",
  "why": "string",
  "recommendations": [{"text": "string", "evidence": "string"}],
  "answer": "string or empty if no user question"
}
"""


def is_configured() -> bool:
    return bool(os.environ.get("GEMINI_API_KEY", "").strip())


def setup_message() -> str:
    return (
        "AI Grid Analyst is unavailable. Set the backend environment variable "
        "GEMINI_API_KEY to a Google AI Studio key, then restart the API. "
        f"Optional: GEMINI_MODEL (default {DEFAULT_GEMINI_MODEL})."
    )


def analyze_snapshot(snapshot: dict, question: str | None = None) -> dict:
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise AiUnavailable(setup_message())

    model = os.environ.get("GEMINI_MODEL", DEFAULT_GEMINI_MODEL).strip() or DEFAULT_GEMINI_MODEL
    payload = {
        "snapshot": snapshot,
        "user_question": (question or "").strip() or None,
    }
    prompt = (
        SYSTEM_INSTRUCTIONS
        + "\n\nSnapshot:\n"
        + json.dumps(payload, default=str)
    )

    body = json.dumps({
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json",
            "maxOutputTokens": 512,
        },
    }).encode("utf-8")

    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{model}:generateContent?key={api_key}"
    )
    request = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=90) as response:
            raw = json.loads(response.read().decode("utf-8"))
    except (TimeoutError, socket.timeout) as exc:
        raise AiUnavailable("Gemini request timed out. Please try again.") from exc
    except urllib.error.HTTPError as exc:
        raise AiUnavailable(f"Gemini request failed ({exc.code}).") from exc
    except urllib.error.URLError as exc:
        raise AiUnavailable(f"Gemini request failed: {exc.reason}") from exc

    text = _extract_text(raw)
    parsed = _parse_json(text)
    recommendations = parsed.get("recommendations") or []
    if not isinstance(recommendations, list):
        recommendations = []

    cleaned = []
    for item in recommendations[:5]:
        if isinstance(item, dict) and item.get("text"):
            cleaned.append({
                "text": str(item.get("text", "")).strip(),
                "evidence": str(item.get("evidence", "")).strip(),
            })

    return {
        "what_happened": str(parsed.get("what_happened", "")).strip(),
        "why": str(parsed.get("why", "")).strip(),
        "recommendations": cleaned,
        "answer": str(parsed.get("answer", "")).strip(),
        "model": model,
    }


def _extract_text(raw: dict) -> str:
    candidates = raw.get("candidates") or []
    if not candidates:
        raise AiUnavailable("Gemini returned no candidates.")
    parts = ((candidates[0] or {}).get("content") or {}).get("parts") or []
    text = "".join(str(part.get("text", "")) for part in parts if isinstance(part, dict))
    if not text.strip():
        raise AiUnavailable("Gemini returned an empty response.")
    return text


def _parse_json(text: str) -> dict:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
        cleaned = cleaned.strip()
    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise AiUnavailable("Gemini did not return valid JSON.") from exc
    if not isinstance(parsed, dict):
        raise AiUnavailable("Gemini JSON was not an object.")
    return parsed
