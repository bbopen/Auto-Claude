/**
 * Spec handlers for spec-kit integration
 *
 * Handles listing, reading, creating, and updating specs
 * for the spec-driven development workflow.
 */

import { ipcMain } from 'electron';
import { existsSync, readdirSync, readFileSync, statSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { IPC_CHANNELS } from '../../shared/constants';
import type { IPCResult } from '../../shared/types';
import type { Spec, SpecListResponse, SpecStatus, SpecKitPlan, SpecCreateInput, SpecUpdateInput } from '../../shared/types/speckit';
import { projectStore } from '../project-store';

// Spec directory path relative to project root
const SPECS_PATH = '.auto-claude/specs';

/**
 * Get the full path to the specs directory for a project
 */
function getSpecsPath(projectPath: string): string {
  return path.join(projectPath, SPECS_PATH);
}

/**
 * Parse a spec directory to create a Spec object
 */
function parseSpecDirectory(specDir: string, dirName: string): Spec | null {
  try {
    const specMdPath = path.join(specDir, 'spec.md');
    const planPath = path.join(specDir, 'implementation_plan.json');

    // Get directory stats for timestamps
    const stats = statSync(specDir);

    // Parse spec name from directory name (e.g., '001-auth-feature' -> 'Auth Feature')
    const nameParts = dirName.split('-').slice(1); // Remove the number prefix
    const name = nameParts.length > 0
      ? nameParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
      : dirName;

    // Read spec.md if it exists
    let specContent: string | undefined;
    if (existsSync(specMdPath)) {
      specContent = readFileSync(specMdPath, 'utf-8');
    }

    // Read implementation plan if it exists
    let currentPhase = 0;
    let completedPhases = 0;
    let taskCount = 0;
    let completedTaskCount = 0;

    if (existsSync(planPath)) {
      try {
        const planContent = readFileSync(planPath, 'utf-8');
        const plan: SpecKitPlan = JSON.parse(planContent);

        // Count completed phases and tasks
        for (const phase of plan.phases || []) {
          const phaseCompleted = phase.status === 'completed';
          if (phaseCompleted) {
            completedPhases++;
          } else if (phase.status === 'in_progress') {
            currentPhase = phase.id;
          }

          for (const subtask of phase.subtasks || []) {
            taskCount++;
            if (subtask.status === 'completed') {
              completedTaskCount++;
            }
          }
        }
      } catch (parseError) {
        console.warn(`[SPEC] Failed to parse implementation plan for ${dirName}:`, parseError);
      }
    }

    // Determine status
    let status: SpecStatus = 'draft';
    if (completedPhases === 8) {
      status = 'completed';
    } else if (completedPhases > 0 || taskCount > 0) {
      status = 'in_progress';
    }

    return {
      id: dirName,
      name,
      path: specDir,
      specContent,
      createdAt: stats.birthtime.toISOString(),
      updatedAt: stats.mtime.toISOString(),
      currentPhase,
      completedPhases,
      totalPhases: 8,
      status,
      taskCount,
      completedTaskCount
    };
  } catch (error) {
    console.error(`[SPEC] Failed to parse spec directory ${dirName}:`, error);
    return null;
  }
}

/**
 * Register spec-related IPC handlers
 */
export function registerSpecHandlers(): void {
  /**
   * List all specs for a project
   */
  ipcMain.handle(
    IPC_CHANNELS.SPEC_LIST,
    async (_, projectId: string): Promise<IPCResult<Spec[]>> => {
      try {
        const project = projectStore.getProject(projectId);
        if (!project) {
          return { success: false, error: 'Project not found' };
        }

        const specsPath = getSpecsPath(project.path);

        if (!existsSync(specsPath)) {
          // No specs directory yet - return empty list
          return { success: true, data: [] };
        }

        // Read all directories in specs folder
        const entries = readdirSync(specsPath, { withFileTypes: true });
        const specs: Spec[] = [];

        for (const entry of entries) {
          if (entry.isDirectory()) {
            const specDir = path.join(specsPath, entry.name);
            const spec = parseSpecDirectory(specDir, entry.name);
            if (spec) {
              specs.push(spec);
            }
          }
        }

        // Sort by ID (which is the directory name like '001-feature')
        specs.sort((a, b) => a.id.localeCompare(b.id));

        console.warn(`[SPEC_LIST] Found ${specs.length} specs for project:`, projectId);
        return { success: true, data: specs };
      } catch (error) {
        console.error('[SPEC_LIST] Error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to list specs'
        };
      }
    }
  );

  /**
   * Get a single spec with full details
   */
  ipcMain.handle(
    IPC_CHANNELS.SPEC_GET,
    async (_, projectId: string, specId: string): Promise<IPCResult<Spec>> => {
      try {
        const project = projectStore.getProject(projectId);
        if (!project) {
          return { success: false, error: 'Project not found' };
        }

        const specsPath = getSpecsPath(project.path);
        const specDir = path.join(specsPath, specId);

        if (!existsSync(specDir)) {
          return { success: false, error: 'Spec not found' };
        }

        const spec = parseSpecDirectory(specDir, specId);
        if (!spec) {
          return { success: false, error: 'Failed to parse spec' };
        }

        return { success: true, data: spec };
      } catch (error) {
        console.error('[SPEC_GET] Error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get spec'
        };
      }
    }
  );

  /**
   * Create a new spec
   */
  ipcMain.handle(
    IPC_CHANNELS.SPEC_CREATE,
    async (_, projectId: string, input: SpecCreateInput): Promise<IPCResult<Spec>> => {
      try {
        const project = projectStore.getProject(projectId);
        if (!project) {
          return { success: false, error: 'Project not found' };
        }

        // Validate ID format: "XXX-slug" where XXX is 3 digits
        if (!/^\d{3}-[a-z][a-z0-9-]*$/.test(input.id)) {
          return { success: false, error: 'Invalid spec ID format. Expected: XXX-slug (e.g., 001-auth-feature)' };
        }

        const specsPath = getSpecsPath(project.path);
        const specDir = path.join(specsPath, input.id);

        // Check if spec already exists
        if (existsSync(specDir)) {
          return { success: false, error: 'A spec with this ID already exists' };
        }

        // Create specs directory if it doesn't exist
        if (!existsSync(specsPath)) {
          mkdirSync(specsPath, { recursive: true });
        }

        // Create spec directory
        mkdirSync(specDir, { recursive: true });

        // Write spec.md
        const specMdPath = path.join(specDir, 'spec.md');
        writeFileSync(specMdPath, input.specContent, 'utf-8');

        // Create initial implementation_plan.json
        const now = new Date().toISOString();
        const initialPlan: SpecKitPlan = {
          specId: input.id,
          phases: [],
          createdAt: now,
          updatedAt: now
        };
        const planPath = path.join(specDir, 'implementation_plan.json');
        writeFileSync(planPath, JSON.stringify(initialPlan, null, 2), 'utf-8');

        // Parse and return the created spec
        const spec = parseSpecDirectory(specDir, input.id);
        if (!spec) {
          return { success: false, error: 'Failed to parse created spec' };
        }

        console.warn(`[SPEC_CREATE] Created spec: ${input.id}`);
        return { success: true, data: spec };
      } catch (error) {
        console.error('[SPEC_CREATE] Error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create spec'
        };
      }
    }
  );

  /**
   * Update spec.md content
   */
  ipcMain.handle(
    IPC_CHANNELS.SPEC_UPDATE,
    async (_, projectId: string, specId: string, input: SpecUpdateInput): Promise<IPCResult<Spec>> => {
      try {
        const project = projectStore.getProject(projectId);
        if (!project) {
          return { success: false, error: 'Project not found' };
        }

        const specsPath = getSpecsPath(project.path);
        const specDir = path.join(specsPath, specId);

        if (!existsSync(specDir)) {
          return { success: false, error: 'Spec not found' };
        }

        // Update spec.md
        const specMdPath = path.join(specDir, 'spec.md');
        writeFileSync(specMdPath, input.specContent, 'utf-8');

        // Parse and return the updated spec
        const spec = parseSpecDirectory(specDir, specId);
        if (!spec) {
          return { success: false, error: 'Failed to parse updated spec' };
        }

        console.warn(`[SPEC_UPDATE] Updated spec: ${specId}`);
        return { success: true, data: spec };
      } catch (error) {
        console.error('[SPEC_UPDATE] Error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update spec'
        };
      }
    }
  );

  console.warn('[IPC] Spec handlers registered');
}
