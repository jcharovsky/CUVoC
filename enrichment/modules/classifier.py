"""Resumable local classification helpers for the Enrichment phase."""

from __future__ import annotations

import hashlib
import json
import os
import tempfile
from pathlib import Path
from typing import Any, Iterable

from enrichment.modules.ollama import generate_json


SENTIMENT_VALUES = ("positive", "negative", "neutral")
CHECKPOINT_VERSION = 1


def normalize_message(message: str) -> str:
    """Normalize text for exact duplicate detection without changing display text."""
    return " ".join(message.split()).casefold()


def message_key(message: str) -> str:
    """Create a stable key for a normalized message."""
    return hashlib.sha256(normalize_message(message).encode("utf-8")).hexdigest()


def _normalize_theme(theme: str) -> str:
    return " ".join(theme.split()).casefold()


def _write_checkpoint(path: Path, checkpoint: dict[str, Any]) -> None:
    """Atomically replace the local checkpoint after completed work."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        "w", encoding="utf-8", dir=path.parent, delete=False
    ) as temporary_file:
        json.dump(checkpoint, temporary_file, ensure_ascii=False, indent=2)
        temporary_path = Path(temporary_file.name)
    os.replace(temporary_path, path)


def _load_checkpoint(path: Path, model: str, initial_taxonomy: list[str]) -> dict[str, Any]:
    """Load compatible local progress or initialize a new classification state."""
    if not path.is_file():
        return {
            "version": CHECKPOINT_VERSION,
            "model": model,
            "taxonomy": initial_taxonomy.copy(),
            "predictions": {},
        }

    try:
        checkpoint = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise RuntimeError(f"Could not load classification checkpoint: {error}") from error

    if checkpoint.get("version") != CHECKPOINT_VERSION:
        raise RuntimeError("Classification checkpoint has an unsupported version.")
    if checkpoint.get("model") != model:
        raise RuntimeError("Classification checkpoint was created with another model.")
    if not isinstance(checkpoint.get("taxonomy"), list) or not isinstance(
        checkpoint.get("predictions"), dict
    ):
        raise RuntimeError("Classification checkpoint has an invalid structure.")

    return checkpoint


def _format_examples(examples: Iterable[dict[str, str]]) -> str:
    """Render manually labelled examples for few-shot local prompts."""
    return "\n\n".join(
        "Message: {message}\nTheme: {theme}\nSentiment: {sentiment}".format(
            message=example["message_text"],
            theme=example["theme"],
            sentiment=example["sentiment"],
        )
        for example in examples
    )


def _sentiment_prompt(message: str, examples: str) -> str:
    return (
        "Classify the sentiment of this CookUnity customer message. "
        "Choose exactly one of positive, negative, or neutral. Ignore quoted staff "
        "replies, headers, and signatures.\n\n"
        f"Labelled examples:\n{examples}\n\nMessage: {message}"
    )


def _theme_prompt(message: str, examples: str, taxonomy: list[str]) -> str:
    candidates = "\n".join(f"- {theme}" for theme in taxonomy)
    return (
        "Classify this CookUnity customer message. Return a concise theme of two to "
        "five words and one sentiment. Prefer a candidate theme when it accurately "
        "describes the message. Create a new theme only when no candidate fits, and "
        "avoid unnecessary wording variants. Ignore quoted staff replies, headers, "
        "and signatures.\n\n"
        f"Current candidate themes:\n{candidates}\n\n"
        f"Labelled examples:\n{examples}\n\nMessage: {message}"
    )


SENTIMENT_SCHEMA = {
    "type": "object",
    "properties": {
        "sentiment": {"type": "string", "enum": list(SENTIMENT_VALUES)},
    },
    "required": ["sentiment"],
    "additionalProperties": False,
}

THEME_SCHEMA = {
    "type": "object",
    "properties": {
        "theme": {"type": "string"},
        "sentiment": {"type": "string", "enum": list(SENTIMENT_VALUES)},
    },
    "required": ["theme", "sentiment"],
    "additionalProperties": False,
}


def classify_workload(
    workload: Iterable[dict[str, Any]],
    examples: Iterable[dict[str, str]],
    initial_taxonomy: list[str],
    model: str,
    checkpoint_path: Path,
    checkpoint_every: int = 10,
) -> tuple[list[dict[str, Any]], list[str]]:
    """Classify unique messages locally, preserving state for reliable resumption."""
    if checkpoint_every < 1:
        raise ValueError("checkpoint_every must be at least one.")

    rendered_examples = _format_examples(examples)
    checkpoint = _load_checkpoint(checkpoint_path, model, initial_taxonomy)
    taxonomy = checkpoint["taxonomy"]
    predictions = checkpoint["predictions"]
    completed_since_checkpoint = 0

    for record in workload:
        key = record["message_key"]
        if key in predictions:
            continue

        message = record["message_text"]
        requires_theme = record["requires_theme"]
        if requires_theme:
            response, elapsed_seconds = generate_json(
                model=model,
                prompt=_theme_prompt(message, rendered_examples, taxonomy),
                schema=THEME_SCHEMA,
            )
            theme = response.get("theme")
            sentiment = response.get("sentiment")
            if not isinstance(theme, str) or not theme.strip():
                raise RuntimeError("Theme classification returned an empty theme.")
            if not isinstance(sentiment, str) or sentiment not in SENTIMENT_VALUES:
                raise RuntimeError("Theme classification returned an invalid sentiment.")

            normalized_theme = _normalize_theme(theme)
            matching_theme = next(
                (candidate for candidate in taxonomy if _normalize_theme(candidate) == normalized_theme),
                None,
            )
            if matching_theme is None:
                theme = " ".join(theme.split())
                taxonomy.append(theme)
            else:
                theme = matching_theme
        else:
            response, elapsed_seconds = generate_json(
                model=model,
                prompt=_sentiment_prompt(message, rendered_examples),
                schema=SENTIMENT_SCHEMA,
            )
            theme = None
            sentiment = response.get("sentiment")
            if not isinstance(sentiment, str) or sentiment not in SENTIMENT_VALUES:
                raise RuntimeError("Sentiment classification returned an invalid sentiment.")

        predictions[key] = {
            "message_key": key,
            "theme": theme,
            "sentiment": sentiment,
            "requires_theme": requires_theme,
            "elapsed_seconds": elapsed_seconds,
        }
        completed_since_checkpoint += 1
        if completed_since_checkpoint == checkpoint_every:
            _write_checkpoint(checkpoint_path, checkpoint)
            completed_since_checkpoint = 0

    _write_checkpoint(checkpoint_path, checkpoint)
    return list(predictions.values()), taxonomy
