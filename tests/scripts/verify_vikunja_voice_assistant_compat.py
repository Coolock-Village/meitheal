#!/usr/bin/env python3
"""Run a protocol validation sequence using NeoHuncho/vikunja-voice-assistant client code."""

from __future__ import annotations

import json
import importlib.util
import os
import sys
import time
from pathlib import Path


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def require_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        fail(f"Missing required environment variable: {name}")
    return value


def resolve_api_base(base_url: str) -> str:
    normalized = base_url.rstrip("/")
    if normalized.endswith("/api/v1"):
        return normalized
    return f"{normalized}/api/v1"


def load_vikunja_client(source_dir: str):
    module_path = (
        Path(source_dir).expanduser().resolve()
        / "custom_components"
        / "vikunja_voice_assistant"
        / "api"
        / "vikunja_api.py"
    )
    if not module_path.exists():
        fail(f"Invalid VOICE_ASSISTANT_SOURCE_DIR (missing vikunja_api.py): {source_dir}")

    spec = importlib.util.spec_from_file_location("vikunja_voice_assistant.api.vikunja_api", module_path)
    if spec is None or spec.loader is None:
        fail("Unable to build module spec for vikunja_api.py")

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    client = getattr(module, "VikunjaAPI", None)
    if client is None:
        fail("VikunjaAPI class was not found in vikunja_api.py")
    return client


def first_numeric_id(rows: list[dict], fallback: int | None = None) -> int | None:
    for row in rows:
        value = row.get("id")
        if isinstance(value, int):
            return value
    return fallback


def main() -> None:
    source_dir = require_env("VOICE_ASSISTANT_SOURCE_DIR")
    base_url = require_env("MEITHEAL_COMPAT_BASE_URL")
    token = require_env("MEITHEAL_VIKUNJA_TOKEN")

    api_base = resolve_api_base(base_url)
    VikunjaAPI = load_vikunja_client(source_dir)
    client = VikunjaAPI(api_base, token)

    if not client.test_connection():
        fail("voice-assistant connectivity check failed")

    projects = client.get_projects()
    if not isinstance(projects, list) or not projects:
        fail("No projects returned from compatibility API")

    project_id = first_numeric_id(projects, fallback=1)
    if project_id is None:
        fail("Could not resolve a numeric project id")

    project_users = client.get_project_users(project_id)
    if not isinstance(project_users, list):
        fail("Project users response was not a list")

    label_name = f"voice-ci-{int(time.time())}"
    label = client.create_label(label_name)
    if not isinstance(label, dict) or "id" not in label:
        fail("Label creation failed")
    label_id = label.get("id")

    task = client.add_task(
        {
            "title": f"Voice compat task {int(time.time())}",
            "description": "Created by Meitheal live compatibility verifier",
            "project_id": project_id,
            "priority": 3,
            "repeat_after": 0
        }
    )
    if not isinstance(task, dict) or "id" not in task:
        fail("Task creation failed")
    task_id = task.get("id")

    if not client.add_label_to_task(task_id, label_id):
        fail("Failed to attach label to task")

    users = client.search_users("villager", page=1)
    if not isinstance(users, list):
        fail("User search response was not a list")
    user_id = first_numeric_id(users) or first_numeric_id(project_users) or 1

    if not client.assign_user_to_task(task_id, user_id):
        fail("Failed to assign user to task")

    result = {
        "api_base": api_base,
        "project_id": project_id,
        "task_id": task_id,
        "label_id": label_id,
        "user_id": user_id,
    }
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
