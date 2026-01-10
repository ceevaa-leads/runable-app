import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Inbox,
  Mail,
  AlertCircle,
  Clock,
  Building2,
  User,
  Filter,
  Loader2,
  MessageSquare,
  ChevronRight,
  Search,
  X
} from 'lucide-react';
import { outreachService } from '../../services/leads.service';
import { Badge, getStatusBadgeVariant, getStatusLabel } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { Alert } from '../../components/ui/Alert';
import type { InboxConversation, Campaign, LeadsPagination } from '../../types/leads.types';

type FilterType = 'all' | 'needs_reply' | 'awaiting' | 'new';

export const InboxPage: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [conversations, setConversations] = useState<InboxConversation[]>([]);
  const [pagination, setPagination] = useState<LeadsPagination | null>(null);
  const [counts, setCounts] = useState({ needs_reply: 0, awaiting: 0, new: 0 });
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await outreachService.getInboxConversations({
        filter: activeFilter,
        campaign_id: selectedCampaignId || undefined,
        search: searchTerm || undefined,
        page: currentPage,
        per_page: perPage,
      });

      setConversations(response.conversations);
      setPagination(response.pagination);
      setCounts(response.counts);
      setCampaigns(response.campaigns);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inbox');
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter, selectedCampaignId, searchTerm, currentPage, perPage]);

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchInput.trim());
    setCurrentPage(1);
  };

  // Clear search
  const clearSearch = () => {
    setSearchInput('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle conversation click
  const handleConversationClick = (conversation: InboxConversation) => {
    navigate(`/dashboard/contacts/${conversation.contact.id}/emails`);
  };

  // Format time ago
  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Get total for "All" filter
  const getTotalCount = () => {
    return counts.needs_reply + counts.awaiting + counts.new;
  };

  return (
    <div className="inbox-page">
      {/* Header */}
      <div className="inbox-header">
        <div className="inbox-title">
          <Inbox size={28} />
          <div>
            <h1>Inbox</h1>
            <p className="inbox-subtitle">Manage all your email conversations</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="inbox-content">
        {/* Sidebar Filters */}
        <aside className="inbox-sidebar">
          {/* Status Filters */}
          <div className="filter-section">
            <h3 className="filter-section-title">
              <Filter size={16} />
              Status
            </h3>
            <nav className="filter-nav">
              <button
                className={`filter-item ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => {
                  setActiveFilter('all');
                  setCurrentPage(1);
                }}
              >
                <span className="filter-label">All Conversations</span>
                <span className="filter-count">{getTotalCount()}</span>
              </button>

              <button
                className={`filter-item needs-reply ${activeFilter === 'needs_reply' ? 'active' : ''}`}
                onClick={() => {
                  setActiveFilter('needs_reply');
                  setCurrentPage(1);
                }}
              >
                <span className="filter-icon">
                  <AlertCircle size={14} />
                </span>
                <span className="filter-label">Needs Reply</span>
                <span className="filter-count urgent">{counts.needs_reply}</span>
              </button>

              <button
                className={`filter-item ${activeFilter === 'awaiting' ? 'active' : ''}`}
                onClick={() => {
                  setActiveFilter('awaiting');
                  setCurrentPage(1);
                }}
              >
                <span className="filter-icon">
                  <Clock size={14} />
                </span>
                <span className="filter-label">Awaiting Response</span>
                <span className="filter-count">{counts.awaiting}</span>
              </button>

              <button
                className={`filter-item ${activeFilter === 'new' ? 'active' : ''}`}
                onClick={() => {
                  setActiveFilter('new');
                  setCurrentPage(1);
                }}
              >
                <span className="filter-icon">
                  <Mail size={14} />
                </span>
                <span className="filter-label">New Contacts</span>
                <span className="filter-count">{counts.new}</span>
              </button>
            </nav>
          </div>

          {/* Campaign Filters */}
          {campaigns.length > 0 && (
            <div className="filter-section">
              <h3 className="filter-section-title">Campaigns</h3>
              <nav className="filter-nav">
                <button
                  className={`filter-item ${selectedCampaignId === null ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedCampaignId(null);
                    setCurrentPage(1);
                  }}
                >
                  <span className="filter-label">All Campaigns</span>
                </button>
                {campaigns.map((campaign) => (
                  <button
                    key={campaign.id}
                    className={`filter-item ${selectedCampaignId === campaign.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedCampaignId(campaign.id);
                      setCurrentPage(1);
                    }}
                  >
                    <span className="filter-label">{campaign.name}</span>
                  </button>
                ))}
              </nav>
            </div>
          )}
        </aside>

        {/* Conversations List */}
        <main className="inbox-main">
          {/* Search Bar */}
          <div className="inbox-search-bar">
            <form onSubmit={handleSearch} className="inbox-search-form">
              <div className="search-input-wrapper">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search by business or contact name..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="search-input"
                />
                {searchInput && (
                  <button
                    type="button"
                    className="search-clear-btn"
                    onClick={clearSearch}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <button type="submit" className="search-submit-btn">
                Search
              </button>
            </form>
            {searchTerm && (
              <div className="search-active-tag">
                Showing results for: <strong>"{searchTerm}"</strong>
                <button onClick={clearSearch} className="clear-search-link">
                  Clear
                </button>
              </div>
            )}
          </div>

          {error && (
            <Alert type="error" message={error} className="inbox-error" />
          )}

          {isLoading ? (
            <div className="inbox-loading">
              <Loader2 size={32} className="spinning" />
              <span>Loading conversations...</span>
            </div>
          ) : conversations.length === 0 ? (
            <div className="inbox-empty">
              <MessageSquare size={48} />
              <h3>No conversations found</h3>
              <p>
                {searchTerm
                  ? `No conversations match "${searchTerm}"`
                  : activeFilter === 'all'
                    ? 'Start by sending outreach emails to your leads'
                    : `No conversations match the "${activeFilter.replace('_', ' ')}" filter`}
              </p>
              {searchTerm && (
                <button onClick={clearSearch} className="btn btn-outline btn-sm" style={{ marginTop: 'var(--space-4)' }}>
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="conversations-list">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.conversation_id}
                    className="conversation-item-wrapper"
                  >
                    <div
                      className={`conversation-item ${conversation.needs_reply ? 'needs-reply' : ''}`}
                      onClick={() => handleConversationClick(conversation)}
                    >
                      <div className="conversation-avatar">
                        <User size={20} />
                      </div>

                      <div className="conversation-content">
                        <div className="conversation-header">
                          <div className="conversation-contact">
                            <span className="contact-name">
                              {conversation.contact?.contact_name || 'Unknown Contact'}
                            </span>
                            <Badge variant={getStatusBadgeVariant(conversation.contact?.email_status || 'NEW')}>
                              {getStatusLabel(conversation.contact?.email_status || 'NEW')}
                            </Badge>
                            {conversation.needs_reply && (
                              <span className="conversation-urgent">
                                <AlertCircle size={12} />
                              </span>
                            )}
                          </div>
                          <span className="conversation-time">
                            {formatTimeAgo(conversation.last_activity_at)}
                          </span>
                        </div>

                        <div className="conversation-business">
                          <Building2 size={12} />
                          <span>{conversation.business?.business_name || 'Unknown Business'}</span>
                        </div>

                        {conversation.last_message && (
                          <div className="conversation-preview">
                            <span className={`preview-direction ${conversation.last_message.direction}`}>
                              {conversation.last_message.direction === 'outbound' ? 'You:' : 'Reply:'}
                            </span>
                            <span className="preview-text">
                              {conversation.last_message.body?.slice(0, 100)}
                              {(conversation.last_message.body?.length || 0) > 100 ? '...' : ''}
                            </span>
                          </div>
                        )}

                        <div className="conversation-meta">
                          <span className="message-count">
                            <MessageSquare size={12} />
                            {conversation.message_count} messages
                          </span>
                        </div>
                      </div>

                      <ChevronRight size={20} className="conversation-arrow" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {/* ROLLBACK: Change `pagination.total_items > 0` back to `pagination.total_pages > 1` to hide pagination on single page */}
              {pagination && pagination.total_items > 0 && (
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.total_pages}
                  totalItems={pagination.total_items}
                  perPage={pagination.per_page}
                  hasNext={pagination.page < pagination.total_pages}
                  hasPrev={pagination.page > 1}
                  onPageChange={(page) => setCurrentPage(page)}
                  onPerPageChange={(newPerPage) => {
                    setPerPage(newPerPage);
                    setCurrentPage(1);
                  }}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};
