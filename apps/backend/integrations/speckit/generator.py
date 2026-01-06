"""
Spec-Kit Format Generator
=========================

Generates spec-kit format markdown files from Auto-Claude data.
"""

from pathlib import Path
from typing import Any

from .config import SpecKitConfig


class SpecKitGenerator:
    """Generates spec-kit format files from Auto-Claude data."""

    def __init__(self, config: SpecKitConfig | None = None):
        self.config = config or SpecKitConfig()

    def generate_all(
        self,
        spec_dir: Path,
        requirements: dict[str, Any],
        impl_plan: dict[str, Any] | None = None,
        context: dict[str, Any] | None = None,
    ) -> None:
        """Generate all spec-kit format files.

        Args:
            spec_dir: Directory to write files to
            requirements: requirements.json data
            impl_plan: implementation_plan.json data (optional)
            context: context.json data (optional)
        """
        spec_dir.mkdir(parents=True, exist_ok=True)

        # Generate constitution.md from constraints
        constitution_content = self.generate_constitution(requirements, context)
        if constitution_content:
            (spec_dir / self.config.constitution_file).write_text(constitution_content)

        # Generate plan.md from implementation plan
        if impl_plan:
            plan_content = self.generate_plan(impl_plan)
            if plan_content:
                (spec_dir / self.config.plan_file).write_text(plan_content)

            # Generate tasks.md from subtasks
            tasks_content = self.generate_tasks(impl_plan)
            if tasks_content:
                (spec_dir / self.config.tasks_file).write_text(tasks_content)

    def generate_constitution(
        self,
        requirements: dict[str, Any],
        context: dict[str, Any] | None = None,
    ) -> str:
        """Generate constitution.md from requirements and context.

        The constitution captures guiding principles and constraints.
        """
        lines = ["# Constitution", ""]

        # Extract constraints from requirements
        constraints = requirements.get("constraints", [])
        non_goals = requirements.get("non_goals", [])

        if constraints or non_goals:
            lines.append("## Constraints")
            lines.append("")
            for constraint in constraints:
                lines.append(f"- {constraint}")
            lines.append("")

        if non_goals:
            lines.append("## Non-Goals")
            lines.append("")
            for non_goal in non_goals:
                lines.append(f"- {non_goal}")
            lines.append("")

        # Add workflow type if specified
        workflow_type = requirements.get("workflow_type")
        if workflow_type:
            lines.append("## Workflow")
            lines.append("")
            lines.append(f"**Type**: {workflow_type}")
            lines.append("")

        # Only return content if we have something meaningful
        if len(lines) > 2:
            return "\n".join(lines)
        return ""

    def generate_plan(self, impl_plan: dict[str, Any]) -> str:
        """Generate plan.md from implementation plan.

        Captures the implementation approach and phase structure.
        """
        lines = ["# Implementation Plan", ""]

        # Add overview
        spec_name = impl_plan.get("spec_name", "")
        if spec_name:
            lines.append(f"**Spec**: {spec_name}")
            lines.append("")

        # Add progress summary
        total = impl_plan.get("total_subtasks", 0)
        completed = impl_plan.get("completed_subtasks", 0)
        if total > 0:
            lines.append(f"**Progress**: {completed}/{total} subtasks completed")
            lines.append("")

        # Add subtask overview by phase/group
        subtasks = impl_plan.get("subtasks", [])
        if subtasks:
            lines.append("## Phases")
            lines.append("")

            # Group subtasks by phase or parent
            current_phase = None
            for subtask in subtasks:
                phase = subtask.get("phase", subtask.get("parent_task"))
                if phase != current_phase:
                    current_phase = phase
                    if phase:
                        lines.append(f"### Phase {phase}")
                        lines.append("")

                name = subtask.get("name", "")
                status = subtask.get("status", "pending")
                status_icon = "x" if status == "completed" else " "
                lines.append(f"- [{status_icon}] {name}")

            lines.append("")

        return "\n".join(lines)

    def generate_tasks(self, impl_plan: dict[str, Any]) -> str:
        """Generate tasks.md from implementation plan subtasks.

        Creates a checkbox-based task list.
        """
        lines = ["# Tasks", ""]

        subtasks = impl_plan.get("subtasks", [])
        if not subtasks:
            return ""

        # Add progress header
        total = impl_plan.get("total_subtasks", len(subtasks))
        completed = impl_plan.get("completed_subtasks", 0)
        lines.append(f"Progress: {completed}/{total} completed")
        lines.append("")

        # Generate task list
        current_parent = None
        for subtask in subtasks:
            subtask_id = subtask.get("id", "")
            name = subtask.get("name", "")
            status = subtask.get("status", "pending")
            parent = subtask.get("parent_task")

            # Check if this is a nested subtask (has parent)
            if parent and parent != current_parent:
                current_parent = parent
                # Find parent name if available
                parent_name = name.split(":")[0] if ":" in name else f"Task {parent}"
                status_icon = "x" if status == "completed" else " "
                lines.append(f"## [{status_icon}] {parent_name}")
                lines.append("")

            # Add subtask
            status_icon = "x" if status == "completed" else " "
            service = subtask.get("service", "")
            service_tag = f" `[{service}]`" if service else ""
            lines.append(f"- [{status_icon}] {name}{service_tag}")

        lines.append("")
        return "\n".join(lines)
