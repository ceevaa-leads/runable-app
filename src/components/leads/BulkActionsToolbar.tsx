import React from 'react';
import { X, UserPlus, UserMinus } from 'lucide-react';
import { Button } from '../ui/Button';
import './BulkActionsToolbar.css';

interface BulkActionsToolbarProps {
  selectedCount: number;
  onEnrollClick: () => void;
  onUnenrollClick: () => void;
  onClearSelection: () => void;
  canEnroll: boolean; // True if any selected leads can be enrolled (NEW status)
  canUnenroll: boolean; // True if any selected leads can be unenrolled (scheduled status)
}

export const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedCount,
  onEnrollClick,
  onUnenrollClick,
  onClearSelection,
  canEnroll,
  canUnenroll,
}) => {
  return (
    <div className="bulk-actions-toolbar">
      <div className="bulk-actions-content">
        <div className="selection-info">
          <span className="selection-count">{selectedCount}</span>
          <span className="selection-text">
            {selectedCount === 1 ? 'lead selected' : 'leads selected'}
          </span>
          {selectedCount === 0 && (
            <span className="selection-hint">
              Select contacts below to enable campaign actions
            </span>
          )}
        </div>

        <div className="bulk-actions-buttons">
          <Button
            variant="primary"
            size="sm"
            onClick={onEnrollClick}
            disabled={!canEnroll}
            title={canEnroll ? 'Enroll selected leads to a campaign' : 'No eligible leads to enroll (must be NEW status)'}
          >
            <UserPlus size={16} />
            Enroll to Campaign
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onUnenrollClick}
            disabled={!canUnenroll}
            title={canUnenroll ? 'Unenroll selected leads from campaign' : 'No leads with scheduled campaigns to unenroll'}
          >
            <UserMinus size={16} />
            Unenroll
          </Button>
        </div>

        <button
          className="clear-selection-btn"
          onClick={onClearSelection}
          disabled={selectedCount === 0}
          title="Clear selection"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

