"""
Spec-Kit Format Integration
===========================

Optional integration for spec-kit document format support.

Spec-kit provides a structured document format for specifications:
- constitution.md - Guiding principles and constraints
- spec.md - Requirements and acceptance criteria
- plan.md - Implementation approach
- tasks.md - Granular task checklist

This integration allows Auto-Claude to:
- Parse existing spec-kit format files as input
- Generate spec-kit format files alongside its native JSON format

Usage:
    from integrations.speckit import SpecKitManager, is_speckit_enabled

    # Check if enabled
    if is_speckit_enabled():
        manager = SpecKitManager(spec_dir, project_dir)

        # Load existing spec-kit files
        if manager.has_speckit_input:
            doc = manager.load_document()
            requirements = manager.convert_to_requirements(doc)

        # Generate spec-kit output
        manager.generate_output(requirements, impl_plan)

Environment Variables:
    SPECKIT_ENABLED: Enable spec-kit format integration
    SPECKIT_OUTPUT: Also generate spec-kit format output files
"""

from .config import SpecKitConfig, is_speckit_enabled
from .format import SpecKitDocument, Task
from .generator import SpecKitGenerator
from .manager import SpecKitManager, get_speckit_manager
from .parser import SpecKitParser

__all__ = [
    # Config
    "SpecKitConfig",
    "is_speckit_enabled",
    # Format
    "SpecKitDocument",
    "Task",
    # Manager
    "SpecKitManager",
    "get_speckit_manager",
    # Parser & Generator
    "SpecKitParser",
    "SpecKitGenerator",
]

__version__ = "0.1.0"
