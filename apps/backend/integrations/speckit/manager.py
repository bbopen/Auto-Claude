"""
Spec-Kit Format Manager
=======================

Manages spec-kit format integration for Auto-Claude specs.
Follows the same pattern as LinearManager for consistency.

The integration is OPTIONAL - if SPECKIT_ENABLED is not set, all operations
gracefully no-op and Auto-Claude continues with its native JSON format.
"""

import json
from pathlib import Path
from typing import Any

from .config import SpecKitConfig
from .format import SpecKitDocument
from .generator import SpecKitGenerator
from .parser import SpecKitParser


class SpecKitManager:
    """
    Manages spec-kit format integration for an Auto-Claude spec.

    This class provides a high-level interface for:
    - Detecting spec-kit format input files
    - Parsing spec-kit documents into structured data
    - Generating spec-kit format output from Auto-Claude data
    - Converting between formats

    All operations are idempotent and gracefully handle spec-kit being unavailable.
    """

    def __init__(self, spec_dir: Path, project_dir: Path):
        """
        Initialize spec-kit manager.

        Args:
            spec_dir: Spec directory (contains spec files)
            project_dir: Project root directory
        """
        self.spec_dir = spec_dir
        self.project_dir = project_dir
        self.config = SpecKitConfig.from_env()
        self.parser = SpecKitParser(self.config)
        self.generator = SpecKitGenerator(self.config)

    @property
    def is_enabled(self) -> bool:
        """Check if spec-kit format integration is enabled."""
        return self.config.is_valid()

    @property
    def should_generate_output(self) -> bool:
        """Check if spec-kit output files should be generated."""
        return self.is_enabled and self.config.generate_output

    @property
    def has_speckit_input(self) -> bool:
        """Check if spec directory has spec-kit format input files.

        Returns True if any spec-kit format files exist (constitution.md,
        plan.md, or tasks.md - not spec.md since Auto-Claude also uses that).
        """
        speckit_files = [
            self.config.constitution_file,
            self.config.plan_file,
            self.config.tasks_file,
        ]
        return any((self.spec_dir / f).exists() for f in speckit_files)

    def load_document(self) -> SpecKitDocument | None:
        """Load spec-kit format files from spec directory.

        Returns:
            SpecKitDocument with parsed content, or None if no files found
        """
        if not self.spec_dir.exists():
            return None

        doc = self.parser.parse_directory(self.spec_dir)
        if doc.has_content():
            return doc
        return None

    def generate_output(
        self,
        requirements: dict[str, Any] | None = None,
        impl_plan: dict[str, Any] | None = None,
        context: dict[str, Any] | None = None,
    ) -> None:
        """Generate spec-kit format files from Auto-Claude data.

        Args:
            requirements: requirements.json data
            impl_plan: implementation_plan.json data
            context: context.json data
        """
        if not self.should_generate_output:
            return

        # Load from files if not provided
        if requirements is None:
            req_file = self.spec_dir / "requirements.json"
            if req_file.exists():
                requirements = json.loads(req_file.read_text())
            else:
                requirements = {}

        if impl_plan is None:
            plan_file = self.spec_dir / "implementation_plan.json"
            if plan_file.exists():
                impl_plan = json.loads(plan_file.read_text())

        if context is None:
            ctx_file = self.spec_dir / "context.json"
            if ctx_file.exists():
                context = json.loads(ctx_file.read_text())

        self.generator.generate_all(
            self.spec_dir,
            requirements or {},
            impl_plan,
            context,
        )

    def convert_to_requirements(self, doc: SpecKitDocument) -> dict[str, Any]:
        """Convert spec-kit document to Auto-Claude requirements format.

        Args:
            doc: Parsed spec-kit document

        Returns:
            Dictionary suitable for requirements.json
        """
        return {
            "task_description": doc.overview or doc.title,
            "acceptance_criteria": doc.acceptance_criteria,
            "constraints": doc.constraints,
            "source": {
                "type": "speckit",
                "has_constitution": doc.constitution is not None,
                "has_plan": doc.plan is not None,
                "has_tasks": len(doc.tasks) > 0,
            },
        }

    def convert_to_impl_plan(self, doc: SpecKitDocument) -> dict[str, Any] | None:
        """Convert spec-kit tasks to Auto-Claude implementation plan format.

        Args:
            doc: Parsed spec-kit document

        Returns:
            Dictionary suitable for implementation_plan.json, or None if no tasks
        """
        if not doc.tasks:
            return None

        subtasks = []
        for idx, task in enumerate(doc.tasks, start=1):
            subtask = {
                "id": idx,
                "name": task.description,
                "status": "completed" if task.completed else "pending",
                "service": "backend",  # Default, can be overridden
                "dependencies": [],
            }

            # Add nested subtasks
            for sub_idx, sub in enumerate(task.subtasks, start=1):
                subtasks.append(
                    {
                        "id": f"{idx}.{sub_idx}",
                        "name": sub.description,
                        "status": "completed" if sub.completed else "pending",
                        "service": "backend",
                        "dependencies": [idx]
                        if sub_idx == 1
                        else [f"{idx}.{sub_idx - 1}"],
                        "parent_task": idx,
                    }
                )

            # Only add main task if it has no subtasks (otherwise subtasks replace it)
            if not task.subtasks:
                subtasks.append(subtask)

        completed = len([s for s in subtasks if s["status"] == "completed"])

        return {
            "spec_name": doc.title.lower().replace(" ", "-")
            if doc.title
            else "speckit-import",
            "total_subtasks": len(subtasks),
            "completed_subtasks": completed,
            "current_subtask": next(
                (s["id"] for s in subtasks if s["status"] == "pending"), None
            ),
            "subtasks": subtasks,
            "source": "speckit",
        }


def get_speckit_manager(spec_dir: Path, project_dir: Path) -> SpecKitManager:
    """Factory function to create a SpecKitManager.

    Args:
        spec_dir: Spec directory
        project_dir: Project root directory

    Returns:
        Configured SpecKitManager instance
    """
    return SpecKitManager(spec_dir, project_dir)
