import React, { useState, useEffect, useRef } from 'react';
import { X, Map, Search, Loader2, CheckCircle, AlertCircle, MapPin, Tag } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { leadsService } from '../../services/leads.service';
import type { GoogleMapsSearchStatus } from '../../types/leads.types';

interface GoogleMapsSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (result: { businessesAdded: number; leadsAdded: number; contactsAdded: number }) => void;
  onBackgroundSearch?: (runId: string) => void;
}

type ModalStep = 'input' | 'searching' | 'complete' | 'error';

export const GoogleMapsSearchModal: React.FC<GoogleMapsSearchModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  onBackgroundSearch
}) => {
  // Form state
  const [searchKeywords, setSearchKeywords] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Search progress state
  const [currentStep, setCurrentStep] = useState<ModalStep>('input');
  const [runId, setRunId] = useState<string | null>(null);
  const [searchStatus, setSearchStatus] = useState<GoogleMapsSearchStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultsCount, setResultsCount] = useState({ businesses: 0, leads: 0, contacts: 0 });

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchKeywords('');
      setLocation('');
      setFormError(null);
      setCurrentStep('input');
      setRunId(null);
      setSearchStatus(null);
      setErrorMessage(null);
      setResultsCount({ businesses: 0, leads: 0, contacts: 0 });
    }
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Poll for status when searching
  useEffect(() => {
    if (currentStep === 'searching' && runId) {
      const pollStatus = async () => {
        try {
          const status = await leadsService.getGoogleMapsSearchStatus(runId);
          setSearchStatus(status);

          console.log('Status poll response:', status);

          if (status.status === 'SUCCEEDED') {
            setCurrentStep('complete');
            setResultsCount({
              businesses: status.businesses_added ?? 0,
              leads: status.leads_added ?? 0,
              contacts: status.contacts_added ?? 0
            });
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
            }
          } else if (status.status === 'FAILED' || status.status === 'ABORTED') {
            setCurrentStep('error');
            setErrorMessage(status.error_message || 'Search failed. Please try again.');
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
            }
          }
        } catch (err) {
          console.error('Error polling status:', err);
        }
      };

      pollStatus();
      pollIntervalRef.current = setInterval(pollStatus, 3000);

      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      };
    }
  }, [currentStep, runId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!searchKeywords.trim()) {
      setFormError('Please enter at least one search keyword');
      return;
    }
    if (!location.trim()) {
      setFormError('Please enter a location');
      return;
    }

    setIsSubmitting(true);

    try {
      const keywords = searchKeywords.split(',').map(k => k.trim()).filter(Boolean);
      const result = await leadsService.startGoogleMapsSearch({
        searchStrings: keywords,
        location: location.trim()
      });

      if (result.run_id) {
        setRunId(result.run_id);
        setCurrentStep('searching');
      } else {
        setFormError('Failed to start search. Please try again.');
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to start search');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = () => {
    onComplete({
      businessesAdded: resultsCount.businesses,
      leadsAdded: resultsCount.leads,
      contactsAdded: resultsCount.contacts
    });
    onClose();
  };

  const handleClose = () => {
    // If search is in progress, notify parent to continue polling in background
    if (currentStep === 'searching' && runId) {
      onBackgroundSearch?.(runId);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="manual-lead-modal google-maps-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={handleClose}>
          <X size={20} />
        </button>

        <div className="modal-header">
          <div className="modal-header-icon">
            <Map size={24} />
          </div>
          <div className="modal-header-text">
            <h2>Google Maps Discovery</h2>
            <p>Find local businesses and add them as leads</p>
          </div>
        </div>

        <div className="modal-content">
          {/* Input Step */}
          {currentStep === 'input' && (
            <form onSubmit={handleSubmit} className="google-maps-form">
              {formError && (
                <div className="form-error-alert">
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              <Input
                label="Search Keywords"
                name="keywords"
                type="text"
                placeholder="e.g., restaurants, dental clinics, plumbers"
                icon={<Tag size={18} />}
                value={searchKeywords}
                onChange={(e) => setSearchKeywords(e.target.value)}
                disabled={isSubmitting}
              />
              <span className="input-hint">
                Separate multiple keywords with commas
              </span>

              <Input
                label="Location"
                name="location"
                type="text"
                placeholder="e.g., San Francisco, CA, USA"
                icon={<MapPin size={18} />}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={isSubmitting}
              />
              <span className="input-hint">
                City, State, and Country for best results
              </span>

              <div className="info-box">
                <div className="info-box-icon">
                  <Search size={18} />
                </div>
                <div className="info-box-content">
                  <strong>How it works</strong>
                  <p>
                    We'll search Google Maps for businesses matching your keywords
                    in the specified location. Each result will be added as a new
                    business lead with contact information when available.
                  </p>
                </div>
              </div>

              <div className="form-actions">
                <Button type="button" variant="secondary" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isSubmitting}>
                  {isSubmitting ? 'Starting...' : 'Start Search'}
                </Button>
              </div>
            </form>
          )}

          {/* Searching Step */}
          {currentStep === 'searching' && (
            <div className="search-progress-container">
              <div className="progress-spinner-wrapper">
                <Loader2 size={48} className="progress-spinner" />
              </div>

              <h3>Searching Google Maps...</h3>
              <p>
                Looking for <strong>{searchKeywords}</strong> in <strong>{location}</strong>
              </p>

              <div className="progress-bar-wrapper">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${searchStatus?.progress ?? 10}%` }}
                />
              </div>
              <span className="progress-label">
                Status: {searchStatus?.status || 'Initializing...'}
              </span>

              <div className="progress-note-box">
                <p>This may take a minute. You can close this window and we'll notify you when complete.</p>
              </div>
            </div>
          )}

          {/* Complete Step */}
          {currentStep === 'complete' && (
            <div className="search-complete-container">
              <div className="success-icon-wrapper">
                <CheckCircle size={48} />
              </div>

              <h3>Search Complete!</h3>
              <p>We found and added the following to your leads:</p>

              <div className="results-grid">
                <div className="result-card">
                  <span className="result-value">{resultsCount.businesses}</span>
                  <span className="result-label">Businesses</span>
                </div>
                <div className="result-card">
                  <span className="result-value">{resultsCount.leads}</span>
                  <span className="result-label">Leads</span>
                </div>
                <div className="result-card">
                  <span className="result-value">{resultsCount.contacts}</span>
                  <span className="result-label">Contacts</span>
                </div>
              </div>

              <div className="form-actions">
                <Button variant="primary" onClick={handleComplete}>
                  View Leads
                </Button>
              </div>
            </div>
          )}

          {/* Error Step */}
          {currentStep === 'error' && (
            <div className="search-error-container">
              <div className="error-icon-wrapper">
                <AlertCircle size={48} />
              </div>

              <h3>Search Failed</h3>
              <p>{errorMessage || 'An unexpected error occurred. Please try again.'}</p>

              <div className="form-actions">
                <Button variant="secondary" onClick={handleClose}>
                  Close
                </Button>
                <Button variant="primary" onClick={() => setCurrentStep('input')}>
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
