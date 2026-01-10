import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, Clock, Mail } from 'lucide-react';
import { Button } from '../ui/Button';
import { campaignsService } from '../../services/campaigns.service';
import type { CampaignDefinition, EnrollLeadsResponse } from '../../types/campaign.types';
import './EnrollToCampaignModal.css';

interface LeadToEnroll {
  id: number; // lead_email.id
  email: string;
  contactName: string;
  businessName: string;
}

interface EnrollToCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadsToEnroll: LeadToEnroll[];
  onSuccess: (result: EnrollLeadsResponse) => void;
}

export const EnrollToCampaignModal: React.FC<EnrollToCampaignModalProps> = ({
  isOpen,
  onClose,
  leadsToEnroll,
  onSuccess,
}) => {
  const [campaigns, setCampaigns] = useState<CampaignDefinition[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch enabled campaigns when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCampaigns();
      setError(null);
      setSelectedCampaignId(null);
    }
  }, [isOpen]);

  const fetchCampaigns = async () => {
    setIsLoadingCampaigns(true);
    setError(null);
    try {
      const enabledCampaigns = await campaignsService.getEnabledCampaigns();
      setCampaigns(enabledCampaigns);
      // Auto-select if only one campaign
      if (enabledCampaigns.length === 1) {
        setSelectedCampaignId(enabledCampaigns[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaigns');
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  const handleEnroll = async () => {
    if (!selectedCampaignId || leadsToEnroll.length === 0) return;

    setIsEnrolling(true);
    setError(null);
    try {
      const leadEmailIds = leadsToEnroll.map(l => l.id);
      const result = await campaignsService.enrollLeads(leadEmailIds);
      // Close modal immediately and let parent handle toast notification
      onSuccess(result);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enroll leads');
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleClose = () => {
    if (!isEnrolling) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="enroll-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={handleClose} disabled={isEnrolling}>
          <X size={20} />
        </button>
        <div className="modal-header">
          <h2>Enroll Leads to Campaign</h2>
        </div>

        <div className="modal-body">
          {/* Loading State */}
          {isLoadingCampaigns && (
            <div className="enroll-loading">
              <Loader2 size={24} className="spinning" />
              <span>Loading campaigns...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="enroll-error">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {/* No Campaigns Available */}
          {!isLoadingCampaigns && !error && campaigns.length === 0 && (
            <div className="enroll-empty">
              <AlertCircle size={32} />
              <h3>No Campaigns Available</h3>
              <p>You need to enable at least one campaign before you can enroll leads.</p>
              <p className="enroll-hint">Go to Settings → Campaigns to enable campaigns.</p>
            </div>
          )}

          {/* Campaign Selection */}
          {!isLoadingCampaigns && !error && campaigns.length > 0 && (
            <>
              <div className="campaign-selection">
                <label className="selection-label">Select Campaign:</label>
                <div className="campaign-options">
                  {campaigns.map(campaign => (
                    <button
                      key={campaign.id}
                      className={`campaign-option ${selectedCampaignId === campaign.id ? 'selected' : ''}`}
                      onClick={() => setSelectedCampaignId(campaign.id)}
                    >
                      <div className="campaign-option-radio">
                        <div className="radio-dot" />
                      </div>
                      <div className="campaign-option-content">
                        <span className="campaign-name">{campaign.name}</span>
                        <span className="campaign-steps">{campaign.step_count} steps</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Leads Preview */}
              <div className="leads-preview">
                <label className="selection-label">
                  Selected Leads ({leadsToEnroll.length}):
                </label>
                <div className="leads-list">
                  {leadsToEnroll.slice(0, 5).map(lead => (
                    <div key={lead.id} className="lead-item">
                      <Mail size={14} />
                      <span className="lead-business">{lead.businessName}</span>
                      <span className="lead-email">({lead.email})</span>
                    </div>
                  ))}
                  {leadsToEnroll.length > 5 && (
                    <div className="lead-item more">
                      +{leadsToEnroll.length - 5} more leads
                    </div>
                  )}
                </div>
              </div>

              {/* Warning */}
              <div className="enroll-warning">
                <Clock size={16} />
                <span>
                  Leads will receive their first email in <strong>15 minutes</strong>.
                  You can unenroll them before then if needed.
                </span>
              </div>
            </>
          )}

        </div>

        <div className="modal-footer">
          <Button variant="outline" onClick={handleClose} disabled={isEnrolling}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleEnroll}
            disabled={!selectedCampaignId || isEnrolling || leadsToEnroll.length === 0}
          >
            {isEnrolling ? (
              <>
                <Loader2 size={16} className="spinning" />
                Enrolling...
              </>
            ) : (
              `Enroll ${leadsToEnroll.length} Lead${leadsToEnroll.length > 1 ? 's' : ''}`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

