import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Search, 
  MapPin, 
  Tag, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Lock,
  Unlock,
  Star,
  ChevronLeft,
  ChevronRight,
  History,
  RefreshCw,
  Building2,
  Eye,
  Package,
  Coins,
  X,
  Sparkles
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { leadsService } from '../../services/leads.service';
import type { 
  GoogleMapsSearchResponseV2,
  GoogleMapsSearchStatusV2,
  GoogleMapsPreviewResponse,
  GoogleMapsUnlockResponse,
  GoogleMapsHistoryResponse,
  GoogleMapsSearchHistoryItem
} from '../../types/leads.types';

interface ToastOptions {
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface GoogleMapsDiscoveryProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadsUnlocked?: (count: number) => void;
  onShowToast?: (toast: ToastOptions) => void;
}

type ViewMode = 'search' | 'preview' | 'history';

export const GoogleMapsDiscovery: React.FC<GoogleMapsDiscoveryProps> = ({
  isOpen,
  onClose,
  onLeadsUnlocked,
  onShowToast
}) => {
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('search');
  
  // Search form state
  const [searchKeywords, setSearchKeywords] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Search result state
  const [currentSearchId, setCurrentSearchId] = useState<number | null>(null);
  const [searchStatus, setSearchStatus] = useState<GoogleMapsSearchStatusV2 | null>(null);
  const [isPollingStatus, setIsPollingStatus] = useState(false);
  
  // Preview state
  const [previewData, setPreviewData] = useState<GoogleMapsPreviewResponse | null>(null);
  const [previewPage, setPreviewPage] = useState(1);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  
  // Unlock state - default will be set when preview loads
  const [selectedBatchSize, setSelectedBatchSize] = useState<number>(1);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockResult, setUnlockResult] = useState<GoogleMapsUnlockResponse | null>(null);
  
  // Deepening state - when searching for more leads in background
  const [isDeepeningInProgress, setIsDeepeningInProgress] = useState(false);
  const [deepeningMessage, setDeepeningMessage] = useState<string | null>(null);
  
  // History state
  const [history, setHistory] = useState<GoogleMapsHistoryResponse | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Check if there's a pending deepening search from a previous session
      const pendingSearchId = sessionStorage.getItem('gmd_deepening_search_id');
      const pendingQuery = sessionStorage.getItem('gmd_deepening_query');
      
      if (pendingSearchId) {
        // Resume the deepening search
        const searchId = parseInt(pendingSearchId, 10);
        setCurrentSearchId(searchId);
        setSearchKeywords(pendingQuery || '');
        setIsDeepeningInProgress(true);
        setDeepeningMessage('🔍 Searching for more leads... Please wait.');
        setViewMode('preview');
        
        // Resume polling and load current preview
        startPolling(searchId);
        loadPreview(searchId, 1);
      } else {
        // Normal reset - no pending deepening
        setViewMode('search');
        setSearchKeywords('');
        setLocation('');
        setFormError(null);
        setCurrentSearchId(null);
        setSearchStatus(null);
        setPreviewData(null);
        setUnlockResult(null);
        setIsDeepeningInProgress(false);
        setDeepeningMessage(null);
      }
    }
    return () => {
      // Only stop polling if NOT deepening - let it continue in background
      const pendingSearchId = sessionStorage.getItem('gmd_deepening_search_id');
      if (pollIntervalRef.current && !pendingSearchId) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
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

  // Poll for search status
  const pollSearchStatus = useCallback(async (searchId: number) => {
    try {
      const status = await leadsService.getGoogleMapsSearchStatusV2(searchId);
      setSearchStatus(status);
      
      // Check if this was a deepening search from sessionStorage
      const storedSearchId = sessionStorage.getItem('gmd_deepening_search_id');
      const storedQuery = sessionStorage.getItem('gmd_deepening_query');
      const wasDeepening = isDeepeningInProgress || storedSearchId === String(searchId);
      
      if (status.status === 'SUCCEEDED') {
        setIsPollingStatus(false);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        
        // Clear deepening state if it was in progress
        if (wasDeepening) {
          setIsDeepeningInProgress(false);
          setDeepeningMessage('✅ Found more leads! Preview updated below.');
          setTimeout(() => setDeepeningMessage(null), 5000);
          
          // Clear sessionStorage
          sessionStorage.removeItem('gmd_deepening_search_id');
          sessionStorage.removeItem('gmd_deepening_query');
          
          // Show toast notification (works even if modal was closed and reopened)
          if (onShowToast) {
            onShowToast({
              type: 'success',
              title: 'More Leads Found!',
              message: `Search for "${storedQuery || searchKeywords}" found additional leads.`,
              duration: 6000
            });
          }
        }
        
        // Auto-load preview
        loadPreview(searchId, 1);
      } else if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status.status)) {
        setIsPollingStatus(false);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        
        // Clear sessionStorage
        sessionStorage.removeItem('gmd_deepening_search_id');
        sessionStorage.removeItem('gmd_deepening_query');
        
        // Clear deepening state on failure
        if (wasDeepening) {
          setIsDeepeningInProgress(false);
          setDeepeningMessage('⚠️ Search for more leads failed. You can continue with existing results.');
          setTimeout(() => setDeepeningMessage(null), 5000);
          
          if (onShowToast) {
            onShowToast({
              type: 'error',
              title: 'Search Failed',
              message: 'The search for additional leads failed. Please try again later.',
              duration: 5000
            });
          }
        } else {
          setFormError(`Search ${status.status.toLowerCase()}. Please try again.`);
        }
      }
    } catch (err) {
      console.error('Error polling status:', err);
    }
  }, [isDeepeningInProgress, onShowToast, searchKeywords]);

  // Start polling
  const startPolling = useCallback((searchId: number) => {
    setIsPollingStatus(true);
    pollSearchStatus(searchId);
    pollIntervalRef.current = setInterval(() => pollSearchStatus(searchId), 3000);
  }, [pollSearchStatus]);

  // Load preview data
  const loadPreview = async (searchId: number, page: number) => {
    setIsLoadingPreview(true);
    setPreviewError(null);
    try {
      const data = await leadsService.getGoogleMapsPreview(searchId, page, 20);
      setPreviewData(data);
      setPreviewPage(page);
      setViewMode('preview');
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Failed to load preview');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Handle search submit
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
      const result: GoogleMapsSearchResponseV2 = await leadsService.startGoogleMapsSearchV2({
        searchKeywords: searchKeywords.trim(),
        city: location.trim()
      });

      setCurrentSearchId(result.search_id);
      
      if (result.status === 'SUCCEEDED') {
        // Existing completed search - load preview directly
        setSearchStatus({
          search_id: result.search_id,
          status: result.status,
          unique_records: result.unique_records,
          unlocked_count: result.unlocked_count,
          available_to_unlock: result.unique_records - result.unlocked_count,
          progress: 100
        });
        loadPreview(result.search_id, 1);
      } else if (result.status === 'RUNNING') {
        // New or in-progress search - start polling
        startPolling(result.search_id);
      } else {
        setFormError(`Search status: ${result.status}. Please try again.`);
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to start search');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle unlock
  const handleUnlock = async () => {
    if (!currentSearchId || !previewData) return;
    
    setIsUnlocking(true);
    setUnlockResult(null);
    setDeepeningMessage(null);
    
    try {
      // Determine the actual batch size to unlock
      const available = previewData.available_to_unlock || 0;
      const batchSizes = previewData.unlock_batches || [25, 50, 75, 100];
      const minBatchSize = Math.min(...batchSizes);
      
      // If available is less than minimum batch size, unlock all available
      const batchToUnlock = available < minBatchSize ? available : Math.min(selectedBatchSize, available);
      
      const result = await leadsService.unlockGoogleMapsResults(currentSearchId, batchToUnlock);
      setUnlockResult(result);
      
      // Always refresh the preview to remove just-unlocked items
      await loadPreview(currentSearchId, 1);
      
      // Check if deepening was triggered
      if (result.deepening_triggered) {
        setIsDeepeningInProgress(true);
        const newMax = result.deepening_result?.new_max_places || 'more';
        setDeepeningMessage(`🔍 Searching for more leads... Expanding search to find up to ${newMax} businesses.`);
        
        // Store in sessionStorage so we can show notification even if popup closes
        sessionStorage.setItem('gmd_deepening_search_id', String(currentSearchId));
        sessionStorage.setItem('gmd_deepening_query', searchKeywords);
        
        // Start polling to check when the new search completes
        startPolling(currentSearchId);
      } else {
        // Refresh status
        await pollSearchStatus(currentSearchId);
      }
      
      // Notify parent
      if (result.unlocked > 0 && onLeadsUnlocked) {
        onLeadsUnlocked(result.unlocked);
      }
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Failed to unlock results');
    } finally {
      setIsUnlocking(false);
    }
  };

  // Load history
  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const data = await leadsService.getGoogleMapsHistory(1, 10);
      setHistory(data);
      setViewMode('history');
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Resume a search from history
  const handleResumeSearch = (item: GoogleMapsSearchHistoryItem) => {
    setCurrentSearchId(item.search_id);
    setSearchKeywords(item.query_text);
    setLocation(item.location_text);
    
    if (item.status === 'SUCCEEDED') {
      loadPreview(item.search_id, 1);
    } else if (item.status === 'RUNNING') {
      startPolling(item.search_id);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="gmd-overlay" onClick={onClose}>
      <div className="gmd-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="gmd-header">
          <div className="gmd-header-content">
            <div className="gmd-header-icon">
              <Building2 size={28} />
            </div>
            <div className="gmd-header-text">
              <h2>Google Maps Discovery</h2>
              <p>Search, preview, and unlock business leads</p>
            </div>
          </div>
          <div className="gmd-header-actions">
            {viewMode !== 'history' && (
              <button 
                className="gmd-history-btn"
                onClick={loadHistory}
                disabled={isLoadingHistory}
                title="View search history"
              >
                <History size={20} />
                <span>History</span>
              </button>
            )}
            {viewMode !== 'search' && (
              <button 
                className="gmd-back-btn"
                onClick={() => setViewMode('search')}
              >
                <ChevronLeft size={20} />
                <span>New Search</span>
              </button>
            )}
            <button className="gmd-close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {/* Content */}
        <div className="gmd-content">
          {/* Search View */}
          {viewMode === 'search' && (
            <div className="gmd-search-view">
              <form onSubmit={handleSubmit} className="gmd-search-form">
                {formError && (
                  <div className="gmd-error-alert">
                    <AlertCircle size={16} />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="gmd-input-group">
                  <Input
                    label="Search Keywords"
                    name="keywords"
                    type="text"
                    placeholder="e.g., restaurants, dental clinics, plumbers"
                    icon={<Tag size={18} />}
                    value={searchKeywords}
                    onChange={(e) => setSearchKeywords(e.target.value)}
                    disabled={isSubmitting || isPollingStatus}
                  />
                  <span className="gmd-input-hint">
                    Separate multiple keywords with commas
                  </span>
                </div>

                <div className="gmd-input-group">
                  <Input
                    label="Location"
                    name="location"
                    type="text"
                    placeholder="e.g., San Francisco, CA, USA"
                    icon={<MapPin size={18} />}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={isSubmitting || isPollingStatus}
                  />
                  <span className="gmd-input-hint">
                    City, State, and Country for best results
                  </span>
                </div>

                {/* Searching Progress */}
                {isPollingStatus && searchStatus && (
                  <div className="gmd-progress-section">
                    <div className="gmd-progress-spinner">
                      <Loader2 size={32} className="spinning" />
                    </div>
                    <p className="gmd-progress-text">
                      Searching Google Maps...
                    </p>
                    <div className="gmd-progress-bar">
                      <div 
                        className="gmd-progress-fill" 
                        style={{ width: `${searchStatus.progress || 10}%` }}
                      />
                    </div>
                    <span className="gmd-progress-status">
                      Status: {searchStatus.status} • Found: {searchStatus.unique_records || 0} results
                    </span>
                  </div>
                )}

                {/* Info Box */}
                {!isPollingStatus && (
                  <div className="gmd-info-box">
                    <div className="gmd-info-icon">
                      <Search size={20} />
                    </div>
                    <div className="gmd-info-content">
                      <strong>How it works</strong>
                      <p>
                        Search Google Maps for businesses matching your keywords.
                        Preview results for free, then unlock batches of 25-100 to add them as leads.
                      </p>
                    </div>
                  </div>
                )}

                <div className="gmd-form-actions">
                  <Button type="button" variant="secondary" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    variant="primary" 
                    isLoading={isSubmitting}
                    disabled={isPollingStatus}
                  >
                    {isSubmitting ? 'Starting...' : 'Search'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Preview View */}
          {viewMode === 'preview' && (
            <div className="gmd-preview-view">
              {/* Deepening Banner */}
              {deepeningMessage && (
                <div className={`gmd-deepening-banner ${isDeepeningInProgress ? 'searching' : 'success'}`}>
                  {isDeepeningInProgress && (
                    <div className="gmd-deepening-spinner">
                      <Loader2 size={18} className="spinning" />
                    </div>
                  )}
                  {!isDeepeningInProgress && (
                    <Sparkles size={18} className="gmd-deepening-icon" />
                  )}
                  <span>{deepeningMessage}</span>
                  {!isDeepeningInProgress && (
                    <button 
                      className="gmd-deepening-dismiss" 
                      onClick={() => setDeepeningMessage(null)}
                      title="Dismiss"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              )}
              
              {/* Preview Header Stats */}
              <div className="gmd-preview-header">
                <div className="gmd-stats-grid">
                  <div className="gmd-stat-card">
                    <div className="gmd-stat-icon total">
                      <Eye size={20} />
                    </div>
                    <div className="gmd-stat-content">
                      <span className="gmd-stat-value">{previewData?.unique_records || searchStatus?.unique_records || 0}</span>
                      <span className="gmd-stat-label">Total Found</span>
                    </div>
                  </div>
                  <div className="gmd-stat-card">
                    <div className="gmd-stat-icon unlocked">
                      <Unlock size={20} />
                    </div>
                    <div className="gmd-stat-content">
                      <span className="gmd-stat-value">{previewData?.unlocked_count || searchStatus?.unlocked_count || 0}</span>
                      <span className="gmd-stat-label">Unlocked</span>
                    </div>
                  </div>
                  <div className="gmd-stat-card">
                    <div className="gmd-stat-icon available">
                      <Package size={20} />
                    </div>
                    <div className="gmd-stat-content">
                      <span className="gmd-stat-value">{previewData?.available_to_unlock || searchStatus?.available_to_unlock || 0}</span>
                      <span className="gmd-stat-label">Available</span>
                    </div>
                  </div>
                </div>

                {/* Unlock Section */}
                {(() => {
                  const available = previewData?.available_to_unlock || searchStatus?.available_to_unlock || 0;
                  const credits = previewData?.credits_balance ?? 0;
                  const batchSizes = previewData?.unlock_batches || [25, 50, 75, 100];
                  const minBatchSize = Math.min(...batchSizes);
                  const showUnlockAll = available > 0 && available < minBatchSize;
                  const showBatchSelector = available >= minBatchSize;

                  if (available <= 0) return null;

                  // Check if user can't unlock due to insufficient credits
                  const insufficientCredits = credits < minBatchSize && credits < available;

                  return (
                    <div className="gmd-unlock-section">
                      {/* Credits Badge */}
                      <div className="gmd-credits-badge">
                        <Coins size={14} />
                        <span>{credits} credits</span>
                      </div>

                      {showBatchSelector && (
                        <div className="gmd-batch-selector">
                          <span className="gmd-batch-label">Unlock batch:</span>
                          <div className="gmd-batch-options">
                            {batchSizes.map(size => {
                              const disabledDueToAvailable = size > available;
                              const disabledDueToCredits = size > credits;
                              const isDisabled = isUnlocking || disabledDueToAvailable || disabledDueToCredits;
                              
                              return (
                                <button
                                  key={size}
                                  className={`gmd-batch-btn ${selectedBatchSize === size ? 'active' : ''} ${disabledDueToCredits && !disabledDueToAvailable ? 'no-credits' : ''}`}
                                  onClick={() => setSelectedBatchSize(size)}
                                  disabled={isDisabled}
                                  title={disabledDueToCredits && !disabledDueToAvailable ? `Need ${size} credits (you have ${credits})` : disabledDueToAvailable ? `Only ${available} leads available` : ''}
                                >
                                  {String(size)}
                                </button>
                              );
                            })}
                          </div>
                          {insufficientCredits && (
                            <span className="gmd-credits-hint">
                              <Coins size={12} />
                              Insufficient credits for larger batches
                            </span>
                          )}
                        </div>
                      )}
                      {showUnlockAll ? (
                        <Button 
                          variant="primary" 
                          onClick={handleUnlock}
                          isLoading={isUnlocking}
                          disabled={isUnlocking || credits < available}
                          title={credits < available ? `Need ${available} credits (you have ${credits})` : ''}
                        >
                          <Unlock size={16} />
                          <span>Unlock All {available} Leads</span>
                        </Button>
                      ) : (
                        <Button 
                          variant="primary" 
                          onClick={handleUnlock}
                          isLoading={isUnlocking}
                          disabled={isUnlocking || selectedBatchSize > available || selectedBatchSize > credits}
                          title={selectedBatchSize > credits ? `Need ${selectedBatchSize} credits (you have ${credits})` : ''}
                        >
                          <Unlock size={16} />
                          <span>Unlock {Math.min(selectedBatchSize, available)} Leads</span>
                        </Button>
                      )}
                    </div>
                  );
                })()}

                {/* Unlock Result Message */}
                {unlockResult && (
                  <div className={`gmd-unlock-result ${unlockResult.success ? 'success' : 'error'}`}>
                    <CheckCircle size={16} />
                    <span>{unlockResult.message}</span>
                  </div>
                )}
              </div>

              {/* Preview Loading */}
              {isLoadingPreview && (
                <div className="gmd-preview-loading">
                  <Loader2 size={32} className="spinning" />
                  <p>Loading preview...</p>
                </div>
              )}

              {/* Preview Error */}
              {previewError && (
                <div className="gmd-error-alert">
                  <AlertCircle size={16} />
                  <span>{previewError}</span>
                </div>
              )}

              {/* Preview Table - Shows only items available to unlock */}
              {!isLoadingPreview && previewData && (
                <>
                  <div className="gmd-preview-table-container">
                    <table className="gmd-preview-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Business Name</th>
                          <th>Address</th>
                          <th>Phone</th>
                          <th>Website</th>
                          <th>Rating</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.items.map((item, index) => (
                          <tr key={item.place_id}>
                            <td className="gmd-table-index">
                              {((previewData.pagination?.page || 1) - 1) * (previewData.pagination?.per_page || 20) + index + 1}
                            </td>
                            <td className="gmd-table-name">
                              <strong>{item.title || 'N/A'}</strong>
                              {item.category && <span className="gmd-table-category">{item.category}</span>}
                            </td>
                            <td className="gmd-table-address">
                              {[item.address, item.city, item.state].filter(Boolean).join(', ') || 'N/A'}
                            </td>
                            <td className="gmd-table-masked">
                              <span className="gmd-masked-value">
                                <Lock size={12} />
                                ••••••••
                              </span>
                            </td>
                            <td className="gmd-table-masked">
                              <span className="gmd-masked-value">
                                <Lock size={12} />
                                ••••••
                              </span>
                            </td>
                            <td className="gmd-table-rating">
                              {item.rating ? (
                                <>
                                  <Star size={12} className="star-icon" />
                                  {item.rating.toFixed(1)}
                                  {item.review_count !== undefined && <span className="review-count">({item.review_count})</span>}
                                </>
                              ) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {previewData.pagination.total_pages > 1 && (
                    <div className="gmd-pagination">
                      <button
                        className="gmd-page-btn"
                        onClick={() => currentSearchId && loadPreview(currentSearchId, previewPage - 1)}
                        disabled={!previewData.pagination.has_prev || isLoadingPreview}
                      >
                        <ChevronLeft size={18} />
                        Previous
                      </button>
                      <span className="gmd-page-info">
                        Page {previewPage} of {previewData.pagination.total_pages}
                      </span>
                      <button
                        className="gmd-page-btn"
                        onClick={() => currentSearchId && loadPreview(currentSearchId, previewPage + 1)}
                        disabled={!previewData.pagination.has_next || isLoadingPreview}
                      >
                        Next
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* History View */}
          {viewMode === 'history' && (
            <div className="gmd-history-view">
              <h3 className="gmd-history-title">
                <History size={20} />
                <span>Search History</span>
              </h3>
              
              {isLoadingHistory ? (
                <div className="gmd-history-loading">
                  <Loader2 size={24} className="spinning" />
                  <p>Loading history...</p>
                </div>
              ) : history && history.items.length > 0 ? (
                <div className="gmd-history-list">
                  {history.items.map((item) => (
                    <div key={item.search_id} className="gmd-history-item">
                      <div className="gmd-history-info">
                        <div className="gmd-history-query">
                          <Tag size={14} />
                          <span>{item.query_text}</span>
                        </div>
                        <div className="gmd-history-location">
                          <MapPin size={14} />
                          <span>{item.location_text}</span>
                        </div>
                        <div className="gmd-history-stats">
                          <span className="gmd-history-status" data-status={item.status.toLowerCase()}>
                            {item.status}
                          </span>
                          <span>{item.unique_records} found</span>
                          <span>{item.unlocked_count} unlocked</span>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleResumeSearch(item)}
                      >
                        <RefreshCw size={14} />
                        Resume
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="gmd-history-empty">
                  <History size={48} />
                  <p>No search history yet</p>
                  <Button variant="outline" onClick={() => setViewMode('search')}>
                    Start your first search
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


