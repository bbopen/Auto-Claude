"""
Spec-Kit Format Configuration
=============================

Configuration for spec-kit format integration.
Spec-kit provides a structured document format for specifications:
- constitution.md - Guiding principles and constraints
- spec.md - Requirements and acceptance criteria
- plan.md - Implementation approach
- tasks.md - Granular task checklist

This integration is OPTIONAL - if SPECKIT_ENABLED is not set, all operations
gracefully no-op and Auto-Claude continues with its native JSON format.
"""

import os
from dataclasses import dataclass


@dataclass
class SpecKitConfig:
    """Configuration for spec-kit format integration."""

    enabled: bool = False
    generate_output: bool = False  # Generate spec-kit files alongside JSON

    # Spec-kit document files
    constitution_file: str = "constitution.md"
    spec_file: str = "spec.md"
    plan_file: str = "plan.md"
    tasks_file: str = "tasks.md"

    @classmethod
    def from_env(cls) -> "SpecKitConfig":
        """Create config from environment variables.

        Environment variables:
            SPECKIT_ENABLED: Enable spec-kit format integration
            SPECKIT_OUTPUT: Also generate spec-kit format output files
        """
        return cls(
            enabled=bool(os.environ.get("SPECKIT_ENABLED", "")),
            generate_output=bool(os.environ.get("SPECKIT_OUTPUT", "")),
        )

    def is_valid(self) -> bool:
        """Check if config has minimum required values."""
        return self.enabled


def is_speckit_enabled() -> bool:
    """Check if spec-kit format integration is enabled."""
    return bool(os.environ.get("SPECKIT_ENABLED"))
