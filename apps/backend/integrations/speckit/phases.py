"""
Spec-Kit Phase Structure
========================

Defines the 8-phase implementation structure following spec-kit conventions.
Phases provide a standard progression from project setup through polish,
enabling consistent task organization and progress tracking.

Phase Order:
    0. SETUP - Project Setup
    1. DATA_MODELS - Data Models
    2. CORE_SERVICES - Core Services
    3. API_ENDPOINTS - API/Endpoints
    4. UI_COMPONENTS - UI Components
    5. INTEGRATION - Integration
    6. TESTING - Testing
    7. POLISH - Polish & Documentation
"""

from enum import IntEnum
from typing import Any


class SpecKitPhase(IntEnum):
    """
    8-phase implementation structure for spec-kit.

    Each phase represents a distinct stage of implementation,
    ordered for logical dependency flow.
    """

    SETUP = 0  # Project Setup
    DATA_MODELS = 1  # Data Models
    CORE_SERVICES = 2  # Core Services
    API_ENDPOINTS = 3  # API/Endpoints
    UI_COMPONENTS = 4  # UI Components
    INTEGRATION = 5  # Integration
    TESTING = 6  # Testing
    POLISH = 7  # Polish & Documentation


# Human-readable descriptions for each phase
PHASE_DESCRIPTIONS: dict[SpecKitPhase, str] = {
    SpecKitPhase.SETUP: "Project Setup - Initialize project structure, dependencies, configuration",
    SpecKitPhase.DATA_MODELS: "Data Models - Define schemas, types, database models",
    SpecKitPhase.CORE_SERVICES: "Core Services - Implement business logic, core functionality",
    SpecKitPhase.API_ENDPOINTS: "API/Endpoints - Create API routes, controllers, handlers",
    SpecKitPhase.UI_COMPONENTS: "UI Components - Build frontend components, views, layouts",
    SpecKitPhase.INTEGRATION: "Integration - Connect services, wire up components, end-to-end flows",
    SpecKitPhase.TESTING: "Testing - Write unit tests, integration tests, E2E tests",
    SpecKitPhase.POLISH: "Polish & Documentation - Code cleanup, documentation, final refinements",
}

# Short names for each phase (useful for compact display)
PHASE_SHORT_NAMES: dict[SpecKitPhase, str] = {
    SpecKitPhase.SETUP: "setup",
    SpecKitPhase.DATA_MODELS: "models",
    SpecKitPhase.CORE_SERVICES: "services",
    SpecKitPhase.API_ENDPOINTS: "api",
    SpecKitPhase.UI_COMPONENTS: "ui",
    SpecKitPhase.INTEGRATION: "integration",
    SpecKitPhase.TESTING: "testing",
    SpecKitPhase.POLISH: "polish",
}

# Keywords used to map subtasks to phases
_PHASE_KEYWORDS: dict[SpecKitPhase, list[str]] = {
    SpecKitPhase.SETUP: [
        "setup",
        "init",
        "initialize",
        "install",
        "configure",
        "config",
        "scaffold",
        "bootstrap",
        "dependencies",
        "deps",
        "environment",
        "env",
        "project structure",
        "directory",
        "folder",
    ],
    SpecKitPhase.DATA_MODELS: [
        "model",
        "schema",
        "type",
        "interface",
        "entity",
        "database",
        "db",
        "migration",
        "table",
        "collection",
        "dataclass",
        "pydantic",
        "orm",
        "sqlalchemy",
        "prisma",
        "mongoose",
    ],
    SpecKitPhase.CORE_SERVICES: [
        "service",
        "logic",
        "business",
        "core",
        "manager",
        "handler",
        "processor",
        "engine",
        "worker",
        "utility",
        "helper",
        "algorithm",
        "calculation",
        "validation",
    ],
    SpecKitPhase.API_ENDPOINTS: [
        "api",
        "endpoint",
        "route",
        "controller",
        "rest",
        "graphql",
        "grpc",
        "http",
        "request",
        "response",
        "middleware",
        "authentication",
        "auth",
        "authorization",
    ],
    SpecKitPhase.UI_COMPONENTS: [
        "ui",
        "component",
        "view",
        "page",
        "layout",
        "template",
        "frontend",
        "react",
        "vue",
        "angular",
        "svelte",
        "form",
        "button",
        "modal",
        "dialog",
        "navigation",
        "menu",
        "sidebar",
        "header",
        "footer",
        "css",
        "style",
        "styling",
    ],
    SpecKitPhase.INTEGRATION: [
        "integration",
        "integrate",
        "connect",
        "wire",
        "flow",
        "workflow",
        "pipeline",
        "orchestrate",
        "hook up",
        "end-to-end",
        "e2e",
        "full stack",
        "combine",
    ],
    SpecKitPhase.TESTING: [
        "test",
        "testing",
        "unit test",
        "integration test",
        "e2e test",
        "spec",
        "jest",
        "pytest",
        "mocha",
        "vitest",
        "cypress",
        "playwright",
        "coverage",
        "mock",
        "stub",
        "fixture",
    ],
    SpecKitPhase.POLISH: [
        "polish",
        "document",
        "documentation",
        "readme",
        "comment",
        "cleanup",
        "clean up",
        "refactor",
        "optimize",
        "performance",
        "lint",
        "format",
        "changelog",
        "release",
        "deploy",
        "deployment",
    ],
}


def get_phase_order() -> list[SpecKitPhase]:
    """
    Get phases in standard execution order.

    Returns:
        List of phases ordered from SETUP (0) to POLISH (7)
    """
    return sorted(SpecKitPhase, key=lambda p: p.value)


def get_phase_description(phase: SpecKitPhase) -> str:
    """
    Get human-readable description for a phase.

    Args:
        phase: The phase to describe

    Returns:
        Full description of the phase
    """
    return PHASE_DESCRIPTIONS.get(phase, f"Phase {phase.value}")


def get_phase_short_name(phase: SpecKitPhase) -> str:
    """
    Get short name for a phase.

    Args:
        phase: The phase to name

    Returns:
        Short name suitable for compact display
    """
    return PHASE_SHORT_NAMES.get(phase, str(phase.value))


def map_subtask_to_phase(subtask: dict[str, Any]) -> SpecKitPhase:
    """
    Map a subtask to its appropriate phase based on content analysis.

    Uses keyword matching on subtask name and description to determine
    the most likely phase. Falls back to CORE_SERVICES if no clear match.

    Args:
        subtask: Subtask dictionary with at least a 'name' key

    Returns:
        The SpecKitPhase most appropriate for this subtask
    """
    # Build searchable text from subtask content
    search_text = " ".join([
        subtask.get("name", ""),
        subtask.get("description", ""),
        subtask.get("service", ""),
    ]).lower()

    if not search_text.strip():
        return SpecKitPhase.CORE_SERVICES

    # Score each phase based on keyword matches
    phase_scores: dict[SpecKitPhase, int] = dict.fromkeys(SpecKitPhase, 0)

    for phase, keywords in _PHASE_KEYWORDS.items():
        for keyword in keywords:
            if keyword.lower() in search_text:
                phase_scores[phase] += 1

    # Find phase with highest score
    best_phase = max(phase_scores, key=lambda p: phase_scores[p])

    # If no keywords matched, default to CORE_SERVICES
    if phase_scores[best_phase] == 0:
        return SpecKitPhase.CORE_SERVICES

    return best_phase


def get_tasks_by_phase(tasks: list[dict[str, Any]]) -> dict[SpecKitPhase, list[dict[str, Any]]]:
    """
    Organize tasks into phase buckets.

    Args:
        tasks: List of task dictionaries

    Returns:
        Dictionary mapping phases to their tasks (in original order)
    """
    result: dict[SpecKitPhase, list[dict[str, Any]]] = {
        phase: [] for phase in SpecKitPhase
    }

    for task in tasks:
        phase = map_subtask_to_phase(task)
        result[phase].append(task)

    return result


def get_current_phase(tasks: list[dict[str, Any]]) -> SpecKitPhase:
    """
    Determine the current phase based on task status.

    The current phase is the earliest phase that has pending tasks.
    If all tasks are completed, returns POLISH.

    Args:
        tasks: List of task dictionaries with 'status' field

    Returns:
        The current phase of implementation
    """
    if not tasks:
        return SpecKitPhase.SETUP

    tasks_by_phase = get_tasks_by_phase(tasks)

    for phase in get_phase_order():
        phase_tasks = tasks_by_phase[phase]
        if not phase_tasks:
            continue

        # Check if any task in this phase is pending or in progress
        has_incomplete = any(
            task.get("status", "pending") in ("pending", "in_progress", "blocked")
            for task in phase_tasks
        )

        if has_incomplete:
            return phase

    # All tasks complete
    return SpecKitPhase.POLISH


def get_phase_progress(tasks: list[dict[str, Any]]) -> dict[SpecKitPhase, dict[str, int]]:
    """
    Calculate progress statistics for each phase.

    Args:
        tasks: List of task dictionaries with 'status' field

    Returns:
        Dictionary mapping phases to their progress stats:
        {
            phase: {
                'total': int,
                'completed': int,
                'pending': int,
                'in_progress': int,
                'blocked': int
            }
        }
    """
    tasks_by_phase = get_tasks_by_phase(tasks)
    result: dict[SpecKitPhase, dict[str, int]] = {}

    for phase in SpecKitPhase:
        phase_tasks = tasks_by_phase[phase]
        result[phase] = {
            "total": len(phase_tasks),
            "completed": sum(1 for t in phase_tasks if t.get("status") == "completed"),
            "pending": sum(1 for t in phase_tasks if t.get("status", "pending") == "pending"),
            "in_progress": sum(1 for t in phase_tasks if t.get("status") == "in_progress"),
            "blocked": sum(1 for t in phase_tasks if t.get("status") == "blocked"),
        }

    return result


def is_phase_complete(tasks: list[dict[str, Any]], phase: SpecKitPhase) -> bool:
    """
    Check if all tasks in a phase are completed.

    Args:
        tasks: List of task dictionaries
        phase: The phase to check

    Returns:
        True if all tasks in the phase are completed (or phase has no tasks)
    """
    tasks_by_phase = get_tasks_by_phase(tasks)
    phase_tasks = tasks_by_phase[phase]

    if not phase_tasks:
        return True

    return all(task.get("status") == "completed" for task in phase_tasks)


def get_phase_dependencies(phase: SpecKitPhase) -> list[SpecKitPhase]:
    """
    Get phases that should be completed before the given phase.

    Args:
        phase: The phase to check dependencies for

    Returns:
        List of prerequisite phases (all phases with lower index)
    """
    return [p for p in SpecKitPhase if p.value < phase.value]
