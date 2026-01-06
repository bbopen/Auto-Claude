/**
 * SpecListView Component
 *
 * Displays a grid of spec cards with a "New Spec" button.
 * Handles empty state when no specs exist.
 */

import { Plus, FileBox, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { Spec } from '../../../shared/types/speckit';
import { SpecCard } from './SpecCard';

interface SpecListViewProps {
  specs: Spec[];
  selectedSpecId: string | null;
  isLoading: boolean;
  error: string | null;
  onSelectSpec: (specId: string | null) => void;
  onCreateSpec: () => void;
}

export function SpecListView({
  specs,
  selectedSpecId,
  isLoading,
  error,
  onSelectSpec,
  onCreateSpec
}: SpecListViewProps) {
  const { t } = useTranslation(['settings', 'common']);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span>{t('common:loading')}</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-400 mb-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            {t('common:retry')}
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (specs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
          <FileBox className="w-8 h-8 text-gray-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-300 mb-2">
          {t('settings:specKit.noSpecs')}
        </h3>
        <p className="text-gray-500 mb-4 max-w-md">
          {t('settings:specKit.noSpecsDescription')}
        </p>
        <button
          onClick={onCreateSpec}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{t('settings:specKit.createSpec')}</span>
        </button>
      </div>
    );
  }

  // Grid of specs
  return (
    <div className="space-y-4">
      {/* Header with count and create button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-200">
          {t('settings:specKit.specsCount', { count: specs.length })}
        </h2>
        <button
          onClick={onCreateSpec}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{t('settings:specKit.newSpec')}</span>
        </button>
      </div>

      {/* Spec Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {specs.map((spec, index) => (
          <motion.div
            key={spec.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <SpecCard
              spec={spec}
              isSelected={selectedSpecId === spec.id}
              onClick={() => onSelectSpec(spec.id)}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
