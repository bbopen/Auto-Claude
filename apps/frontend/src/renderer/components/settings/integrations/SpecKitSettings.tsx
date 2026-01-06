import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { Switch } from '../../ui/switch';
import { Label } from '../../ui/label';
import { Button } from '../../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../ui/select';
import { ConstitutionSection } from '../../project-settings/ConstitutionSection';
import { AVAILABLE_MODELS, THINKING_LEVELS } from '../../../../shared/constants';
import { SPECKIT_PHASES } from '../../../../shared/types/speckit';
import type {
  ProjectSettings,
  SpecKitPhaseModelConfig,
  SpecKitPhaseThinkingConfig,
  SpecKitModelType,
  SpecKitThinkingLevel
} from '../../../../shared/types/project';

interface SpecKitSettingsProps {
  projectId: string;
  settings: ProjectSettings;
  setSettings: React.Dispatch<React.SetStateAction<ProjectSettings>>;
}

// Phase keys mapping to the typed config
const PHASE_KEYS: Array<keyof SpecKitPhaseModelConfig> = [
  'setup',
  'dataModels',
  'coreServices',
  'apiLayer',
  'uiComponents',
  'pagesRoutes',
  'integration',
  'polish'
];

// Map phase index to phase key
const PHASE_INDEX_TO_KEY: Record<number, keyof SpecKitPhaseModelConfig> = {
  0: 'setup',
  1: 'dataModels',
  2: 'coreServices',
  3: 'apiLayer',
  4: 'uiComponents',
  5: 'pagesRoutes',
  6: 'integration',
  7: 'polish'
};

// Default phase configuration (balanced approach)
const DEFAULT_PHASE_MODELS: SpecKitPhaseModelConfig = {
  setup: 'sonnet',
  dataModels: 'sonnet',
  coreServices: 'opus',
  apiLayer: 'sonnet',
  uiComponents: 'sonnet',
  pagesRoutes: 'sonnet',
  integration: 'sonnet',
  polish: 'haiku'
};

const DEFAULT_PHASE_THINKING: SpecKitPhaseThinkingConfig = {
  setup: 'low',
  dataModels: 'medium',
  coreServices: 'high',
  apiLayer: 'medium',
  uiComponents: 'medium',
  pagesRoutes: 'low',
  integration: 'medium',
  polish: 'low'
};

/**
 * Spec-Kit settings component.
 * Manages Spec-Kit mode toggle, constitution editor, and phase configuration.
 */
export function SpecKitSettings({
  projectId,
  settings,
  setSettings
}: SpecKitSettingsProps) {
  const { t } = useTranslation(['settings', 'common']);
  const [showPhaseConfig, setShowPhaseConfig] = useState(false);

  const specKitEnabled = settings.specKitEnabled ?? false;
  const currentPhaseModels = settings.specKitPhaseModels ?? DEFAULT_PHASE_MODELS;
  const currentPhaseThinking = settings.specKitPhaseThinking ?? DEFAULT_PHASE_THINKING;

  // Check if current config differs from defaults
  const hasCustomConfig = useMemo((): boolean => {
    if (!settings.specKitPhaseModels && !settings.specKitPhaseThinking) {
      return false;
    }
    return PHASE_KEYS.some(
      (phase) =>
        currentPhaseModels[phase] !== DEFAULT_PHASE_MODELS[phase] ||
        currentPhaseThinking[phase] !== DEFAULT_PHASE_THINKING[phase]
    );
  }, [settings.specKitPhaseModels, settings.specKitPhaseThinking, currentPhaseModels, currentPhaseThinking]);

  const handleToggleEnabled = (checked: boolean) => {
    setSettings((prev) => ({
      ...prev,
      specKitEnabled: checked
    }));
  };

  const handlePhaseModelChange = (phase: keyof SpecKitPhaseModelConfig, value: SpecKitModelType) => {
    setSettings((prev) => ({
      ...prev,
      specKitPhaseModels: {
        ...currentPhaseModels,
        [phase]: value
      }
    }));
  };

  const handlePhaseThinkingChange = (phase: keyof SpecKitPhaseThinkingConfig, value: SpecKitThinkingLevel) => {
    setSettings((prev) => ({
      ...prev,
      specKitPhaseThinking: {
        ...currentPhaseThinking,
        [phase]: value
      }
    }));
  };

  const handleResetToDefaults = () => {
    setSettings((prev) => ({
      ...prev,
      specKitPhaseModels: undefined,
      specKitPhaseThinking: undefined
    }));
  };

  const getModelLabel = (modelValue: string): string => {
    const model = AVAILABLE_MODELS.find((m) => m.value === modelValue);
    return model?.label || modelValue;
  };

  const getThinkingLabel = (thinkingValue: string): string => {
    const level = THINKING_LEVELS.find((l) => l.value === thinkingValue);
    return level?.label || thinkingValue;
  };

  return (
    <div className="space-y-6">
      {/* Enable Toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="font-normal text-foreground">
            {t('projectSections.specKit.enableLabel')}
          </Label>
          <p className="text-xs text-muted-foreground">
            {t('projectSections.specKit.enableDescription')}
          </p>
        </div>
        <Switch
          checked={specKitEnabled}
          onCheckedChange={handleToggleEnabled}
        />
      </div>

      {specKitEnabled && (
        <>
          {/* Constitution Section */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h4 className="font-medium text-sm text-foreground mb-4">
              {t('projectSections.specKit.constitutionTitle')}
            </h4>
            <ConstitutionSection projectId={projectId} />
          </div>

          {/* Phase Configuration */}
          <div className="rounded-lg border border-border bg-card">
            {/* Header - Collapsible */}
            <button
              type="button"
              onClick={() => setShowPhaseConfig(!showPhaseConfig)}
              className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors rounded-t-lg"
            >
              <div>
                <h4 className="font-medium text-sm text-foreground">
                  {t('projectSections.specKit.phaseConfigTitle')}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('projectSections.specKit.phaseConfigDescription')}
                </p>
              </div>
              {showPhaseConfig ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {/* Phase Configuration Content */}
            {showPhaseConfig && (
              <div className="border-t border-border p-4 space-y-4">
                {/* Reset button */}
                {hasCustomConfig && (
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResetToDefaults}
                      className="text-xs h-7"
                    >
                      <RotateCcw className="h-3 w-3 mr-1.5" />
                      {t('projectSections.specKit.resetToDefaults')}
                    </Button>
                  </div>
                )}

                {/* Phase Configuration Grid */}
                <div className="space-y-4">
                  {SPECKIT_PHASES.map((phase) => {
                    const phaseKey = PHASE_INDEX_TO_KEY[phase.id];
                    return (
                      <div key={phase.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium text-foreground">
                            {phase.name}
                          </Label>
                          <span className="text-xs text-muted-foreground">
                            {phase.description}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {/* Model Select */}
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">
                              {t('projectSections.specKit.model')}
                            </Label>
                            <Select
                              value={currentPhaseModels[phaseKey]}
                              onValueChange={(value) =>
                                handlePhaseModelChange(phaseKey, value as SpecKitModelType)
                              }
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {AVAILABLE_MODELS.map((m) => (
                                  <SelectItem key={m.value} value={m.value}>
                                    {m.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {/* Thinking Level Select */}
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">
                              {t('projectSections.specKit.thinkingLevel')}
                            </Label>
                            <Select
                              value={currentPhaseThinking[phaseKey]}
                              onValueChange={(value) =>
                                handlePhaseThinkingChange(phaseKey, value as SpecKitThinkingLevel)
                              }
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {THINKING_LEVELS.map((level) => (
                                  <SelectItem key={level.value} value={level.value}>
                                    {level.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Info note */}
                <p className="text-[10px] text-muted-foreground mt-4 pt-3 border-t border-border">
                  {t('projectSections.specKit.phaseConfigNote')}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
