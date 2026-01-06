/**
 * SpecsView Component
 *
 * Main container for the Specs view.
 * Shows a list of specs when no spec is selected,
 * or the spec detail view when a spec is selected.
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { useSpecKitStore, loadSpecs } from '../../stores/spec-kit-store';
import { SpecListView } from './SpecListView';
import { SpecDetailView } from './SpecDetailView';
import { SpecEditorDialog } from './SpecEditorDialog';

interface SpecsViewProps {
  projectId: string;
}

/**
 * Main Specs view container.
 * Shows a list of specs for the project when spec-kit is enabled.
 */
export function SpecsView({ projectId }: SpecsViewProps) {
  const { t } = useTranslation(['settings', 'common']);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Get state from store
  const {
    specs,
    selectedSpecId,
    isLoading,
    error,
    selectSpec
  } = useSpecKitStore();

  // Load specs when component mounts or projectId changes
  useEffect(() => {
    if (projectId) {
      loadSpecs(projectId);
    }
  }, [projectId]);

  // Handle creating a new spec
  const handleCreateSpec = () => {
    setShowCreateDialog(true);
  };

  // Handle spec creation success
  const handleCreateSuccess = () => {
    // Reload specs to get the new one
    loadSpecs(projectId);
  };

  // Handle selecting a spec
  const handleSelectSpec = (specId: string | null) => {
    selectSpec(specId);
  };

  // If a spec is selected, show the detail view
  if (selectedSpecId) {
    const selectedSpec = specs.find(s => s.id === selectedSpecId);

    if (!selectedSpec) {
      // Spec not found, go back to list
      selectSpec(null);
      return null;
    }

    return (
      <div className="flex h-full flex-col">
        {/* Header with back button */}
        <div className="flex items-center gap-4 border-b border-border px-6 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => selectSpec(null)}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{selectedSpec.name}</h1>
            <p className="text-sm text-muted-foreground font-mono">
              {selectedSpec.id}
            </p>
          </div>
        </div>

        {/* Spec Detail View with tabs */}
        <SpecDetailView spec={selectedSpec} projectId={projectId} />
      </div>
    );
  }

  // Show the spec list
  return (
    <>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold">{t('settings:specKit.title')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('settings:specKit.description')}
            </p>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-6">
            <SpecListView
              specs={specs}
              selectedSpecId={selectedSpecId}
              isLoading={isLoading}
              error={error}
              onSelectSpec={handleSelectSpec}
              onCreateSpec={handleCreateSpec}
            />
          </div>
        </ScrollArea>
      </div>

      {/* Spec Editor Dialog */}
      <SpecEditorDialog
        projectId={projectId}
        mode="create"
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
}
