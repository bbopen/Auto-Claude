"""
Spec-Kit Document Format
========================

Data structures representing spec-kit format documents.
"""

from dataclasses import dataclass, field


@dataclass
class Task:
    """A task from tasks.md."""

    description: str
    completed: bool = False
    subtasks: list["Task"] = field(default_factory=list)

    def to_dict(self) -> dict:
        """Convert to dictionary representation."""
        return {
            "description": self.description,
            "completed": self.completed,
            "subtasks": [s.to_dict() for s in self.subtasks],
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Task":
        """Create from dictionary."""
        return cls(
            description=data.get("description", ""),
            completed=data.get("completed", False),
            subtasks=[cls.from_dict(s) for s in data.get("subtasks", [])],
        )


@dataclass
class SpecKitDocument:
    """Represents a spec-kit format specification.

    Spec-kit uses four core documents:
    - constitution.md: Guiding principles and constraints
    - spec.md: Requirements and acceptance criteria
    - plan.md: Implementation approach
    - tasks.md: Granular task checklist
    """

    # Raw content from spec-kit files
    constitution: str | None = None  # Guiding principles
    spec: str | None = None  # Requirements
    plan: str | None = None  # Implementation approach
    tasks: list[Task] = field(default_factory=list)  # Task checklist

    # Parsed metadata
    title: str = ""
    overview: str = ""
    acceptance_criteria: list[str] = field(default_factory=list)
    constraints: list[str] = field(default_factory=list)

    def has_content(self) -> bool:
        """Check if document has any content."""
        return bool(self.constitution or self.spec or self.plan or self.tasks)

    def to_dict(self) -> dict:
        """Convert to dictionary representation."""
        return {
            "constitution": self.constitution,
            "spec": self.spec,
            "plan": self.plan,
            "tasks": [t.to_dict() for t in self.tasks],
            "title": self.title,
            "overview": self.overview,
            "acceptance_criteria": self.acceptance_criteria,
            "constraints": self.constraints,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "SpecKitDocument":
        """Create from dictionary."""
        return cls(
            constitution=data.get("constitution"),
            spec=data.get("spec"),
            plan=data.get("plan"),
            tasks=[Task.from_dict(t) for t in data.get("tasks", [])],
            title=data.get("title", ""),
            overview=data.get("overview", ""),
            acceptance_criteria=data.get("acceptance_criteria", []),
            constraints=data.get("constraints", []),
        )
