from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
COURSE_PATH = ROOT / "curriculum" / "russian" / "a1-course.json"
STAGE_PATH = ROOT / "curriculum" / "russian" / "stage-one-data.ts"
REQUIRED_TIERS = {"survival-core", "high-frequency-core", "supporting-breadth"}
REQUIRED_SKILLS = {"recognition", "listening", "production", "speaking"}


def stage_items() -> dict[int, dict[str, str]]:
    source = STAGE_PATH.read_text()
    raw = source[: source.index("];\n\nconst sections")]
    rows = re.findall(r'\["([^"]*)", "([^"]*)", "([^"]*)"\]', raw)
    return {
        index: {"ru": ru, "pron": pron, "en": en}
        for index, (ru, pron, en) in enumerate(rows, 1)
    }


def load_and_validate(path: Path = COURSE_PATH) -> dict[str, Any]:
    data = json.loads(path.read_text())
    errors: list[str] = []
    if data.get("schemaVersion") != 1:
        errors.append("schemaVersion must be 1")
    course = data.get("course") or {}
    for key in ("id", "language", "level", "title"):
        if not course.get(key):
            errors.append(f"course.{key} is required")
    tiers = data.get("paretoTiers") or []
    tier_ids = {tier.get("id") for tier in tiers}
    if tier_ids != REQUIRED_TIERS:
        errors.append(f"paretoTiers must be exactly {sorted(REQUIRED_TIERS)}")
    units = data.get("units") or []
    unit_ids = [unit.get("id") for unit in units]
    if len(unit_ids) != len(set(unit_ids)):
        errors.append("unit IDs must be unique")
    if not unit_ids:
        errors.append("at least one unit is required")
    source = stage_items()
    survival_ids = data.get("survivalCoreIds") or []
    if len(survival_ids) < 30:
        errors.append("survivalCoreIds must contain at least 30 items")
    if len(survival_ids) != len(set(survival_ids)):
        errors.append("survivalCoreIds must be unique")
    if any(item_id not in source for item_id in survival_ids):
        errors.append("survivalCoreIds must reference existing Stage 1 item IDs")
    items = data.get("items") or []
    item_ids: list[int] = []
    for item in items:
        item_id = item.get("sourceItemId")
        item_ids.append(item_id)
        if item_id not in source:
            errors.append(f"item sourceItemId {item_id!r} is not in Stage 1 data")
        if item.get("paretoTier") not in REQUIRED_TIERS:
            errors.append(f"item {item_id!r} has an invalid paretoTier")
        if not item.get("unitIds"):
            errors.append(f"item {item_id!r} must reference at least one unit")
        if any(unit_id not in unit_ids for unit_id in item.get("unitIds", [])):
            errors.append(f"item {item_id!r} references an unknown unit")
        if not REQUIRED_SKILLS.issuperset(item.get("skills", [])):
            errors.append(f"item {item_id!r} has an unsupported skill")
    if len(item_ids) != len(set(item_ids)):
        errors.append("items must contain each sourceItemId once")
    if set(survival_ids) - {item.get("sourceItemId") for item in items}:
        errors.append("every survivalCoreId must have an item metadata record")
    for item in items:
        if item.get("paretoTier") == "survival-core" and item.get("sourceItemId") not in survival_ids:
            errors.append(f"survival-tier item {item.get('sourceItemId')} is missing from survivalCoreIds")
    if len(items) != len(source):
        errors.append(f"items must cover all {len(source)} Stage 1 entries; found {len(items)}")
    unit_content_all = data.get("unitContent") or {}
    required_unit_content = ("u02-greetings-introductions", "u03-numbers-time", "u04-people-family", "u05-home-objects")
    for unit_key in required_unit_content:
        unit_content = unit_content_all.get(unit_key)
        if not unit_content:
            errors.append(f"unitContent.{unit_key} is required")
            continue
        for key in ("activities", "vocabulary", "patterns", "grammar", "dialogue", "story", "checkpoint", "completionEvidence"):
            if not unit_content.get(key):
                errors.append(f"{unit_key}.{key} is required")
        if len(unit_content.get("vocabulary", [])) < 12:
            errors.append(f"{unit_key} must contain at least 12 vocabulary items")
        if len(unit_content.get("activities", [])) < 5:
            errors.append(f"{unit_key} must contain at least 5 lesson activities")
        if len(unit_content.get("dialogue", {}).get("turns", [])) < 3:
            errors.append(f"{unit_key} dialogue must contain at least 3 turns")
        if len(unit_content.get("story", {}).get("lines", [])) < 3:
            errors.append(f"{unit_key} story must contain at least 3 lines")
        if len(unit_content.get("checkpoint", {}).get("questions", [])) < 3:
            errors.append(f"{unit_key} checkpoint must contain at least 3 questions")
        for question in unit_content.get("checkpoint", {}).get("questions", []):
            if not question.get("id") or not question.get("options") or question.get("answer") not in question.get("options", []):
                errors.append(f"{unit_key} checkpoint question {question.get('id')!r} must have options containing its answer")
        if unit_key == "u05-home-objects":
            recycling = unit_content.get("recycling") or {}
            if len(recycling.get("sources", [])) < 3:
                errors.append("u05-home-objects recycling must cite Units 2, 3, and 4")
            source_ids = {source.get("unitId") for source in recycling.get("sources", [])}
            if source_ids != {"u02-greetings-introductions", "u03-numbers-time", "u04-people-family"}:
                errors.append("u05-home-objects recycling sources must be exactly Units 2, 3, and 4")
            if len(recycling.get("listeningContrasts", [])) < 3:
                errors.append("u05-home-objects needs at least 3 listening contrasts")
            checkpoint = unit_content.get("checkpoint", {})
            if not checkpoint.get("isCumulative") or set(checkpoint.get("sourceUnits", [])) != source_ids:
                errors.append("u05-home-objects checkpoint must be cumulative across Units 2, 3, and 4")
    if errors:
        raise ValueError("Course content validation failed:\n- " + "\n- ".join(errors))
    return data


if __name__ == "__main__":
    content = load_and_validate()
    tiers = {tier["id"]: tier for tier in content["paretoTiers"]}
    counts = {tier_id: 0 for tier_id in tiers}
    for item in content["items"]:
        counts[item["paretoTier"]] += 1
    print(f"Validated {len(content['items'])} Stage 1 items across {len(content['units'])} units")
    print("Pareto tiers: " + ", ".join(f"{key}={value}" for key, value in counts.items()))
    print(f"Survival core: {len(content['survivalCoreIds'])} items")
