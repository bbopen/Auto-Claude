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
- Build comprehensive context for agents from project files
- Organize tasks into an 8-phase implementation structure

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

    # Build context for agents
    from integrations.speckit import get_speckit_context, SpecKitPhase

    context = get_speckit_context(project_dir, spec_dir)
    prompt_context = context.format_for_prompt()
    phase_context = context.get_phase_context(SpecKitPhase.CORE_SERVICES.value)

Environment Variables:
    SPECKIT_ENABLED: Enable spec-kit format integration
    SPECKIT_OUTPUT: Also generate spec-kit format output files
"""

from .config import SpecKitConfig, is_speckit_enabled
from .constitution import ConstitutionManager, get_constitution_manager
from .context import (
    SpecKitContext,
    SpecKitContextBuilder,
    get_speckit_context,
    get_speckit_context_builder,
)
from .format import SpecKitDocument, Task
from .generator import SpecKitGenerator
from .manager import SpecKitManager, get_speckit_manager
from .parser import SpecKitParser
from .phases import (
    PHASE_DESCRIPTIONS,
    PHASE_SHORT_NAMES,
    SpecKitPhase,
    get_current_phase,
    get_phase_dependencies,
    get_phase_description,
    get_phase_order,
    get_phase_progress,
    get_phase_short_name,
    get_tasks_by_phase,
    is_phase_complete,
    map_subtask_to_phase,
)

__all__ = [
    # Config
    "SpecKitConfig",
    "is_speckit_enabled",
    # Constitution
    "ConstitutionManager",
    "get_constitution_manager",
    # Context
    "SpecKitContext",
    "SpecKitContextBuilder",
    "get_speckit_context",
    "get_speckit_context_builder",
    # Format
    "SpecKitDocument",
    "Task",
    # Manager
    "SpecKitManager",
    "get_speckit_manager",
    # Parser & Generator
    "SpecKitParser",
    "SpecKitGenerator",
    # Phases
    "SpecKitPhase",
    "PHASE_DESCRIPTIONS",
    "PHASE_SHORT_NAMES",
    "get_phase_order",
    "get_phase_description",
    "get_phase_short_name",
    "map_subtask_to_phase",
    "get_tasks_by_phase",
    "get_current_phase",
    "get_phase_progress",
    "is_phase_complete",
    "get_phase_dependencies",
]

__version__ = "0.1.0"
