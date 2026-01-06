/**
 * Spec-Kit Types
 * Types for spec-kit integration with phase-based task organization
 */

/**
 * Represents a spec-kit phase in the 8-phase development methodology
 */
export interface SpecKitPhase {
  id: number;
  name: string;
  description: string;
}

/**
 * Spec status based on phase completion
 */
export type SpecStatus = 'draft' | 'in_progress' | 'completed';

/**
 * Represents a spec in the spec-kit system
 * Located at .auto-claude/specs/XXX-name/
 */
export interface Spec {
  /** Unique identifier (e.g., '001-auth-feature') */
  id: string;
  /** Display name derived from spec.md or directory name */
  name: string;
  /** Full path to the spec directory */
  path: string;
  /** Content of spec.md (WHAT to build) */
  specContent?: string;
  /** Creation timestamp */
  createdAt: string;
  /** Last modified timestamp */
  updatedAt: string;
  /** Current phase (0-7 based on implementation_plan.json) */
  currentPhase: number;
  /** Number of completed phases */
  completedPhases: number;
  /** Total phases (always 8) */
  totalPhases: number;
  /** Computed status */
  status: SpecStatus;
  /** Number of tasks associated with this spec */
  taskCount: number;
  /** Number of completed tasks */
  completedTaskCount: number;
}

/**
 * Spec list response from IPC
 */
export interface SpecListResponse {
  success: boolean;
  specs: Spec[];
  error?: string;
}

/**
 * Spec detail response from IPC
 */
export interface SpecDetailResponse {
  success: boolean;
  spec?: Spec;
  specContent?: string;
  implementationPlan?: SpecKitPlan;
  error?: string;
}

/**
 * Spec-Kit implementation plan structure (HOW to build)
 * Located at .auto-claude/specs/XXX-name/implementation_plan.json
 * Note: Named SpecKitPlan to avoid conflict with task.ts ImplementationPlan
 */
export interface SpecKitPlan {
  specId: string;
  phases: SpecKitPlanPhase[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Individual phase in a spec-kit implementation plan
 */
export interface SpecKitPlanPhase {
  id: number;
  name: string;
  status: 'pending' | 'in_progress' | 'completed';
  subtasks: SpecKitSubtask[];
}

/**
 * Subtask within a spec-kit phase
 */
export interface SpecKitSubtask {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  phase: number;
}

/**
 * The 8 phases of spec-kit development methodology
 * Phase 0: Setup - Project initialization and configuration
 * Phase 1: Data Models - Database schemas and data structures
 * Phase 2: Core Services - Business logic and service layer
 * Phase 3: API Layer - REST/GraphQL endpoints
 * Phase 4: UI Components - Frontend component library
 * Phase 5: Pages & Routes - Application pages and navigation
 * Phase 6: Integration - Third-party services and connections
 * Phase 7: Polish - Testing, documentation, and refinement
 */
export const SPECKIT_PHASES: SpecKitPhase[] = [
  {
    id: 0,
    name: 'Setup',
    description: 'Project initialization and configuration'
  },
  {
    id: 1,
    name: 'Data Models',
    description: 'Database schemas and data structures'
  },
  {
    id: 2,
    name: 'Core Services',
    description: 'Business logic and service layer'
  },
  {
    id: 3,
    name: 'API Layer',
    description: 'REST/GraphQL endpoints'
  },
  {
    id: 4,
    name: 'UI Components',
    description: 'Frontend component library'
  },
  {
    id: 5,
    name: 'Pages & Routes',
    description: 'Application pages and navigation'
  },
  {
    id: 6,
    name: 'Integration',
    description: 'Third-party services and connections'
  },
  {
    id: 7,
    name: 'Polish',
    description: 'Testing, documentation, and refinement'
  }
];

/**
 * Get a phase by its ID
 */
export function getPhaseById(id: number): SpecKitPhase | undefined {
  return SPECKIT_PHASES.find(phase => phase.id === id);
}

/**
 * Get phase name by ID
 */
export function getPhaseName(id: number): string {
  const phase = getPhaseById(id);
  return phase ? phase.name : `Phase ${id}`;
}

/**
 * Input for creating a new spec
 */
export interface SpecCreateInput {
  /** Unique ID in format XXX-slug (e.g., '001-auth-feature') */
  id: string;
  /** Display name for the spec */
  name: string;
  /** Markdown content for spec.md */
  specContent: string;
}

/**
 * Input for updating an existing spec
 */
export interface SpecUpdateInput {
  /** Updated markdown content for spec.md */
  specContent: string;
}
