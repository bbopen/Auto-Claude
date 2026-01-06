import { create } from 'zustand';
import type { Spec, SpecCreateInput, SpecUpdateInput } from '../../shared/types/speckit';

export type SpecDetailTab = 'spec' | 'plan' | 'tasks-status' | 'tasks-phase';

interface SpecKitState {
  /** List of all specs for the current project */
  specs: Spec[];
  /** Currently selected spec ID */
  selectedSpecId: string | null;
  /** Active tab in detail view */
  activeTab: SpecDetailTab;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;

  // Actions
  setSpecs: (specs: Spec[]) => void;
  selectSpec: (specId: string | null) => void;
  setActiveTab: (tab: SpecDetailTab) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearSpecs: () => void;
}

export const useSpecKitStore = create<SpecKitState>((set) => ({
  specs: [],
  selectedSpecId: null,
  activeTab: 'spec',
  isLoading: false,
  error: null,

  setSpecs: (specs) => set({ specs, error: null }),
  selectSpec: (specId) => set({ selectedSpecId: specId }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearSpecs: () => set({ specs: [], selectedSpecId: null, error: null })
}));

/**
 * Load specs for a project
 */
export async function loadSpecs(projectId: string): Promise<void> {
  const { setLoading, setSpecs, setError } = useSpecKitStore.getState();

  setLoading(true);
  setError(null);

  try {
    const result = await window.electronAPI.listSpecs(projectId);
    if (result.success && result.data) {
      setSpecs(result.data);
    } else {
      setError(result.error || 'Failed to load specs');
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to load specs';
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
}

/**
 * Get the selected spec from the store
 */
export function getSelectedSpec(): Spec | null {
  const { specs, selectedSpecId } = useSpecKitStore.getState();
  if (!selectedSpecId) return null;
  return specs.find((s) => s.id === selectedSpecId) || null;
}

/**
 * Create a new spec
 */
export async function createSpec(
  projectId: string,
  input: SpecCreateInput
): Promise<{ success: boolean; error?: string; data?: Spec }> {
  const { setLoading, setError, setSpecs } = useSpecKitStore.getState();

  setLoading(true);
  setError(null);

  try {
    const result = await window.electronAPI.createSpec(projectId, input);
    if (result.success && result.data) {
      // Add the new spec to the list
      const { specs } = useSpecKitStore.getState();
      const updatedSpecs = [...specs, result.data].sort((a, b) => a.id.localeCompare(b.id));
      setSpecs(updatedSpecs);
      return { success: true, data: result.data };
    } else {
      setError(result.error || 'Failed to create spec');
      return { success: false, error: result.error };
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to create spec';
    setError(errorMessage);
    return { success: false, error: errorMessage };
  } finally {
    setLoading(false);
  }
}

/**
 * Update an existing spec
 */
export async function updateSpec(
  projectId: string,
  specId: string,
  input: SpecUpdateInput
): Promise<{ success: boolean; error?: string; data?: Spec }> {
  const { setLoading, setError, setSpecs } = useSpecKitStore.getState();

  setLoading(true);
  setError(null);

  try {
    const result = await window.electronAPI.updateSpec(projectId, specId, input);
    if (result.success && result.data) {
      // Update the spec in the list
      const { specs } = useSpecKitStore.getState();
      const updatedSpecs = specs.map((s) => (s.id === specId ? result.data! : s));
      setSpecs(updatedSpecs);
      return { success: true, data: result.data };
    } else {
      setError(result.error || 'Failed to update spec');
      return { success: false, error: result.error };
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to update spec';
    setError(errorMessage);
    return { success: false, error: errorMessage };
  } finally {
    setLoading(false);
  }
}
