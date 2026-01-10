import React, { useState, useEffect, useCallback } from 'react';
import { 
  Mail, 
  Play, 
  Pause, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Zap,
  Users,
  BarChart3,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { campaignsService } from '../../services/campaigns.service';
import type { CampaignDefinition, CampaignWithSteps } from '../../types/campaign.types';

export const CampaignsPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<CampaignDefinition[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignWithSteps | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  // Toggle step expansion to show full template
  const toggleStepExpansion = (stepId: number) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  const loadCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await campaignsService.getCampaigns();
      setCampaigns(response.campaigns);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCampaignDetails = useCallback(async (campaignId: number) => {
    try {
      const campaign = await campaignsService.getCampaign(campaignId);
      setSelectedCampaign(campaign);
    } catch (err) {
      console.error('Failed to load campaign details:', err);
    }
  }, []);

  const handleToggle = useCallback(async (campaignId: number, currentState: boolean) => {
    try {
      setTogglingId(campaignId);
      await campaignsService.toggleCampaign(campaignId, !currentState);
      setCampaigns(prev => 
        prev.map(c => 
          c.id === campaignId ? { ...c, is_enabled: !currentState } : c
        )
      );
      if (selectedCampaign?.id === campaignId) {
        setSelectedCampaign(prev => prev ? { ...prev, is_enabled: !currentState } : null);
      }
    } catch (err) {
      console.error('Failed to toggle campaign:', err);
    } finally {
      setTogglingId(null);
    }
  }, [selectedCampaign]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const getTriggerStatusBadges = (statuses: string[]) => {
    const statusStyles: Record<string, { bg: string; color: string; border: string }> = {
      new: { bg: '#e8f5e9', color: '#2e7d32', border: '#a5d6a7' },
      contacted: { bg: '#e3f2fd', color: '#1565c0', border: '#90caf9' },
      in_progress: { bg: '#fff3e0', color: '#e65100', border: '#ffcc80' },
      progress: { bg: '#fff3e0', color: '#e65100', border: '#ffcc80' },
      lost: { bg: '#ffebee', color: '#c62828', border: '#ef9a9a' },
      active: { bg: '#e8f5e9', color: '#2e7d32', border: '#a5d6a7' },
      dormant: { bg: '#f5f5f5', color: '#616161', border: '#e0e0e0' },
    };

    const defaultStyle = { bg: '#f5f5f5', color: '#616161', border: '#e0e0e0' };

    return statuses.map(status => {
      const style = statusStyles[status] || defaultStyle;
      return (
        <span 
          key={status} 
          className="status-chip"
          style={{
            backgroundColor: style.bg,
            color: style.color,
            border: `1px solid ${style.border}`,
          }}
        >
          {status.replace('_', ' ')}
        </span>
      );
    });
  };

  const formatDelayText = (days: number, stepNumber: number) => {
    if (stepNumber === 1) return 'Immediately';
    if (days === 0) return 'Same day';
    if (days === 1) return '1 day later';
    return `${days} days later`;
  };

  if (loading) {
    return (
      <div className="campaigns-page">
        <div className="campaigns-loading">
          <div className="loading-spinner"></div>
          <p>Loading campaigns...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="campaigns-page">
        <div className="campaigns-error">
          <AlertCircle size={48} />
          <h2>Error Loading Campaigns</h2>
          <p>{error}</p>
          <button onClick={loadCampaigns} className="btn-retry">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="campaigns-page">
      {/* Header */}
      <div className="campaigns-header">
        <div className="campaigns-header-content">
          <div className="campaigns-title-section">
            <Mail className="campaigns-icon" size={32} />
            <div>
              <h1>Email Campaigns</h1>
              <p>Automate your outreach with multi-step email sequences</p>
            </div>
          </div>
          <div className="campaigns-stats">
            <div className="stat-item">
              <Zap size={18} />
              <span>{campaigns.filter(c => c.is_enabled).length} Active</span>
            </div>
            <div className="stat-item">
              <BarChart3 size={18} />
              <span>{campaigns.length} Total</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="campaigns-content">
        {/* Campaign List */}
        <div className="campaigns-list-section">
          <h2 className="section-title">Available Campaigns</h2>
          <div className="campaigns-grid">
            {campaigns.map(campaign => (
              <div 
                key={campaign.id} 
                className={`campaign-card ${selectedCampaign?.id === campaign.id ? 'selected' : ''} ${campaign.is_enabled ? 'enabled' : 'disabled'}`}
                onClick={() => loadCampaignDetails(campaign.id)}
              >
                <div className="campaign-card-header">
                  <div className="campaign-info">
                    <h3>{campaign.name}</h3>
                    <p>{campaign.description}</p>
                  </div>
                  <button
                    className={`toggle-btn ${campaign.is_enabled ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(campaign.id, campaign.is_enabled);
                    }}
                    disabled={togglingId === campaign.id}
                  >
                    {togglingId === campaign.id ? (
                      <div className="toggle-loading"></div>
                    ) : campaign.is_enabled ? (
                      <Play size={16} />
                    ) : (
                      <Pause size={16} />
                    )}
                    <span>{campaign.is_enabled ? 'Active' : 'Paused'}</span>
                  </button>
                </div>

                <div className="campaign-card-body">
                  <div className="campaign-meta">
                    <div className="meta-item">
                      <Mail size={14} />
                      <span>{campaign.step_count} emails</span>
                    </div>
                    <div className="meta-item triggers-row">
                      <Users size={14} />
                      <span>Triggers on:</span>
                      <div className="trigger-chips">
                        {getTriggerStatusBadges(campaign.trigger_statuses)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Campaign Details */}
        {selectedCampaign && (
          <div className="campaign-details-section">
            <div className="details-header">
              <h2>{selectedCampaign.name}</h2>
              <span className={`status-badge ${selectedCampaign.is_enabled ? 'active' : 'paused'}`}>
                {selectedCampaign.is_enabled ? 'Active' : 'Paused'}
              </span>
            </div>

            <div className="sequence-timeline">
              <h3>Email Sequence</h3>
              <div className="timeline">
                {selectedCampaign.steps.map((step, index) => (
                  <div key={step.id} className="timeline-item">
                    <div className="timeline-marker">
                      <div className="marker-circle">
                        {index + 1}
                      </div>
                      {index < selectedCampaign.steps.length - 1 && (
                        <div className="marker-line"></div>
                      )}
                    </div>
                    <div className="timeline-content">
                      <div className="step-header">
                        <h4>{step.step_name}</h4>
                        <span className="step-timing">
                          <Clock size={14} />
                          {formatDelayText(step.delay_days, step.step_number)}
                        </span>
                      </div>
                      <div className="step-preview">
                        <div className="email-preview">
                          <div className="email-subject">
                            <strong>Subject:</strong> {step.default_subject}
                          </div>
                          <div className={`email-body-preview ${expandedSteps.has(step.id) ? 'expanded' : ''}`}>
                            {expandedSteps.has(step.id) ? (
                              <div dangerouslySetInnerHTML={{ __html: step.default_body }} />
                            ) : (
                              <div dangerouslySetInnerHTML={{ __html: step.default_body.substring(0, 150) + '...' }} />
                            )}
                          </div>
                          <button 
                            className="btn-expand-template"
                            onClick={() => toggleStepExpansion(step.id)}
                          >
                            {expandedSteps.has(step.id) ? (
                              <>
                                <ChevronUp size={14} />
                                Show less
                              </>
                            ) : (
                              <>
                                <ChevronDown size={14} />
                                Show full template
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="campaign-conditions">
              <h3>Trigger Conditions</h3>
              <div className="conditions-grid">
                <div className="condition-item">
                  <CheckCircle size={18} className="condition-icon" />
                  <div>
                    <span className="condition-label">Starts when lead status is:</span>
                    <div className="condition-values">
                      {getTriggerStatusBadges(selectedCampaign.trigger_statuses)}
                    </div>
                  </div>
                </div>
                {selectedCampaign.trigger_conditions && (
                  <div className="condition-item">
                    <Clock size={18} className="condition-icon" />
                    <div>
                      <span className="condition-label">Additional conditions:</span>
                      <span className="condition-value">
                        {JSON.stringify(selectedCampaign.trigger_conditions)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!selectedCampaign && campaigns.length > 0 && (
          <div className="no-selection">
            <Mail size={48} className="no-selection-icon" />
            <h3>Select a Campaign</h3>
            <p>Click on a campaign card to view its email sequence and settings</p>
          </div>
        )}
      </div>
    </div>
  );
};
