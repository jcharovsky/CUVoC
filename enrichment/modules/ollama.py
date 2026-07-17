"""Minimal local Ollama client for enrichment experiments and classification."""

from __future__ import annotations

import json
from time import perf_counter
from typing import Any
from urllib.error import URLError
from urllib.request import Request, urlopen


OLLAMA_BASE_URL = "http://localhost:11434"


def list_models(timeout_seconds: int = 5) -> dict[str, int]:
    """Return locally available Ollama model names and their byte sizes."""
    try:
        with urlopen(f"{OLLAMA_BASE_URL}/api/tags", timeout=timeout_seconds) as response:
            payload = json.load(response)
    except (URLError, TimeoutError, json.JSONDecodeError) as error:
        raise RuntimeError(
            "Could not reach Ollama at http://localhost:11434. Start Ollama and retry."
        ) from error

    models = payload.get("models")
    if not isinstance(models, list):
        raise RuntimeError("Ollama returned an invalid model list.")

    return {
        model["name"]: model["size"]
        for model in models
        if isinstance(model, dict)
        and isinstance(model.get("name"), str)
        and isinstance(model.get("size"), int)
    }


def generate_json(
    model: str,
    prompt: str,
    schema: dict[str, Any],
    timeout_seconds: int = 120,
) -> tuple[dict[str, Any], float]:
    """Generate one schema-constrained local response and measure its duration."""
    request_body = json.dumps(
        {
            "model": model,
            "prompt": prompt,
            "format": schema,
            "stream": False,
            "think": False,
            "keep_alive": "15m",
            "options": {"temperature": 0},
        }
    ).encode("utf-8")
    request = Request(
        f"{OLLAMA_BASE_URL}/api/generate",
        data=request_body,
        headers={"Content-Type": "application/json"},
    )

    started_at = perf_counter()
    try:
        with urlopen(request, timeout=timeout_seconds) as response:
            payload = json.load(response)
    except (URLError, TimeoutError, json.JSONDecodeError) as error:
        raise RuntimeError(f"Ollama generation failed for {model}: {error}") from error
    elapsed_seconds = perf_counter() - started_at

    response_text = payload.get("response")
    if not isinstance(response_text, str):
        raise RuntimeError(f"Ollama returned no text response for {model}.")

    try:
        result = json.loads(response_text)
    except json.JSONDecodeError as error:
        raise RuntimeError(f"Ollama returned invalid JSON for {model}.") from error
    if not isinstance(result, dict):
        raise RuntimeError(f"Ollama returned a non-object JSON response for {model}.")

    return result, elapsed_seconds
