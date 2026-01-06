"""
Spec-Kit Context Builder
========================

Builds context for agent sessions from spec-kit documents and implementation state.
Provides structured context about the current task, phase, and project constraints
for use in agent prompts.

Integrates with the 8-phase structure defined in phases.py:
    0. SETUP - Project Setup
    1. DATA_MODELS - Data Models
    2. CORE_SERVICES - Core Services
    3. API_ENDPOINTS - API/Endpoints
    4. UI_COMPONENTS - UI Components
    5. INTEGRATION - Integration
    6. TESTING - Testing
    7. POLISH - Polish & Documentation
"""

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from .constitution import ConstitutionManager
from .manager import SpecKitManager
from .phases import (
    PHASE_DESCRIPTIONS,
    SpecKitPhase,
    get_current_phase,
    get_phase_description,
    get_phase_progress,
    get_tasks_by_phase,
)


@dataclass
class SpecKitContext:
    """
    Context built from spec-kit documents for agent sessions.

    Contains all relevant context from the project constitution, feature spec,
    implementation plan, and current task state. Aligns with the 8-phase
    implementation structure.
    """

    # Primary content fields (aligned with requested interface)
    constitution: str = ""  # Raw constitution.md content
    spec: str = ""  # spec.md content
    plan: str = ""  # plan.md or implementation_plan summary
    tasks: list[dict[str, Any]] = field(default_factory=list)  # All subtasks
    current_phase: int = 0  # Current phase number (0-7)
    current_task: dict[str, Any] | None = None  # Current task being worked on

    # Additional constitution context
    principles: list[str] = field(default_factory=list)
    constraints: list[str] = field(default_factory=list)
    non_negotiables: list[str] = field(default_factory=list)

    # Additional spec context
    acceptance_criteria: list[str] = field(default_factory=list)

    # Plan metadata
    total_phases: int = 8  # Always 8 phases in spec-kit structure
    total_subtasks: int = 0
    completed_subtasks: int = 0

    # Legacy compatibility aliases
    @property
    def constitution_content(self) -> str:
        """Alias for constitution field (legacy compatibility)."""
        return self.constitution

    @property
    def spec_content(self) -> str:
        """Alias for spec field (legacy compatibility)."""
        return self.spec

    @property
    def plan_summary(self) -> str:
        """Alias for plan field (legacy compatibility)."""
        return self.plan

    @property
    def current_phase_number(self) -> int:
        """Alias for current_phase field (legacy compatibility)."""
        return self.current_phase

    @property
    def current_phase_name(self) -> str:
        """Get current phase name from phase number."""
        try:
            phase_enum = SpecKitPhase(self.current_phase)
            return phase_enum.name
        except ValueError:
            return f"PHASE_{self.current_phase}"

    @property
    def current_phase_description(self) -> str:
        """Get current phase description from phase number."""
        try:
            phase_enum = SpecKitPhase(self.current_phase)
            return PHASE_DESCRIPTIONS.get(phase_enum, "")
        except ValueError:
            return ""

    # Current task context (extracted from current_task dict)
    @property
    def current_task_id(self) -> str:
        """Get current task ID."""
        if self.current_task:
            return str(self.current_task.get("id", ""))
        return ""

    @property
    def current_task_description(self) -> str:
        """Get current task description."""
        if self.current_task:
            return self.current_task.get("description", self.current_task.get("name", ""))
        return ""

    @property
    def current_task_files(self) -> list[str]:
        """Get files to modify for current task."""
        if self.current_task:
            return self.current_task.get("files_to_modify", [])
        return []

    # Verification requirements
    @property
    def verification_type(self) -> str:
        """Get verification type for current task."""
        if self.current_task:
            verification = self.current_task.get("verification", {})
            return verification.get("type", "manual")
        return ""

    @property
    def verification_details(self) -> dict[str, Any]:
        """Get verification details for current task."""
        if self.current_task:
            return self.current_task.get("verification", {})
        return {}

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            # Primary fields (aligned with requested interface)
            "constitution": self.constitution,
            "spec": self.spec,
            "plan": self.plan,
            "tasks": self.tasks,
            "current_phase": self.current_phase,
            "current_task": self.current_task,
            # Additional context
            "principles": self.principles,
            "constraints": self.constraints,
            "non_negotiables": self.non_negotiables,
            "acceptance_criteria": self.acceptance_criteria,
            "total_phases": self.total_phases,
            "total_subtasks": self.total_subtasks,
            "completed_subtasks": self.completed_subtasks,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "SpecKitContext":
        """Create SpecKitContext from dictionary."""
        return cls(
            constitution=data.get("constitution", ""),
            spec=data.get("spec", ""),
            plan=data.get("plan", ""),
            tasks=data.get("tasks", []),
            current_phase=data.get("current_phase", 0),
            current_task=data.get("current_task"),
            principles=data.get("principles", []),
            constraints=data.get("constraints", []),
            non_negotiables=data.get("non_negotiables", []),
            acceptance_criteria=data.get("acceptance_criteria", []),
            total_phases=data.get("total_phases", 8),
            total_subtasks=data.get("total_subtasks", 0),
            completed_subtasks=data.get("completed_subtasks", 0),
        )

    def get_phase_context(self, phase: int) -> str:
        """
        Get context filtered to a specific phase.

        Provides focused context for agents working on a specific phase,
        including relevant tasks and progress information.

        Args:
            phase: Phase number (0-7)

        Returns:
            Formatted context for the specified phase
        """
        try:
            phase_enum = SpecKitPhase(phase)
        except ValueError:
            return f"Invalid phase number: {phase}"

        tasks_by_phase = get_tasks_by_phase(self.tasks)
        phase_tasks = tasks_by_phase.get(phase_enum, [])
        phase_progress = get_phase_progress(self.tasks)
        progress = phase_progress.get(phase_enum, {"total": 0, "completed": 0})

        lines = [f"## Phase {phase}: {get_phase_description(phase_enum)}"]

        # Include relevant constitution principles
        if self.constitution:
            lines.append("\n### Relevant Principles")
            lines.append("(From project constitution)")
            # Truncate if too long
            if len(self.constitution) > 500:
                lines.append(self.constitution[:500] + "...")
            else:
                lines.append(self.constitution)

        # Phase tasks
        lines.append("\n### Phase Tasks")
        if phase_tasks:
            for task in phase_tasks:
                status = task.get("status", "pending")
                status_icon = self._get_status_icon(status)
                name = task.get("name", task.get("description", "Unnamed task"))
                lines.append(f"  {status_icon} {name}")
        else:
            lines.append("  No tasks in this phase")

        # Phase progress
        if progress["total"] > 0:
            lines.append(f"\n**Phase Progress:** {progress['completed']}/{progress['total']} completed")

        return "\n".join(lines)

    @staticmethod
    def _get_status_icon(status: str) -> str:
        """Get icon for task status."""
        icons = {
            "completed": "[x]",
            "in_progress": "[~]",
            "pending": "[ ]",
            "blocked": "[!]",
        }
        return icons.get(status, "[ ]")

    def format_for_prompt(self) -> str:
        """
        Format context for inclusion in agent prompts.

        Returns:
            Formatted markdown string suitable for prompt injection
        """
        sections = []

        # Header
        sections.append("## Spec-Kit Context\n")

        # Project Constitution
        if self.constitution_content:
            sections.append("### Project Constitution\n")
            # Include truncated constitution if too long
            if len(self.constitution_content) > 2000:
                sections.append(self.constitution_content[:2000])
                sections.append("\n... (truncated for brevity)\n")
            else:
                sections.append(self.constitution_content)
            sections.append("")

            # Highlight key principles if extracted
            if self.principles:
                sections.append("**Key Principles:**")
                for principle in self.principles[:5]:  # Top 5
                    sections.append(f"- {principle}")
                sections.append("")

            if self.non_negotiables:
                sections.append("**Non-Negotiables:**")
                for item in self.non_negotiables:
                    sections.append(f"- {item}")
                sections.append("")

        # Feature Specification
        if self.spec_content:
            sections.append("### Feature Specification\n")
            # Include truncated spec if too long
            if len(self.spec_content) > 3000:
                sections.append(self.spec_content[:3000])
                sections.append("\n... (truncated for brevity)\n")
            else:
                sections.append(self.spec_content)
            sections.append("")

        # Implementation Plan Summary
        if self.plan_summary or self.total_phases > 0:
            sections.append("### Implementation Plan\n")
            if self.plan_summary:
                sections.append(self.plan_summary)
                sections.append("")
            sections.append(
                f"**Progress:** {self.completed_subtasks}/{self.total_subtasks} "
                f"subtasks completed across {self.total_phases} phases\n"
            )

        # Current Phase
        if self.current_phase_name:
            sections.append("### Current Phase\n")
            sections.append(
                f"**Phase {self.current_phase_number}:** {self.current_phase_name}\n"
            )
            if self.current_phase_description:
                sections.append(self.current_phase_description)
                sections.append("")

        # Current Task
        if self.current_task_id:
            sections.append("### Current Task\n")
            sections.append(f"**Task:** {self.current_task_id}\n")
            if self.current_task_description:
                sections.append(self.current_task_description)
                sections.append("")

            if self.current_task_files:
                sections.append("**Files to modify:**")
                for f in self.current_task_files:
                    sections.append(f"- `{f}`")
                sections.append("")

            if self.completed_dependencies:
                sections.append("**Completed dependencies:**")
                for dep in self.completed_dependencies:
                    sections.append(f"- {dep}")
                sections.append("")

        # Verification Requirements
        if self.verification_type:
            sections.append("### Verification Requirements\n")
            sections.append(f"**Type:** {self.verification_type}\n")
            if self.verification_details:
                if self.verification_type == "command":
                    cmd = self.verification_details.get("command", "")
                    expected = self.verification_details.get("expected", "Success")
                    sections.append(f"```bash\n{cmd}\n```")
                    sections.append(f"Expected: {expected}\n")
                elif self.verification_type == "api":
                    method = self.verification_details.get("method", "GET")
                    url = self.verification_details.get("url", "")
                    sections.append(f"Endpoint: `{method} {url}`\n")
                elif "checks" in self.verification_details:
                    sections.append("**Checks:**")
                    for check in self.verification_details.get("checks", []):
                        sections.append(f"- [ ] {check}")
                    sections.append("")

        # Separator
        sections.append("---\n")
        sections.append(
            "*All implementation decisions should align with the constitution "
            "principles and constraints above.*\n"
        )

        return "\n".join(sections)


class SpecKitContextBuilder:
    """
    Builds SpecKitContext from project and spec files.

    Aggregates context from:
    - Project constitution (.specify/memory/constitution.md)
    - Spec files (spec.md)
    - Implementation plan (implementation_plan.json)
    - Current task state

    Integrates with the 8-phase structure from phases.py.
    """

    def __init__(self, project_dir: Path, spec_dir: Path | None = None):
        """
        Initialize context builder.

        Args:
            project_dir: Project root directory
            spec_dir: Spec directory for current feature (optional)
        """
        self.project_dir = Path(project_dir)
        self.spec_dir = Path(spec_dir) if spec_dir else None
        self.constitution_manager = ConstitutionManager(project_dir)
        self._speckit_manager: SpecKitManager | None = None

    @property
    def speckit_manager(self) -> SpecKitManager | None:
        """Lazy-load SpecKitManager only when spec_dir is available."""
        if self._speckit_manager is None and self.spec_dir:
            self._speckit_manager = SpecKitManager(self.spec_dir, self.project_dir)
        return self._speckit_manager

    def build(
        self,
        current_subtask: dict[str, Any] | None = None,
        current_phase: dict[str, Any] | None = None,
    ) -> SpecKitContext:
        """
        Build complete context from all available sources.

        Args:
            current_subtask: The current subtask being worked on
            current_phase: The current phase containing the subtask

        Returns:
            SpecKitContext with all available information
        """
        ctx = SpecKitContext()

        # Load constitution
        self._load_constitution(ctx)

        # Load spec content
        if self.spec_dir:
            self._load_spec(ctx)

        # Load implementation plan and tasks
        if self.spec_dir:
            self._load_plan(ctx)

        # Determine current phase from task status if not provided
        if current_phase:
            self._set_phase_from_dict(ctx, current_phase)
        elif ctx.tasks:
            # Auto-determine phase from task status
            ctx.current_phase = get_current_phase(ctx.tasks).value

        # Set current task
        if current_subtask:
            ctx.current_task = current_subtask
        elif ctx.tasks:
            # Find first in_progress or pending task
            ctx.current_task = self._find_current_task(ctx.tasks)

        return ctx

    def _load_constitution(self, ctx: SpecKitContext) -> None:
        """Load constitution content and extracted data."""
        if self.constitution_manager.exists:
            ctx.constitution = self.constitution_manager.load()
            ctx.principles = self.constitution_manager.extract_principles()
            ctx.constraints = self.constitution_manager.extract_constraints()
            ctx.non_negotiables = self.constitution_manager.extract_non_negotiables()

    def _load_spec(self, ctx: SpecKitContext) -> None:
        """Load spec.md content."""
        if not self.spec_dir:
            return

        spec_file = self.spec_dir / "spec.md"
        if spec_file.exists():
            ctx.spec = spec_file.read_text(encoding="utf-8")

        # Also try to load acceptance criteria from requirements.json
        req_file = self.spec_dir / "requirements.json"
        if req_file.exists():
            try:
                req_data = json.loads(req_file.read_text(encoding="utf-8"))
                ctx.acceptance_criteria = req_data.get("acceptance_criteria", [])
            except (json.JSONDecodeError, OSError):
                pass

    def _load_plan(self, ctx: SpecKitContext) -> None:
        """Load implementation plan, tasks, and summary."""
        if not self.spec_dir:
            return

        plan_file = self.spec_dir / "implementation_plan.json"
        if not plan_file.exists():
            # Try plan.md as fallback
            self._load_plan_md(ctx)
            return

        try:
            plan_data = json.loads(plan_file.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            return

        # Extract all subtasks
        all_subtasks: list[dict[str, Any]] = []

        # Check for subtasks at root level (flat structure)
        if "subtasks" in plan_data:
            all_subtasks = plan_data["subtasks"]
        else:
            # Check for phases structure
            phases = plan_data.get("phases", [])
            ctx.total_phases = len(phases) if phases else 8

            for phase in phases:
                subtasks = phase.get("subtasks", [])
                all_subtasks.extend(subtasks)

        ctx.tasks = all_subtasks
        ctx.total_subtasks = len(all_subtasks)
        ctx.completed_subtasks = sum(
            1 for s in all_subtasks if s.get("status") == "completed"
        )

        # Build plan summary
        summary_parts = []
        if plan_data.get("workflow_type"):
            summary_parts.append(f"Workflow: {plan_data['workflow_type']}")
        if plan_data.get("spec_name"):
            summary_parts.append(f"Feature: {plan_data['spec_name']}")
        if plan_data.get("approach"):
            summary_parts.append(f"Approach: {plan_data['approach']}")
        if summary_parts:
            ctx.plan = " | ".join(summary_parts)

    def _load_plan_md(self, ctx: SpecKitContext) -> None:
        """Load plan.md as fallback."""
        if not self.spec_dir:
            return

        plan_md = self.spec_dir / "plan.md"
        if plan_md.exists():
            ctx.plan = plan_md.read_text(encoding="utf-8")

    def _set_phase_from_dict(
        self, ctx: SpecKitContext, phase: dict[str, Any]
    ) -> None:
        """Set current phase from phase dictionary."""
        # Extract phase number from id if available
        phase_id = phase.get("id", "")
        if phase_id.startswith("phase-"):
            try:
                ctx.current_phase = int(phase_id.split("-")[1])
                return
            except (ValueError, IndexError):
                pass

        # Try to get phase number directly
        if "number" in phase:
            ctx.current_phase = int(phase["number"])
        elif "phase" in phase:
            ctx.current_phase = int(phase["phase"])

    def _find_current_task(
        self, tasks: list[dict[str, Any]]
    ) -> dict[str, Any] | None:
        """Find the current task being worked on.

        Priority:
        1. Task with status 'in_progress'
        2. First task with status 'pending'
        """
        # First look for in_progress
        for task in tasks:
            if task.get("status") == "in_progress":
                return task

        # Then look for first pending
        for task in tasks:
            if task.get("status", "pending") == "pending":
                return task

        return None


def get_speckit_context_builder(
    project_dir: Path,
    spec_dir: Path | None = None,
) -> SpecKitContextBuilder:
    """
    Factory function to create a SpecKitContextBuilder.

    Args:
        project_dir: Project root directory
        spec_dir: Spec directory for current feature (optional)

    Returns:
        Configured SpecKitContextBuilder instance
    """
    return SpecKitContextBuilder(project_dir, spec_dir)


def get_speckit_context(
    project_dir: Path,
    spec_dir: Path | None = None,
    current_subtask: dict[str, Any] | None = None,
    current_phase: dict[str, Any] | None = None,
) -> SpecKitContext:
    """
    Factory function to build a SpecKitContext directly.

    Convenience function that creates a builder and immediately builds context.

    Args:
        project_dir: Project root directory
        spec_dir: Spec directory for current feature (optional)
        current_subtask: The current subtask being worked on
        current_phase: The current phase containing the subtask

    Returns:
        Populated SpecKitContext
    """
    builder = SpecKitContextBuilder(project_dir, spec_dir)
    return builder.build(current_subtask, current_phase)
