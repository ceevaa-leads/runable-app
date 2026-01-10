import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Search, 
  Loader2, 
  AlertCircle,
  Lock,
  Unlock,
  Star,
  ChevronLeft,
  ChevronRight,
  History,
  RefreshCw,
  Eye,
  Package,
  Coins,
  X,
  Sparkles,
  Filter,
  CheckCircle2,
  Circle,
  ExternalLink,
  Phone,
  MapPin,
  HelpCircle
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { leadsService } from '../../services/leads.service';
import { ToastContainer, useToast } from '../../components/ui/Toast';
import type { 
  GoogleMapsSearchStatusV2,
  GoogleMapsPreviewResponse,
  GoogleMapsHistoryResponse,
  GoogleMapsSearchHistoryItem
} from '../../types/leads.types';

type TabType = 'new-search' | 'history';
type HistoryFilter = 'all' | 'running' | 'completed' | 'has-available';
type HistorySearch = string;

export const SearchPage: React.FC = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('new-search');
  
  // Search form state
  const [searchKeywords, setSearchKeywords] = useState('');
  const [country, setCountry] = useState('US');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [county, setCounty] = useState('');
  const [postalCode, setPostalCode] = useState('');
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
  
  // Unlock state
  const [selectedBatchSize, setSelectedBatchSize] = useState<number>(1);
  const [isUnlocking, setIsUnlocking] = useState(false);
  
  // Deepening state
  const [isDeepeningInProgress, setIsDeepeningInProgress] = useState(false);
  const [deepeningMessage, setDeepeningMessage] = useState<string | null>(null);
  
  // History state
  const [history, setHistory] = useState<GoogleMapsHistoryResponse | null>(null);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all');
  const [historySearchText, setHistorySearchText] = useState<HistorySearch>('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Toast
  const { toasts, addToast, dismissToast } = useToast();
  
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-select first batch size when preview loads
  useEffect(() => {
    if (previewData?.unlock_batches && previewData.unlock_batches.length > 0) {
      const available = previewData.available_to_unlock || 0;
      const credits = previewData.credits_balance ?? 0;
      const sortedBatches = [...previewData.unlock_batches].sort((a, b) => a - b);
      
      const firstEnabled = sortedBatches.find(size => size <= available && size <= credits);
      if (firstEnabled) {
        setSelectedBatchSize(firstEnabled);
      } else if (available > 0 && available < sortedBatches[0]) {
        setSelectedBatchSize(available);
      }
    }
  }, [previewData]);

  // Load preview data
  const loadPreview = async (searchId: number, page: number) => {
    setIsLoadingPreview(true);
    setPreviewError(null);
    try {
      const data = await leadsService.getGoogleMapsPreview(searchId, page, 50); // Increased per_page
      setPreviewData(data);
      setPreviewPage(page);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Failed to load preview');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Poll for search status
  const pollSearchStatus = useCallback(async (searchId: number) => {
    try {
      const status = await leadsService.getGoogleMapsSearchStatusV2(searchId);
      setSearchStatus(status);
      
      const storedSearchId = sessionStorage.getItem('gmd_deepening_search_id');
      const storedQuery = sessionStorage.getItem('gmd_deepening_query');
      const wasDeepening = isDeepeningInProgress || storedSearchId === String(searchId);
      
      if (status.status === 'SUCCEEDED') {
        setIsPollingStatus(false);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        
        if (wasDeepening) {
          setIsDeepeningInProgress(false);
          setDeepeningMessage('✅ Found more leads! Results updated below.');
          setTimeout(() => setDeepeningMessage(null), 5000);
          
          sessionStorage.removeItem('gmd_deepening_search_id');
          sessionStorage.removeItem('gmd_deepening_query');
          
          addToast({
            type: 'success',
            title: 'More Leads Found!',
            message: `Search for "${storedQuery || searchKeywords}" found additional leads.`,
            duration: 3000
          });
        }
        
        loadPreview(searchId, 1);
      } else if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status.status)) {
        setIsPollingStatus(false);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        
        sessionStorage.removeItem('gmd_deepening_search_id');
        sessionStorage.removeItem('gmd_deepening_query');
        
        if (wasDeepening) {
          setIsDeepeningInProgress(false);
          setDeepeningMessage('⚠️ Search for more leads failed. You can continue with existing results.');
          setTimeout(() => setDeepeningMessage(null), 5000);
        } else {
          setFormError(`Search ${status.status.toLowerCase()}. Please try again.`);
        }
      }
    } catch (err) {
      console.error('Error polling status:', err);
    }
  }, [isDeepeningInProgress, searchKeywords, addToast]);

  // Start polling - background mode for deepening doesn't hide results
  const startPolling = useCallback((searchId: number, background: boolean = false) => {
    if (!background) {
      setIsPollingStatus(true);
    }
    pollSearchStatus(searchId);
    pollIntervalRef.current = setInterval(() => pollSearchStatus(searchId), 3000);
  }, [pollSearchStatus]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Handle search submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!searchKeywords.trim()) {
      setFormError('Please enter search keywords');
      return;
    }
    // At least one location field should be provided
    if (!country.trim() && !city.trim() && !state.trim() && !county.trim() && !postalCode.trim()) {
      setFormError('Please enter at least one location field');
      return;
    }

    setIsSubmitting(true);
    setPreviewData(null);

    try {
      const result = await leadsService.startGoogleMapsSearchV2({
        searchKeywords: searchKeywords.trim(),
        countryCode: country.trim().toLowerCase(),
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        county: county.trim() || undefined,
        postalCode: postalCode.trim() || undefined
      });

      setCurrentSearchId(result.search_id);

      if (result.status === 'SUCCEEDED') {
        loadPreview(result.search_id, 1);
      } else if (result.status === 'RUNNING') {
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
    setDeepeningMessage(null);
    
    try {
      const available = previewData.available_to_unlock || 0;
      const batchSizes = previewData.unlock_batches || [25, 50, 75, 100];
      const minBatchSize = Math.min(...batchSizes);
      const batchToUnlock = available < minBatchSize ? available : Math.min(selectedBatchSize, available);
      
      const result = await leadsService.unlockGoogleMapsResults(currentSearchId, batchToUnlock);
      
      // Refresh preview to show revealed data
      await loadPreview(currentSearchId, previewPage);
      
      // Check if deepening was triggered - use background polling to not block UI
      if (result.deepening_triggered) {
        setIsDeepeningInProgress(true);
        const newMax = result.deepening_result?.new_max_places || 'more';
        setDeepeningMessage(`🔍 Finding more leads in background... Expanding search to find up to ${newMax} leads.`);
        
        sessionStorage.setItem('gmd_deepening_search_id', String(currentSearchId));
        sessionStorage.setItem('gmd_deepening_query', searchKeywords);
        
        // Use background polling so results remain visible
        startPolling(currentSearchId, true);
      }
      
      // Show success toast
      if (result.unlocked > 0) {
        addToast({
          type: 'success',
          title: 'Leads Unlocked',
          message: `Successfully unlocked ${result.unlocked} leads. ${result.credits_remaining} credits remaining.`,
          duration: 3000
        });
        
        loadHistory();
      }
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Failed to unlock results');
      addToast({
        type: 'error',
        title: 'Unlock Failed',
        message: err instanceof Error ? err.message : 'Failed to unlock results',
        duration: 3000
      });
    } finally {
      setIsUnlocking(false);
    }
  };

  // Load history - load all items for client-side filtering
  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const data = await leadsService.getGoogleMapsHistory(1, 100); // Load more items
      setHistory(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load history when tab changes or on mount
  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  // Initial history load for count
  useEffect(() => {
    loadHistory();
  }, []);

  // Resume a search from history
  const handleResumeSearch = (item: GoogleMapsSearchHistoryItem) => {
    setCurrentSearchId(item.search_id);
    setSearchKeywords(item.query_text);
    
    // Parse location text if possible (format: "City, State, Country" or similar)
    // For now, we'll just clear the individual fields since we're viewing results
    // The location is already saved in the search, so this is just for display
    const locationParts = item.location_text.split(',').map(s => s.trim());
    if (locationParts.length >= 1) setCity(locationParts[0] || '');
    if (locationParts.length >= 2) setState(locationParts[1] || '');
    if (locationParts.length >= 3) setCountry(locationParts[2] || '');
    
    setActiveTab('new-search');
    
    if (item.status === 'SUCCEEDED') {
      loadPreview(item.search_id, 1);
    } else if (item.status === 'RUNNING') {
      startPolling(item.search_id);
    }
  };

  // Filter history items - by status and search text
  const filteredHistory = history?.items.filter(item => {
    // Filter by status
    let matchesFilter = true;
    switch (historyFilter) {
      case 'running':
        matchesFilter = item.status === 'RUNNING';
        break;
      case 'completed':
        matchesFilter = item.status === 'SUCCEEDED';
        break;
      case 'has-available':
        matchesFilter = (item.available_to_unlock || 0) > 0;
        break;
    }
    
    // Filter by search text
    const searchLower = historySearchText.toLowerCase().trim();
    const matchesSearch = !searchLower || 
      item.query_text.toLowerCase().includes(searchLower) ||
      item.location_text.toLowerCase().includes(searchLower);
    
    return matchesFilter && matchesSearch;
  }) || [];

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return <Loader2 size={16} className="spinning" />;
      case 'SUCCEEDED':
        return <CheckCircle2 size={16} className="text-success" />;
      case 'FAILED':
      case 'ABORTED':
      case 'TIMED-OUT':
        return <AlertCircle size={16} className="text-error" />;
      default:
        return <Circle size={16} />;
    }
  };

  const historyCount = history?.pagination?.total_items || 0;

  const showLandingView = activeTab === 'new-search' && !previewData && !isPollingStatus && !isSubmitting;

  return (
    <div className={`search-page-compact ${showLandingView ? 'landing-mode' : ''}`}>
      {/* Header Bar */}
      <div className="search-header-bar">
        <div className="search-header-left">
          <div className="search-brand">
            <div className="brand-icon">
              <MapPin size={20} />
            </div>
            <div className="brand-text">
              <h1>Lead Discovery</h1>
              {showLandingView && <p className="brand-tagline">Find your next customers with ease</p>}
            </div>
          </div>
        </div>
        <div className="search-header-right">
          {previewData && (
            <div className="search-credits-badge">
              <Coins size={16} />
              <span>{previewData.credits_balance ?? 0} credits</span>
            </div>
          )}
          <div className="search-tabs-inline">
            <button 
              className={`search-tab-btn ${activeTab === 'new-search' ? 'active' : ''}`}
              onClick={() => setActiveTab('new-search')}
            >
              <Search size={16} />
              Search
            </button>
            <button 
              className={`search-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <History size={16} />
              History {historyCount > 0 && <span className="tab-count">{historyCount}</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="search-main-content">
        {/* New Search Tab */}
        {activeTab === 'new-search' && (
          <>
            {/* Search Form - Hero Style when landing, Compact when showing results */}
            {showLandingView ? (
              /* Full Hero Form for Landing */
              <div className="search-form-container hero-mode">
                <div className="search-hero-text">
                  <h2>Discover Local Businesses</h2>
                  <p>Search millions of businesses and unlock their contact details</p>
                </div>
                <form onSubmit={handleSubmit} className="search-form-hero">
                  {/* Search Keywords */}
                  <div className="search-field-block">
                    <label className="search-field-label">
                      <Search size={16} />
                      Business Type or Keywords
                    </label>
                    <input
                      type="text"
                      value={searchKeywords}
                      onChange={(e) => setSearchKeywords(e.target.value)}
                      placeholder="e.g., Dentists, Plumbers, Coffee Shops, Restaurants"
                      disabled={isSubmitting || isPollingStatus}
                      className="search-field-input search-field-input-lg"
                    />
                  </div>

                  {/* Location Fields - Two Rows */}
                  <div className="search-field-block">
                    <label className="search-field-label">
                      <MapPin size={16} />
                      Location
                    </label>
                    <div className="search-location-fields">
                      <div className="search-location-row-top">
                        <input
                          type="text"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          placeholder="Country (e.g., US)"
                          disabled={isSubmitting || isPollingStatus}
                          className="search-field-input search-field-input-sm"
                        />
                        <div className="search-field-with-help">
                          <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="City (e.g., Los Angeles)"
                            disabled={isSubmitting || isPollingStatus}
                            className="search-field-input"
                          />
                          <span className="field-help-icon" data-tooltip="Do not include State or Country names here.">
                            <HelpCircle size={14} />
                          </span>
                        </div>
                        <input
                          type="text"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          placeholder="State (e.g., California)"
                          disabled={isSubmitting || isPollingStatus}
                          className="search-field-input"
                        />
                      </div>
                      <div className="search-location-row-bottom">
                        <div className="search-field-with-help">
                          <input
                            type="text"
                            value={county}
                            onChange={(e) => setCounty(e.target.value)}
                            placeholder="County (optional)"
                            disabled={isSubmitting || isPollingStatus}
                            className="search-field-input"
                          />
                          <span className="field-help-icon" data-tooltip="County may represent different administrative areas in different countries.">
                            <HelpCircle size={14} />
                          </span>
                        </div>
                        <div className="search-field-with-help">
                          <input
                            type="text"
                            value={postalCode}
                            onChange={(e) => setPostalCode(e.target.value)}
                            placeholder="Postal Code (e.g., 90210)"
                            disabled={isSubmitting || isPollingStatus}
                            className="search-field-input"
                          />
                          <span className="field-help-icon" data-tooltip="Combine Postal code only with Country, never with City. One postal code at a time.">
                            <HelpCircle size={14} />
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="search-field-hint">Enter at least one location field</p>
                  </div>

                  {/* Search Button */}
                  <Button 
                    type="submit" 
                    variant="primary"
                    isLoading={isSubmitting}
                    disabled={isSubmitting || isPollingStatus}
                    className="search-btn-hero"
                  >
                    <Search size={18} />
                    Search Leads
                  </Button>
                </form>
              </div>
            ) : (
              /* Compact Search Summary when showing results */
              <div className="search-summary-bar">
                <div className="search-summary-info">
                  <span className="search-summary-keyword">{searchKeywords}</span>
                  <span className="search-summary-separator">in</span>
                  <span className="search-summary-location">
                    {[city, state, country].filter(Boolean).join(', ') || 'All Locations'}
                  </span>
                </div>
                <button 
                  className="search-summary-new-btn"
                  onClick={() => {
                    setPreviewData(null);
                    setCurrentSearchId(null);
                    setSearchKeywords('');
                    setCountry('US');
                    setCity('');
                    setState('');
                    setCounty('');
                    setPostalCode('');
                  }}
                >
                  <Search size={14} />
                  New Search
                </button>
              </div>
            )}

            {/* Error display */}
            {formError && (
              <div className="search-error-inline">
                <AlertCircle size={14} />
                <span>{formError}</span>
              </div>
            )}

            {/* Polling Status Banner */}
            {isPollingStatus && searchStatus && (
              <div className="search-status-banner">
                <Loader2 size={18} className="spinning" />
                <span>Searching... Found {searchStatus.unique_records || 0} leads</span>
              </div>
            )}

            {/* Deepening Banner - always dismissible, non-blocking */}
            {deepeningMessage && (
              <div className={`search-status-banner deepening ${isDeepeningInProgress ? 'info' : 'success'}`}>
                {isDeepeningInProgress ? <Loader2 size={18} className="spinning" /> : <Sparkles size={18} />}
                <span>{deepeningMessage}</span>
                <button onClick={() => setDeepeningMessage(null)} className="banner-close" title="Dismiss (search continues in background)">
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Results Section */}
            {previewData && !isPollingStatus && (
              <div className="search-results-compact">
                {/* Compact Stats & Unlock Bar */}
                <div className="search-action-bar">
                  <div className="search-stats-inline">
                    <span className="stat-item">
                      <Eye size={14} />
                      {previewData.unique_records || 0} found
                    </span>
                    <span className="stat-item success">
                      <Unlock size={14} />
                      {previewData.unlocked_count || 0} unlocked
                    </span>
                    <span className="stat-item highlight">
                      <Package size={14} />
                      {previewData.available_to_unlock || 0} available
                    </span>
                  </div>
                  
                  {/* Unlock Controls */}
                  {(() => {
                    const available = previewData?.available_to_unlock || 0;
                    const credits = previewData?.credits_balance ?? 0;
                    const batchSizes = previewData?.unlock_batches || [25, 50, 75, 100];
                    const minBatchSize = Math.min(...batchSizes);
                    const showUnlockAll = available > 0 && available < minBatchSize;
                    const showBatchSelector = available >= minBatchSize;
                    const maxUnlockable = Math.min(available, credits);

                    if (available <= 0) return null;

                    return (
                      <div className="unlock-controls-inline">
                        {showBatchSelector && (
                          <div className="batch-selector-inline">
                            {batchSizes.map(size => {
                              const disabledDueToAvailable = size > available;
                              const disabledDueToCredits = size > credits;
                              const isDisabled = isUnlocking || disabledDueToAvailable || disabledDueToCredits;
                              
                              return (
                                <button
                                  key={size}
                                  className={`batch-btn-sm ${selectedBatchSize === size ? 'active' : ''}`}
                                  onClick={() => setSelectedBatchSize(size)}
                                  disabled={isDisabled}
                                  title={disabledDueToCredits && !disabledDueToAvailable 
                                    ? `Need ${size} credits`
                                    : disabledDueToAvailable 
                                    ? `Only ${available} available` 
                                    : ''}
                                >
                                  {size}
                                </button>
                              );
                            })}
                          </div>
                        )}
                        {showUnlockAll && (
                          <span className="unlock-hint">Only {available} available</span>
                        )}
                        <Button 
                          variant="primary" 
                          onClick={handleUnlock}
                          isLoading={isUnlocking}
                          disabled={isUnlocking || maxUnlockable <= 0}
                          className="unlock-btn-compact"
                        >
                          <Unlock size={14} />
                          Unlock {Math.min(selectedBatchSize, available, credits)}
                        </Button>
                      </div>
                    );
                  })()}
                </div>

                {/* Preview Error */}
                {previewError && (
                  <div className="search-error-inline">
                    <AlertCircle size={14} />
                    <span>{previewError}</span>
                  </div>
                )}

                {/* Results Table - Maximized */}
                {isLoadingPreview ? (
                  <div className="search-loading-compact">
                    <Loader2 size={24} className="spinning" />
                    <span>Loading...</span>
                  </div>
                ) : previewData.items.length > 0 ? (
                  <div className="search-table-wrapper">
                    <table className="search-table-compact">
                      <thead>
                        <tr>
                          <th className="col-status">Status</th>
                          <th className="col-num">#</th>
                          <th className="col-business">Business</th>
                          <th className="col-address">Address</th>
                          <th className="col-phone">Phone</th>
                          <th className="col-website">Website</th>
                          <th className="col-rating">Rating</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.items.map((item, index) => (
                          <tr key={item.place_id} className={item.is_unlocked ? 'row-unlocked' : 'row-locked'}>
                            <td className="col-status">
                              {item.is_unlocked ? (
                                <span className="status-unlocked" title="Unlocked">
                                  <CheckCircle2 size={16} />
                                </span>
                              ) : (
                                <span className="status-locked" title="Locked">
                                  <Lock size={16} />
                                </span>
                              )}
                            </td>
                            <td className="col-num">
                              {((previewData.pagination?.page || 1) - 1) * (previewData.pagination?.per_page || 50) + index + 1}
                            </td>
                            <td className="col-business">
                              <div className="business-info">
                                <span className="business-name" title={item.title || 'N/A'}>{item.title || 'N/A'}</span>
                                {item.category && <span className="business-category" title={item.category}>{item.category}</span>}
                              </div>
                            </td>
                            <td className="col-address">
                              <span className="address-text" title={[item.address, item.city, item.state].filter(Boolean).join(', ') || 'N/A'}>
                                {[item.address, item.city, item.state].filter(Boolean).join(', ') || 'N/A'}
                              </span>
                            </td>
                            <td className="col-phone">
                              {item.is_unlocked && item.phone ? (
                                <a href={`tel:${item.phone}`} className="phone-link">
                                  <Phone size={12} />
                                  {item.phone}
                                </a>
                              ) : (
                                <span className="masked-data">
                                  <Lock size={12} />
                                  ••••••••
                                </span>
                              )}
                            </td>
                            <td className="col-website">
                              {item.is_unlocked && item.website ? (
                                <a href={item.website} target="_blank" rel="noopener noreferrer" className="website-link">
                                  <ExternalLink size={12} />
                                  Visit
                                </a>
                              ) : (
                                <span className="masked-data">
                                  <Lock size={12} />
                                  ••••••
                                </span>
                              )}
                            </td>
                            <td className="col-rating">
                              {item.rating ? (
                                <span className="rating-display">
                                  <Star size={12} className="star-icon" />
                                  {item.rating.toFixed(1)}
                                  {item.review_count && <span className="review-count">({item.review_count})</span>}
                                </span>
                              ) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="search-no-results">
                    <Package size={32} />
                    <p>No results found for this search.</p>
                  </div>
                )}

                {/* Pagination */}
                {previewData.pagination && previewData.pagination.total_pages > 1 && (
                  <div className="search-pagination-compact">
                    <button
                      onClick={() => loadPreview(currentSearchId!, previewPage - 1)}
                      disabled={!previewData.pagination.has_prev || isLoadingPreview}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span>
                      {previewData.pagination.page} / {previewData.pagination.total_pages}
                    </span>
                    <button
                      onClick={() => loadPreview(currentSearchId!, previewPage + 1)}
                      disabled={!previewData.pagination.has_next || isLoadingPreview}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Enhanced Empty State - Landing Experience */}
            {!previewData && !isPollingStatus && !isSubmitting && (
              <div className="search-landing">
                {/* Stats Bar */}
                <div className="landing-stats">
                  <div className="landing-stat">
                    <span className="stat-number">{history?.pagination?.total_items || 0}</span>
                    <span className="stat-label">Searches Run</span>
                  </div>
                  <div className="landing-stat-divider" />
                  <div className="landing-stat">
                    <span className="stat-number">
                      {history?.items?.reduce((sum, item) => sum + (item.unique_records || 0), 0) || 0}
                    </span>
                    <span className="stat-label">Leads Found</span>
                  </div>
                  <div className="landing-stat-divider" />
                  <div className="landing-stat">
                    <span className="stat-number">
                      {history?.items?.reduce((sum, item) => sum + (item.unlocked_count || 0), 0) || 0}
                    </span>
                    <span className="stat-label">Leads Unlocked</span>
                  </div>
                </div>

                {/* Feature Cards */}
                <div className="landing-features">
                  <div className="feature-card">
                    <div className="feature-icon search-icon">
                      <Search size={24} />
                    </div>
                    <h4>Search Any Business</h4>
                    <p>Find dentists, plumbers, restaurants - any business type in any location</p>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon preview-icon">
                      <Eye size={24} />
                    </div>
                    <h4>Preview Results Free</h4>
                    <p>See business names and ratings before unlocking contact details</p>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon unlock-icon">
                      <Unlock size={24} />
                    </div>
                    <h4>Unlock Leads</h4>
                    <p>Get phone numbers, websites, and emails for your outreach campaigns</p>
                  </div>
                </div>

              </div>
            )}
          </>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="search-history-compact">
            {/* Search & Filter Bar */}
            <div className="history-toolbar">
              <div className="history-search-box">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search by keyword or location..."
                  value={historySearchText}
                  onChange={(e) => setHistorySearchText(e.target.value)}
                />
                {historySearchText && (
                  <button 
                    className="clear-search-btn"
                    onClick={() => setHistorySearchText('')}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <div className="history-filters">
                <div className="filter-select">
                  <Filter size={14} />
                  <select 
                    value={historyFilter}
                    onChange={(e) => setHistoryFilter(e.target.value as HistoryFilter)}
                  >
                    <option value="all">All Searches</option>
                    <option value="running">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="has-available">Has Available</option>
                  </select>
                </div>
                <button 
                  className="refresh-btn-sm"
                  onClick={() => loadHistory()}
                  disabled={isLoadingHistory}
                  title="Refresh"
                >
                  <RefreshCw size={14} className={isLoadingHistory ? 'spinning' : ''} />
                </button>
              </div>
            </div>

            {/* History List - Scrollable */}
            {isLoadingHistory ? (
              <div className="search-loading-compact">
                <Loader2 size={24} className="spinning" />
                <span>Loading history...</span>
              </div>
            ) : filteredHistory.length > 0 ? (
              <div className="history-scroll-container">
                <div className="history-grid">
                  {filteredHistory.map((item) => {
                    // Capitalize first letter of each word in query
                    const formatQuery = (text: string) => {
                      return text.split(' ').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                      ).join(' ');
                    };
                    
                    return (
                      <div key={item.search_id} className="history-card">
                        <div className="history-card-header">
                          <div className="history-card-status">
                            {getStatusIcon(item.status)}
                            <span className={`status-label ${item.status.toLowerCase()}`}>
                              {item.status === 'RUNNING' ? 'In Progress' : 
                               item.status === 'SUCCEEDED' ? 'Complete' : item.status}
                            </span>
                          </div>
                          <span className="history-card-date">
                            {new Date(item.created_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        
                        <div className="history-card-content">
                          <h3 className="history-card-title">
                            {formatQuery(item.query_text)}
                          </h3>
                          <p className="history-card-location">
                            <MapPin size={14} />
                            {item.location_text}
                          </p>
                        </div>
                        
                        <div className="history-card-stats">
                          <div className="stat-pill">
                            <Eye size={12} />
                            <span>{item.unique_records || 0} found</span>
                          </div>
                          <div className="stat-pill unlocked">
                            <Unlock size={12} />
                            <span>{item.unlocked_count || 0} unlocked</span>
                          </div>
                          {(item.available_to_unlock || 0) > 0 && (
                            <div className="stat-pill available">
                              <Package size={12} />
                              <span>{item.available_to_unlock} available</span>
                            </div>
                          )}
                        </div>
                        
                        <button 
                          className={`history-card-btn ${item.status === 'RUNNING' ? 'secondary' : (item.available_to_unlock || 0) > 0 ? 'primary' : 'secondary'}`}
                          onClick={() => handleResumeSearch(item)}
                        >
                          {item.status === 'RUNNING' ? (
                            <>View Progress</>
                          ) : (item.available_to_unlock || 0) > 0 ? (
                            <>Continue Unlocking</>
                          ) : (
                            <>View Results</>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
                {/* Results count */}
                <div className="history-results-count">
                  Showing {filteredHistory.length} {filteredHistory.length === 1 ? 'search' : 'searches'}
                  {historySearchText && ` matching "${historySearchText}"`}
                </div>
              </div>
            ) : (
              <div className="search-empty-compact">
                <History size={40} />
                <h3>{historySearchText ? 'No Matches Found' : 'No Search History'}</h3>
                <p>
                  {historySearchText 
                    ? `No searches match "${historySearchText}". Try a different term.`
                    : historyFilter !== 'all' 
                    ? 'No searches match the selected filter.' 
                    : 'Start your first search to see it here.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
