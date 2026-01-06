/**
 * Constitution handlers for spec-kit integration
 *
 * Handles reading, writing, and initializing constitution files
 * for project-level AI behavioral guidelines.
 */

import { ipcMain } from 'electron';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { IPC_CHANNELS } from '../../shared/constants';
import type { IPCResult } from '../../shared/types';
import { projectStore } from '../project-store';

// Constitution file path relative to project root
const CONSTITUTION_PATH = '.specify/memory/constitution.md';

// Default constitution template
const DEFAULT_CONSTITUTION = `# Project Constitution

## Purpose
This document defines the behavioral guidelines and constraints for AI agents working on this project.

## Code Style
- Follow existing patterns in the codebase
- Use consistent naming conventions
- Write self-documenting code with clear variable names
- Add comments for complex logic

## Architecture Guidelines
- Maintain separation of concerns
- Follow the established directory structure
- Keep components small and focused
- Prefer composition over inheritance

## Testing Requirements
- Write tests for new functionality
- Maintain existing test coverage
- Use meaningful test descriptions

## Documentation
- Update README when adding new features
- Document public APIs
- Keep inline documentation current

## Security Considerations
- Never commit secrets or credentials
- Validate all user inputs
- Follow secure coding practices

## Performance Guidelines
- Optimize for readability first
- Profile before optimizing
- Consider memory usage for large datasets

---
*This constitution guides AI agents working on this project. Modify as needed for your project's requirements.*
`;

/**
 * Get the full path to the constitution file for a project
 */
function getConstitutionPath(projectPath: string): string {
  return path.join(projectPath, CONSTITUTION_PATH);
}

/**
 * Register constitution-related IPC handlers
 */
export function registerConstitutionHandlers(): void {
  /**
   * Get constitution content for a project
   */
  ipcMain.handle(
    IPC_CHANNELS.CONSTITUTION_GET,
    async (_, projectId: string): Promise<IPCResult<string>> => {
      try {
        const project = projectStore.getProject(projectId);
        if (!project) {
          return { success: false, error: 'Project not found' };
        }

        const constitutionPath = getConstitutionPath(project.path);

        if (!existsSync(constitutionPath)) {
          return { success: false, error: 'Constitution file does not exist' };
        }

        const content = readFileSync(constitutionPath, 'utf-8');
        return { success: true, data: content };
      } catch (error) {
        console.error('[CONSTITUTION_GET] Error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to read constitution'
        };
      }
    }
  );

  /**
   * Save constitution content for a project
   */
  ipcMain.handle(
    IPC_CHANNELS.CONSTITUTION_SAVE,
    async (_, projectId: string, content: string): Promise<IPCResult> => {
      try {
        const project = projectStore.getProject(projectId);
        if (!project) {
          return { success: false, error: 'Project not found' };
        }

        const constitutionPath = getConstitutionPath(project.path);
        const constitutionDir = path.dirname(constitutionPath);

        // Ensure directory exists
        if (!existsSync(constitutionDir)) {
          mkdirSync(constitutionDir, { recursive: true });
        }

        writeFileSync(constitutionPath, content, 'utf-8');
        console.warn('[CONSTITUTION_SAVE] Saved constitution for project:', projectId);

        return { success: true };
      } catch (error) {
        console.error('[CONSTITUTION_SAVE] Error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to save constitution'
        };
      }
    }
  );

  /**
   * Check if constitution file exists for a project
   */
  ipcMain.handle(
    IPC_CHANNELS.CONSTITUTION_EXISTS,
    async (_, projectId: string): Promise<IPCResult<boolean>> => {
      try {
        const project = projectStore.getProject(projectId);
        if (!project) {
          return { success: false, error: 'Project not found' };
        }

        const constitutionPath = getConstitutionPath(project.path);
        const exists = existsSync(constitutionPath);

        return { success: true, data: exists };
      } catch (error) {
        console.error('[CONSTITUTION_EXISTS] Error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to check constitution'
        };
      }
    }
  );

  /**
   * Initialize default constitution for a project
   */
  ipcMain.handle(
    IPC_CHANNELS.CONSTITUTION_INIT,
    async (_, projectId: string): Promise<IPCResult<string>> => {
      try {
        const project = projectStore.getProject(projectId);
        if (!project) {
          return { success: false, error: 'Project not found' };
        }

        const constitutionPath = getConstitutionPath(project.path);
        const constitutionDir = path.dirname(constitutionPath);

        // Ensure directory exists
        if (!existsSync(constitutionDir)) {
          mkdirSync(constitutionDir, { recursive: true });
        }

        // Don't overwrite existing constitution
        if (existsSync(constitutionPath)) {
          const existingContent = readFileSync(constitutionPath, 'utf-8');
          return { success: true, data: existingContent };
        }

        writeFileSync(constitutionPath, DEFAULT_CONSTITUTION, 'utf-8');
        console.warn('[CONSTITUTION_INIT] Initialized default constitution for project:', projectId);

        return { success: true, data: DEFAULT_CONSTITUTION };
      } catch (error) {
        console.error('[CONSTITUTION_INIT] Error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to initialize constitution'
        };
      }
    }
  );

  console.warn('[IPC] Constitution handlers registered');
}
