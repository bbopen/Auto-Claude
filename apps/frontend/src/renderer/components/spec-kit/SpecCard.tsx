/**
 * SpecCard Component
 *
 * Displays a single spec as a card with progress indicator and status.
 * Used in the SpecListView grid.
 */

import { motion } from 'framer-motion';
import { FileText, CheckCircle2, Clock, Edit3 } from 'lucide-react';
import type { Spec } from '../../../shared/types/speckit';

interface SpecCardProps {
  spec: Spec;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Get status icon and color based on spec status
 */
function getStatusDisplay(status: Spec['status']) {
  switch (status) {
    case 'completed':
      return {
        icon: CheckCircle2,
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        label: 'Completed'
      };
    case 'in_progress':
      return {
        icon: Clock,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        label: 'In Progress'
      };
    case 'draft':
    default:
      return {
        icon: Edit3,
        color: 'text-gray-400',
        bgColor: 'bg-gray-500/10',
        label: 'Draft'
      };
  }
}

export function SpecCard({ spec, isSelected, onClick }: SpecCardProps) {
  const statusDisplay = getStatusDisplay(spec.status);
  const StatusIcon = statusDisplay.icon;
  const progressPercent = spec.totalPhases > 0
    ? Math.round((spec.completedPhases / spec.totalPhases) * 100)
    : 0;

  return (
    <motion.button
      onClick={onClick}
      className={`
        w-full text-left p-4 rounded-lg border transition-all duration-200
        ${isSelected
          ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/20'
          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800'
        }
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`p-2 rounded-lg ${statusDisplay.bgColor}`}>
          <FileText className={`w-5 h-5 ${statusDisplay.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-100 truncate" title={spec.name}>
            {spec.name}
          </h3>
          <p className="text-xs text-gray-500 font-mono truncate" title={spec.id}>
            {spec.id}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-400">Progress</span>
          <span className="text-gray-300">{spec.completedPhases}/{spec.totalPhases} phases</span>
        </div>
        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              spec.status === 'completed'
                ? 'bg-green-500'
                : spec.status === 'in_progress'
                ? 'bg-blue-500'
                : 'bg-gray-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center justify-between">
        <div className={`
          inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs
          ${statusDisplay.bgColor} ${statusDisplay.color}
        `}>
          <StatusIcon className="w-3 h-3" />
          <span>{statusDisplay.label}</span>
        </div>

        {/* Task Count */}
        {spec.taskCount > 0 && (
          <span className="text-xs text-gray-500">
            {spec.completedTaskCount}/{spec.taskCount} tasks
          </span>
        )}
      </div>
    </motion.button>
  );
}
