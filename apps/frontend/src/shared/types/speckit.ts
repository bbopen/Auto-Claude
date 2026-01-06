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
