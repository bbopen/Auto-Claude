"""
Spec-Kit Format Parser
======================

Parses spec-kit format markdown files into structured data.
"""

import re
from pathlib import Path

from .config import SpecKitConfig
from .format import SpecKitDocument, Task


class SpecKitParser:
    """Parses spec-kit format markdown files."""

    def __init__(self, config: SpecKitConfig | None = None):
        self.config = config or SpecKitConfig()

    def parse_directory(self, spec_dir: Path) -> SpecKitDocument:
        """Parse all spec-kit files from a directory.

        Args:
            spec_dir: Directory containing spec-kit files

        Returns:
            SpecKitDocument with parsed content
        """
        doc = SpecKitDocument()

        # Parse constitution.md
        constitution_path = spec_dir / self.config.constitution_file
        if constitution_path.exists():
            doc.constitution = constitution_path.read_text()
            doc.constraints = self._extract_constraints(doc.constitution)

        # Parse spec.md
        spec_path = spec_dir / self.config.spec_file
        if spec_path.exists():
            doc.spec = spec_path.read_text()
            doc.title = self._extract_title(doc.spec)
            doc.overview = self._extract_overview(doc.spec)
            doc.acceptance_criteria = self._extract_acceptance_criteria(doc.spec)

        # Parse plan.md
        plan_path = spec_dir / self.config.plan_file
        if plan_path.exists():
            doc.plan = plan_path.read_text()

        # Parse tasks.md
        tasks_path = spec_dir / self.config.tasks_file
        if tasks_path.exists():
            tasks_content = tasks_path.read_text()
            doc.tasks = self._parse_tasks(tasks_content)

        return doc

    def _extract_title(self, content: str) -> str:
        """Extract title from spec content."""
        # Look for # Title or # Specification: Title
        match = re.search(r"^#\s*(?:Specification:\s*)?(.+?)$", content, re.MULTILINE)
        if match:
            return match.group(1).strip()
        return ""

    def _extract_overview(self, content: str) -> str:
        """Extract overview section from spec content."""
        # Look for ## Overview section
        match = re.search(
            r"##\s*Overview\s*\n+(.*?)(?=\n##|\Z)",
            content,
            re.IGNORECASE | re.DOTALL,
        )
        if match:
            return match.group(1).strip()
        return ""

    def _extract_acceptance_criteria(self, content: str) -> list[str]:
        """Extract acceptance criteria from spec content."""
        criteria = []

        # Look for acceptance/success criteria section
        section_match = re.search(
            r"##\s*(?:Acceptance|Success)\s*Criteria\s*\n+(.*?)(?=\n##|\Z)",
            content,
            re.IGNORECASE | re.DOTALL,
        )

        if section_match:
            section = section_match.group(1)
            # Extract bullet points or checkboxes
            for line in section.split("\n"):
                line = line.strip()
                if line.startswith(("-", "*", "[ ]", "[x]")):
                    # Clean up the line
                    cleaned = re.sub(r"^[-*\[\]x\s]+", "", line).strip()
                    if cleaned:
                        criteria.append(cleaned)

        return criteria

    def _extract_constraints(self, content: str) -> list[str]:
        """Extract constraints from constitution content."""
        constraints = []

        # Look for constraints/principles sections
        section_match = re.search(
            r"##\s*(?:Constraints|Principles|Rules)\s*\n+(.*?)(?=\n##|\Z)",
            content,
            re.IGNORECASE | re.DOTALL,
        )

        if section_match:
            section = section_match.group(1)
            # Extract bullet points
            for line in section.split("\n"):
                line = line.strip()
                if line.startswith(("-", "*")):
                    cleaned = re.sub(r"^[-*\s]+", "", line).strip()
                    if cleaned:
                        constraints.append(cleaned)

        return constraints

    def _parse_tasks(self, content: str) -> list[Task]:
        """Parse tasks.md checkbox format into Task objects."""
        tasks = []
        current_task: Task | None = None

        for line in content.split("\n"):
            line_stripped = line.strip()

            # Check for task header (## or ### with checkbox)
            task_match = re.match(
                r"^#{2,3}\s*\[([x\s])\]\s*(.+)", line_stripped, re.IGNORECASE
            )
            if task_match:
                if current_task:
                    tasks.append(current_task)
                completed = task_match.group(1).lower() == "x"
                current_task = Task(
                    description=task_match.group(2).strip(),
                    completed=completed,
                )
                continue

            # Check for subtask (- [ ] or - [x])
            subtask_match = re.match(
                r"^-\s*\[([x\s])\]\s*(.+)", line_stripped, re.IGNORECASE
            )
            if subtask_match and current_task:
                completed = subtask_match.group(1).lower() == "x"
                current_task.subtasks.append(
                    Task(
                        description=subtask_match.group(2).strip(),
                        completed=completed,
                    )
                )

        if current_task:
            tasks.append(current_task)

        return tasks
