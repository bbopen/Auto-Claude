"""
Spec-Kit Constitution Manager
=============================

Manages project-level constitution for spec-kit integration.
The constitution defines project principles, guardrails, and governance rules
that guide all specification and implementation decisions.

Location: .specify/memory/constitution.md (spec-kit standard)
"""

from pathlib import Path
from typing import Any

# Default constitution template based on spec-kit conventions
DEFAULT_CONSTITUTION_TEMPLATE = """# Project Constitution

## Purpose
[Describe the core purpose and mission of this project]

## Guiding Principles

### Code Quality
- [ ] Follow established coding standards and conventions
- [ ] Maintain comprehensive test coverage
- [ ] Document public APIs and complex logic
- [ ] Keep functions focused and single-purpose

### Architecture
- [ ] Favor composition over inheritance
- [ ] Maintain clear separation of concerns
- [ ] Use dependency injection for testability
- [ ] Keep modules loosely coupled

### Security
- [ ] Validate all user inputs
- [ ] Sanitize outputs to prevent injection attacks
- [ ] Follow principle of least privilege
- [ ] Never commit secrets or credentials

### Performance
- [ ] Optimize only after measuring
- [ ] Consider scalability implications
- [ ] Use appropriate data structures
- [ ] Minimize external dependencies

## Constraints

### Technical Constraints
- [List technical constraints: languages, frameworks, compatibility requirements]

### Business Constraints
- [List business constraints: timelines, budget, compliance requirements]

### Non-Negotiables
- [List absolute requirements that cannot be compromised]

## Decision Guidelines

When facing implementation decisions:
1. Prioritize simplicity over cleverness
2. Choose well-tested solutions over novel approaches
3. Consider maintenance burden of each choice
4. Document rationale for significant decisions

## Review Checklist

Before any spec is approved, verify:
- [ ] Aligns with guiding principles
- [ ] Respects all constraints
- [ ] Has clear acceptance criteria
- [ ] Includes testing strategy
"""


class ConstitutionManager:
    """
    Manages the project constitution for spec-kit integration.

    The constitution is stored at .specify/memory/constitution.md following
    spec-kit conventions. It provides project-wide principles and guardrails
    that guide all specification and implementation decisions.
    """

    # Standard spec-kit location for constitution
    CONSTITUTION_PATH = ".specify/memory/constitution.md"

    def __init__(self, project_dir: Path):
        """
        Initialize constitution manager.

        Args:
            project_dir: Project root directory
        """
        self.project_dir = Path(project_dir)
        self._constitution_path = self.project_dir / self.CONSTITUTION_PATH
        self._cached_content: str | None = None

    @property
    def constitution_path(self) -> Path:
        """Get the full path to the constitution file."""
        return self._constitution_path

    @property
    def exists(self) -> bool:
        """Check if constitution file exists."""
        return self._constitution_path.exists()

    def ensure_directory(self) -> None:
        """Ensure the .specify/memory directory exists."""
        self._constitution_path.parent.mkdir(parents=True, exist_ok=True)

    def load(self, use_cache: bool = True) -> str:
        """
        Load constitution content from file.

        Args:
            use_cache: If True, return cached content if available

        Returns:
            Constitution content as string, or empty string if not found
        """
        if use_cache and self._cached_content is not None:
            return self._cached_content

        if not self.exists:
            return ""

        content = self._constitution_path.read_text(encoding="utf-8")
        self._cached_content = content
        return content

    def save(self, content: str) -> None:
        """
        Save constitution content to file.

        Args:
            content: Constitution content to save
        """
        self.ensure_directory()
        self._constitution_path.write_text(content, encoding="utf-8")
        self._cached_content = content

    def initialize(self, force: bool = False) -> bool:
        """
        Initialize constitution with default template.

        Args:
            force: If True, overwrite existing constitution

        Returns:
            True if constitution was created, False if already exists
        """
        if self.exists and not force:
            return False

        self.save(DEFAULT_CONSTITUTION_TEMPLATE)
        return True

    def get_or_create(self) -> str:
        """
        Get constitution content, creating default if not exists.

        Returns:
            Constitution content
        """
        if not self.exists:
            self.initialize()
        return self.load()

    def clear_cache(self) -> None:
        """Clear cached constitution content."""
        self._cached_content = None

    def extract_principles(self) -> list[str]:
        """
        Extract guiding principles from constitution.

        Returns:
            List of principle statements
        """
        content = self.load()
        if not content:
            return []

        principles = []
        in_principles_section = False

        for line in content.split("\n"):
            line = line.strip()

            # Detect principles section
            if "## Guiding Principles" in line or "## Principles" in line:
                in_principles_section = True
                continue

            # Exit on next major section
            if in_principles_section and line.startswith("## "):
                break

            # Extract checked/unchecked items
            if in_principles_section and (
                line.startswith("- [") or line.startswith("* [")
            ):
                # Remove checkbox and extract text
                if "] " in line:
                    principle = line.split("] ", 1)[1].strip()
                    if principle:
                        principles.append(principle)

        return principles

    def extract_constraints(self) -> list[str]:
        """
        Extract constraints from constitution.

        Returns:
            List of constraint statements
        """
        content = self.load()
        if not content:
            return []

        constraints = []
        in_constraints_section = False

        for line in content.split("\n"):
            line = line.strip()

            # Detect constraints section
            if "## Constraints" in line:
                in_constraints_section = True
                continue

            # Exit on next major section
            if in_constraints_section and line.startswith("## "):
                break

            # Extract list items
            if in_constraints_section and (
                line.startswith("- ") or line.startswith("* ")
            ):
                constraint = line[2:].strip()
                # Skip placeholder text
                if constraint and not constraint.startswith("["):
                    constraints.append(constraint)

        return constraints

    def extract_non_negotiables(self) -> list[str]:
        """
        Extract non-negotiable requirements from constitution.

        Returns:
            List of non-negotiable statements
        """
        content = self.load()
        if not content:
            return []

        non_negotiables = []
        in_non_negotiables = False

        for line in content.split("\n"):
            line = line.strip()

            # Detect non-negotiables section
            if "### Non-Negotiables" in line or "## Non-Negotiables" in line:
                in_non_negotiables = True
                continue

            # Exit on next section
            if in_non_negotiables and (
                line.startswith("## ") or line.startswith("### ")
            ):
                break

            # Extract list items
            if in_non_negotiables and (line.startswith("- ") or line.startswith("* ")):
                item = line[2:].strip()
                # Skip placeholder text
                if item and not item.startswith("["):
                    non_negotiables.append(item)

        return non_negotiables

    def to_context_dict(self) -> dict[str, Any]:
        """
        Convert constitution to a context dictionary for agents.

        Returns:
            Dictionary with constitution content and extracted sections
        """
        content = self.load()

        return {
            "raw_content": content,
            "exists": self.exists,
            "path": str(self._constitution_path),
            "principles": self.extract_principles(),
            "constraints": self.extract_constraints(),
            "non_negotiables": self.extract_non_negotiables(),
        }

    def format_for_prompt(self) -> str:
        """
        Format constitution for inclusion in agent prompts.

        Returns:
            Formatted constitution string for prompts
        """
        content = self.load()
        if not content:
            return "No project constitution defined."

        return f"""## Project Constitution

{content}

---
Note: All implementation decisions should align with the above principles and constraints.
"""


def get_constitution_manager(project_dir: Path) -> ConstitutionManager:
    """
    Factory function to create a ConstitutionManager.

    Args:
        project_dir: Project root directory

    Returns:
        Configured ConstitutionManager instance
    """
    return ConstitutionManager(project_dir)
