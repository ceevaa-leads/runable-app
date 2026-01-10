import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  MapPin,
  Building2,
  Calendar,
  X,
  ChevronDown,
  ChevronRight,
  Mail,
  User,
  Loader2,
  Plus,
  MessageCircle,
  Clock,
  AlertCircle,
  Zap,
  Pencil,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  MoreVertical
} from 'lucide-react';
import { leadsService } from '../../services/leads.service';
import { campaignsService } from '../../services/campaigns.service';
import { businessesService } from '../../services/businesses.service';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Badge, getStatusBadgeVariant, getStatusLabel } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { Alert } from '../../components/ui/Alert';
import { ManualLeadModal } from '../../components/leads/ManualLeadModal';
import type { LeadSubmissionResult } from '../../components/leads/ManualLeadModal';
import { BulkActionsToolbar } from '../../components/leads/BulkActionsToolbar';
import { EnrollToCampaignModal } from '../../components/leads/EnrollToCampaignModal';
import { ToastContainer, useToast } from '../../components/ui/Toast';
import type { LeadWithStats, ContactWithStats, LeadsQueryParams, LeadStatus, LeadSource, LeadsPagination, BusinessEditData } from '../../types/leads.types';
import type { EnrollLeadsResponse, CampaignEnrollment } from '../../types/campaign.types';

type SortField = 'created_at' | 'updated_at' | 'lead_status';
type SortOrder = 'asc' | 'desc';

const STATUS_OPTIONS: { value: LeadStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'NEW', label: 'New' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'CONVERTED', label: 'Converted' },
  { value: 'LOST', label: 'Lost' },
  { value: 'DORMANT', label: 'Dormant' },
];

const SOURCE_OPTIONS: { value: LeadSource | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'google_maps', label: 'Google Maps' },
  { value: 'manual', label: 'Manual' },
  { value: 'bulk_upload', label: 'Bulk Upload' },
];

// Expandable Row Component for Lead Contacts with Stats
interface LeadContactsRowProps {
  placeId: string;
  businessName: string;
  isExpanded: boolean;
  onViewContact: (contactId: number) => void;
  selectedLeads: Map<number, SelectedLeadInfo>;
  onSelectLead: (leadInfo: SelectedLeadInfo) => void;
  onSelectAll: (contacts: ContactWithStats[], businessName: string, placeId: string) => void;
  enrollment?: CampaignEnrollment;
  campaignName?: string;
}

// Interface for selected lead info (duplicated for component access)
interface SelectedLeadInfo {
  leadEmailId: number;
  email: string;
  contactName: string;
  businessName: string;
  emailStatus: string;
  enrollmentId?: number;
  enrollmentStatus?: string;
}

const LeadContactsRow: React.FC<LeadContactsRowProps> = ({ 
  placeId, 
  businessName,
  isExpanded, 
  onViewContact,
  selectedLeads,
  onSelectLead,
  onSelectAll,
  enrollment,
  campaignName,
}) => {
  const [contacts, setContacts] = useState<ContactWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (isExpanded && !hasFetched) {
      const fetchContacts = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await leadsService.getLeadContacts(placeId);
          setContacts(response.contacts);
          setHasFetched(true);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load contacts');
        } finally {
          setIsLoading(false);
        }
      };
      fetchContacts();
    }
  }, [isExpanded, placeId, hasFetched]);

  if (!isExpanded) return null;

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <tr className="lead-emails-row">
      <td colSpan={7}>
        <div className="lead-emails-container">
          <div className="lead-emails-header">
            <Mail size={16} />
            <span>Contacts ({contacts.length})</span>
          </div>
          
          {isLoading ? (
            <div className="lead-emails-loading">
              <Loader2 size={20} className="spinning" />
              <span>Loading contacts...</span>
            </div>
          ) : error ? (
            <div className="lead-emails-error">
              <span>{error}</span>
            </div>
          ) : contacts.length === 0 ? (
            <div className="lead-emails-empty">
              <span>No contacts found for this business</span>
            </div>
          ) : (
            <table className="lead-emails-table">
              <thead>
                <tr>
                  <th className="checkbox-col">
                    <input
                      type="checkbox"
                      checked={contacts.length > 0 && contacts.every(c => selectedLeads.has(c.id))}
                      onChange={(e) => {
                        e.stopPropagation();
                        onSelectAll(contacts, businessName, placeId);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      title="Select all contacts"
                    />
                  </th>
                  <th>Contact</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Campaign</th>
                  <th>Messages</th>
                  <th>Last Activity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr key={contact.id} className={contact.needs_reply ? 'needs-reply' : ''}>
                    <td className="checkbox-col">
                      <input
                        type="checkbox"
                        checked={selectedLeads.has(contact.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          onSelectLead({
                            leadEmailId: contact.id,
                            email: contact.email,
                            contactName: contact.contact_name || 'Unknown',
                            businessName,
                            emailStatus: contact.email_status,
                            enrollmentId: enrollment?.id,
                            enrollmentStatus: enrollment?.status,
                          });
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td>
                      <div className="contact-name">
                        <User size={14} />
                        <span>{contact.contact_name || 'Unknown'}</span>
                        {contact.needs_reply && (
                          <span className="needs-reply-badge" title="Needs reply">
                            <AlertCircle size={14} />
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="email-text">{contact.email}</span>
                    </td>
                    <td>
                      <Badge variant={getStatusBadgeVariant(contact.email_status)}>
                        {getStatusLabel(contact.email_status)}
                      </Badge>
                    </td>
                    <td>
                      {enrollment ? (
                        <span className={`campaign-status-badge ${enrollment.status}`}>
                          <Zap size={12} />
                          {campaignName ? `${campaignName} • ` : ''}
                          {enrollment.status === 'scheduled'
                            ? 'Scheduled'
                            : enrollment.status === 'active'
                              ? `Step ${enrollment.current_step}`
                              : enrollment.status}
                        </span>
                      ) : (
                        <span className="no-campaign">—</span>
                      )}
                    </td>
                    <td>
                      <div className="message-count">
                        <MessageCircle size={14} />
                        <span>{contact.message_count}</span>
                      </div>
                    </td>
                    <td>
                      <div className="last-activity">
                        <Clock size={14} />
                        <span>{formatTimeAgo(contact.last_message_at)}</span>
                      </div>
                    </td>
                    <td>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewContact(contact.id);
                        }}
                      >
                        {contact.email_status === 'NEW' ? 'Send Email' : 'View Emails'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </td>
    </tr>
  );
};

// Interface for selected lead info
interface SelectedLeadInfo {
  leadEmailId: number;
  email: string;
  contactName: string;
  businessName: string;
  emailStatus: string;
  enrollmentId?: number;
  enrollmentStatus?: string;
}

export const LeadsPage: React.FC = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<LeadWithStats[]>([]);
  const [pagination, setPagination] = useState<LeadsPagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Expanded rows state
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Selection state - maps lead_email.id to SelectedLeadInfo
  const [selectedLeads, setSelectedLeads] = useState<Map<number, SelectedLeadInfo>>(new Map());

  // Modal state
  const [isManualLeadModalOpen, setIsManualLeadModalOpen] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  
  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [businessToEdit, setBusinessToEdit] = useState<BusinessEditData | null>(null);
  // Note: isLoadingEditData reserved for future edit loading state
  const [_isLoadingEditData, setIsLoadingEditData] = useState(false);
  void _isLoadingEditData; // Suppress unused warning

  // Enrollment data for leads (maps place_id to enrollment info)
  const [enrollments, setEnrollments] = useState<Map<string, CampaignEnrollment>>(new Map());
  // Campaign name lookup (maps campaign_definition_id to campaign name)
  const [campaignNames, setCampaignNames] = useState<Map<number, string>>(new Map());

  // Toast notifications
  const { toasts, addToast, dismissToast } = useToast();

  // Convert to customer modal state
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [leadToConvert, setLeadToConvert] = useState<LeadWithStats | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  // Actions menu state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | ''>('');
  const [sourceFilter, setSourceFilter] = useState<LeadSource | ''>('');
  const [sortBy, setSortBy] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: LeadsQueryParams = {
        page: currentPage,
        per_page: perPage,
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      if (statusFilter) {
        params.lead_status = statusFilter;
      }
      if (sourceFilter) {
        params.source = sourceFilter;
      }

      // Use new API with stats
      const response = await leadsService.getLeadsWithStats(params);
      // API returns items array with nested business object
      setLeads(response.items || []);
      setPagination(response.pagination || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leads');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, perPage, searchTerm, statusFilter, sourceFilter, sortBy, sortOrder]);

  // Navigate to contact email view
  const handleViewContact = (contactId: number) => {
    navigate(`/dashboard/contacts/${contactId}/emails`);
  };

  // Fetch enrollments to show campaign status
  const fetchEnrollments = useCallback(async () => {
    try {
      const response = await campaignsService.getEnrollments(1, 500, ''); // Get all enrollments
      const enrollmentMap = new Map<string, CampaignEnrollment>();
      response.items.forEach(enrollment => {
        // Map by place_id for easy lookup
        if (enrollment.place_id) {
          enrollmentMap.set(enrollment.place_id, enrollment);
        }
      });
      setEnrollments(enrollmentMap);
    } catch (err) {
      console.error('Failed to fetch enrollments:', err);
    }
  }, []);

  // Fetch campaign definitions to show campaign name in UI
  const fetchCampaignNames = useCallback(async () => {
    try {
      const { campaigns } = await campaignsService.getCampaigns();
      const map = new Map<number, string>();
      campaigns.forEach((c) => map.set(c.id, c.name));
      setCampaignNames(map);
    } catch (err) {
      console.error('Failed to fetch campaign names:', err);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
    fetchEnrollments();
    fetchCampaignNames();
  }, [fetchLeads, fetchEnrollments, fetchCampaignNames]);

  // Debounced live search - triggers when search term or filters change
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip on initial mount (already fetched above)
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Clear previous debounce
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    // Debounce search by 300ms
    searchDebounceRef.current = setTimeout(() => {
      setCurrentPage(1);
      fetchLeads();
    }, 300);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchTerm, statusFilter, sourceFilter]);

  // Selection handlers
  const handleSelectLead = (leadInfo: SelectedLeadInfo) => {
    setSelectedLeads(prev => {
      const newMap = new Map(prev);
      if (newMap.has(leadInfo.leadEmailId)) {
        newMap.delete(leadInfo.leadEmailId);
      } else {
        newMap.set(leadInfo.leadEmailId, leadInfo);
      }
      return newMap;
    });
  };

  const handleSelectAll = (contacts: ContactWithStats[], businessName: string, placeId: string) => {
    const enrollment = enrollments.get(placeId);
    setSelectedLeads(prev => {
      const newMap = new Map(prev);
      const allSelected = contacts.every(c => newMap.has(c.id));
      
      if (allSelected) {
        // Deselect all
        contacts.forEach(c => newMap.delete(c.id));
      } else {
        // Select all
        contacts.forEach(c => {
          newMap.set(c.id, {
            leadEmailId: c.id,
            email: c.email,
            contactName: c.contact_name || 'Unknown',
            businessName,
            emailStatus: c.email_status,
            enrollmentId: enrollment?.id,
            enrollmentStatus: enrollment?.status,
          });
        });
      }
      return newMap;
    });
  };

  const clearSelection = () => {
    setSelectedLeads(new Map());
  };

  // Check if any selected leads can be enrolled (NEW status, not already enrolled)
  const canEnrollSelected = Array.from(selectedLeads.values()).some(
    lead => lead.emailStatus === 'NEW' && !lead.enrollmentStatus
  );

  // Check if any selected leads can be unenrolled (scheduled or active status)
  const canUnenrollSelected = Array.from(selectedLeads.values()).some(
    lead => lead.enrollmentStatus === 'scheduled' || lead.enrollmentStatus === 'active'
  );

  // Get leads that can be enrolled
  const getEnrollableLeads = () => {
    return Array.from(selectedLeads.values())
      .filter(lead => lead.emailStatus === 'NEW' && !lead.enrollmentStatus)
      .map(lead => ({
        id: lead.leadEmailId,
        email: lead.email,
        contactName: lead.contactName,
        businessName: lead.businessName,
      }));
  };

  // Handle enroll modal open
  const handleOpenEnrollModal = () => {
    if (canEnrollSelected) {
      setIsEnrollModalOpen(true);
    }
  };

  // Handle enrollment success
  const handleEnrollSuccess = (result: EnrollLeadsResponse) => {
    addToast({
      type: result.enrolled > 0 ? 'success' : 'error',
      title: result.enrolled > 0 ? 'Leads Enrolled' : 'Enrollment Issues',
      message: result.enrolled > 0
        ? `${result.enrolled} lead${result.enrolled > 1 ? 's' : ''} enrolled. First email in 15 minutes.`
        : `No leads could be enrolled. ${result.failed} failed.`,
      duration: 5000,
    });
    clearSelection();
    fetchLeads();
    fetchEnrollments();
    fetchEnrollments();
  };

  // Handle unenroll (for scheduled) or cancel (for active)
  const handleUnenroll = async () => {
    // Get leads that can be unenrolled/cancelled
    const enrolledLeads = Array.from(selectedLeads.values())
      .filter((lead) => (lead.enrollmentStatus === 'scheduled' || lead.enrollmentStatus === 'active') && lead.enrollmentId);

    // Count total contacts selected for the toast message
    const totalContactsSelected = enrolledLeads.length;

    // Deduplicate by enrollment id (multiple contacts for same business can be selected)
    const uniqueEnrollments = new Map<number, string>();
    enrolledLeads.forEach(lead => {
      if (lead.enrollmentId && lead.enrollmentStatus) {
        uniqueEnrollments.set(lead.enrollmentId, lead.enrollmentStatus);
      }
    });

    if (uniqueEnrollments.size === 0) return;

    let successCount = 0;
    let failCount = 0;

    for (const [enrollmentId, status] of uniqueEnrollments) {
      try {
        // Use unenroll for scheduled, cancel for active
        const result = status === 'scheduled'
          ? await campaignsService.unenrollLead(enrollmentId)
          : await campaignsService.cancelEnrollment(enrollmentId);
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    addToast({
      type: successCount > 0 ? 'success' : 'error',
      title: successCount > 0 ? 'Campaign Stopped' : 'Action Failed',
      message: successCount > 0
        ? `${totalContactsSelected} contact${totalContactsSelected > 1 ? 's' : ''} removed from campaign.`
        : 'Failed to remove leads from campaign.',
      duration: 5000,
    });

    clearSelection();
    fetchLeads();
    fetchEnrollments();
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setSourceFilter('');
    setSortBy('created_at');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const toggleRowExpansion = (placeId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(placeId)) {
        newSet.delete(placeId);
      } else {
        newSet.add(placeId);
      }
      return newSet;
    });
  };

  const handleManualLeadSuccess = (result: LeadSubmissionResult) => {
    // Refresh the leads list after successful creation
    fetchLeads();
    fetchEnrollments();
    
    // Close edit mode
    setEditMode(false);
    setBusinessToEdit(null);
    
    // Show toast notification
    addToast({
      type: result.type,
      title: result.title,
      message: result.message,
      details: result.details,
      duration: 5000,
    });
  };

  // Handle edit button click
  const handleEditBusiness = async (placeId: string) => {
    setIsLoadingEditData(true);
    try {
      const response = await leadsService.getBusinessWithContacts(placeId);
      setBusinessToEdit({
        place_id: response.business.place_id,
        business_name: response.business.business_name,
        address: response.business.address,
        city: response.business.city,
        country: response.business.country,
        zip: response.business.zip,
        contacts: response.contacts.map(c => ({
          id: c.id,
          contact_name: c.contact_name,
          email: c.email,
          email_status: c.email_status,
          hasEnrollment: c.hasEnrollment,
        })),
      });
      setEditMode(true);
      setIsManualLeadModalOpen(true);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Failed to load business',
        message: err instanceof Error ? err.message : 'Could not load business details',
        duration: 5000,
      });
    } finally {
      setIsLoadingEditData(false);
    }
  };

  // Handle modal close for edit mode
  const handleModalClose = () => {
    setIsManualLeadModalOpen(false);
    setEditMode(false);
    setBusinessToEdit(null);
  };

  // Toggle actions menu
  const toggleActionsMenu = (placeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === placeId ? null : placeId);
  };

  // Open convert to customer modal
  const handleConvertClick = (lead: LeadWithStats) => {
    setOpenMenuId(null);
    setLeadToConvert(lead);
    setShowConvertModal(true);
  };

  // Handle edit from menu
  const handleEditFromMenu = (placeId: string) => {
    setOpenMenuId(null);
    handleEditBusiness(placeId);
  };

  // Close convert modal
  const handleCloseConvertModal = () => {
    setShowConvertModal(false);
    setLeadToConvert(null);
  };

  // Confirm conversion to customer
  const handleConfirmConvert = async () => {
    if (!leadToConvert?.business?.id) return;

    setIsConverting(true);
    try {
      const result = await businessesService.convertToCustomer(leadToConvert.business.id);
      
      addToast({
        type: 'success',
        title: 'Conversion Successful',
        message: result.message,
        duration: 5000,
      });

      // Close modal and refresh list
      handleCloseConvertModal();
      fetchLeads();
      fetchEnrollments();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Conversion Failed',
        message: err instanceof Error ? err.message : 'Failed to convert to customer',
        duration: 5000,
      });
    } finally {
      setIsConverting(false);
    }
  };

  const hasActiveFilters = searchTerm || statusFilter || sourceFilter;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) {
      return <ArrowUpDown size={14} className="sort-icon inactive" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp size={14} className="sort-icon active" />
    ) : (
      <ArrowDown size={14} className="sort-icon active" />
    );
  };

  return (
    <div className="leads-page">
      {/* Header with Title and Source Leads Button */}
      <div className="leads-header">
        <div className="leads-title-section">
          <h1>Leads</h1>
          <p className="leads-subtitle">
            Manage and track your business leads
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => {
            setEditMode(false);
            setBusinessToEdit(null);
            setIsManualLeadModalOpen(true);
          }}
        >
          <Plus size={18} />
          Add Lead
        </Button>
      </div>

      {/* Search and Filters Bar */}
      <div className="leads-filter-bar">
        <div className="leads-search-form compact">
          <Input
            type="text"
            placeholder="Search by business name or place ID..."
            icon={<Search size={18} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <Select
            aria-label="Status"
            className="filter-select"
            options={STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.value === '' ? 'All Status' : o.label }))}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as LeadStatus | '')}
          />

          <Select
            aria-label="Source"
            className="filter-select"
            options={SOURCE_OPTIONS.map((o) => ({ value: o.value, label: o.value === '' ? 'All Sources' : o.label }))}
            value={sourceFilter}
            onChange={(v) => setSourceFilter(v as LeadSource | '')}
          />

          {hasActiveFilters && (
            <Button variant="outline" size="md" onClick={handleClearFilters}>
              <X size={16} />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar
        selectedCount={selectedLeads.size}
        onEnrollClick={handleOpenEnrollModal}
        onUnenrollClick={handleUnenroll}
        onClearSelection={clearSelection}
        canEnroll={canEnrollSelected}
        canUnenroll={canUnenrollSelected}
      />

      {/* Error State */}
      {error && (
        <Alert type="error" message={error} className="leads-error" />
      )}

      {/* Data Grid */}
      <div className="leads-table-container">
        <table className="leads-table">
          <thead>
            <tr>
              <th>Business</th>
              <th>Location</th>
              <th>Contacts</th>
              <th 
                className="sortable"
                onClick={() => handleSort('lead_status')}
              >
                Status
                <SortIcon field="lead_status" />
              </th>
              <th>Source</th>
              <th 
                className="sortable"
                onClick={() => handleSort('created_at')}
              >
                Created
                <SortIcon field="created_at" />
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="table-loading">
                  <div className="loading-spinner" />
                  <span>Loading leads...</span>
                </td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={7} className="table-empty">
                  <div className="empty-state">
                    <Building2 size={48} />
                    <h3>No leads found</h3>
                    <p>
                      {hasActiveFilters
                        ? 'Try adjusting your filters or search term'
                        : 'Start by sourcing your first leads'}
                    </p>
                    {hasActiveFilters && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearFilters}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const placeId = lead.business?.place_id || '';
                return (
                <React.Fragment key={lead.id}>
                  <tr 
                    className={`lead-row ${expandedRows.has(placeId) ? 'expanded' : ''} ${(lead.contact_stats?.needs_reply ?? 0) > 0 ? 'has-needs-reply' : ''}`}
                    onClick={() => toggleRowExpansion(placeId)}
                  >
                    <td className="lead-business">
                      <button 
                        className="expand-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRowExpansion(placeId);
                        }}
                        title={expandedRows.has(placeId) ? 'Collapse' : 'Expand to see contacts'}
                      >
                        {expandedRows.has(placeId) ? (
                          <ChevronDown size={18} />
                        ) : (
                          <ChevronRight size={18} />
                        )}
                      </button>
                      <div className="business-info">
                        <span 
                          className="business-name" 
                          title={lead.business?.business_name || 'Unknown Business'}
                        >
                          {lead.business?.business_name || 'Unknown Business'}
                        </span>
                        <span className="place-id" title={placeId}>{placeId}</span>
                      </div>
                    </td>
                    <td className="lead-location">
                      {lead.business?.city || lead.business?.address ? (
                        <div className="location-info">
                          <MapPin size={14} />
                          <span>
                            {[lead.business?.city, lead.business?.country]
                              .filter(Boolean)
                              .join(', ') || lead.business?.address || '-'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td className="lead-contacts-stats">
                      <div className="contact-stats">
                        <span className="contact-count">
                          <User size={14} />
                          {lead.contact_stats?.total || 0}
                        </span>
                        {(lead.contact_stats?.needs_reply ?? 0) > 0 && (
                          <span className="needs-reply-indicator" title={`${lead.contact_stats?.needs_reply ?? 0} needs reply`}>
                            <AlertCircle size={14} />
                            {lead.contact_stats?.needs_reply ?? 0}
                          </span>
                        )}
                        {(lead.contact_stats?.new ?? 0) > 0 && (lead.contact_stats?.needs_reply ?? 0) === 0 && (
                          <span className="new-indicator" title={`${lead.contact_stats?.new ?? 0} new`}>
                            {lead.contact_stats?.new ?? 0} new
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <Badge variant={getStatusBadgeVariant(lead.business?.lead_status || 'NEW')}>
                        {getStatusLabel(lead.business?.lead_status || 'NEW')}
                      </Badge>
                    </td>
                    <td className="lead-source">
                      <span className="source-tag">
                        {lead.business?.source === 'google_maps' ? 'Google Maps' : 
                         lead.business?.source === 'bulk_upload' ? 'Bulk Upload' : 
                         lead.business?.source === 'manual' ? 'Manual' : lead.business?.source || 'Unknown'}
                      </span>
                    </td>
                    <td className="lead-date">
                      <div className="date-info">
                        <Calendar size={14} />
                        <span>{formatDate(lead.business?.created_at || '')}</span>
                      </div>
                    </td>
                    <td className="lead-actions">
                      <div className="actions-menu-wrapper" ref={openMenuId === placeId ? menuRef : null}>
                        <button
                          className="actions-menu-trigger"
                          onClick={(e) => toggleActionsMenu(placeId, e)}
                          title="Actions"
                        >
                          <MoreVertical size={18} />
                        </button>
                        {openMenuId === placeId && (
                          <div className="actions-menu-dropdown">
                            <button
                              className="actions-menu-item"
                              onClick={() => handleEditFromMenu(placeId)}
                            >
                              <Pencil size={14} />
                              Edit Business
                            </button>
                            {lead.business?.business_type !== 'customer' && lead.business?.lead_status !== 'CONVERTED' && (
                              <button
                                className="actions-menu-item convert-action"
                                onClick={() => handleConvertClick(lead)}
                              >
                                <UserCheck size={14} />
                                Mark as Customer
                              </button>
                            )}
                            {(lead.business?.business_type === 'customer' || lead.business?.lead_status === 'CONVERTED') && (
                              <div className="actions-menu-item disabled">
                                <CheckCircle size={14} />
                                <span>Already a Customer</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                  <LeadContactsRow 
                    placeId={placeId}
                    businessName={lead.business?.business_name || 'Unknown Business'}
                    isExpanded={expandedRows.has(placeId)}
                    onViewContact={handleViewContact}
                    selectedLeads={selectedLeads}
                    onSelectLead={handleSelectLead}
                    onSelectAll={handleSelectAll}
                    enrollment={enrollments.get(placeId)}
                    campaignName={
                      enrollments.get(placeId)
                        ? (campaignNames.get(enrollments.get(placeId)!.campaign_definition_id) || 'Campaign')
                        : undefined
                    }
                  />
                </React.Fragment>
              );})
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.total_items > 0 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.total_pages}
          totalItems={pagination.total_items}
          perPage={pagination.per_page}
          hasNext={pagination.has_next}
          hasPrev={pagination.has_prev}
          onPageChange={(page) => setCurrentPage(page)}
          onPerPageChange={(newPerPage) => {
            setPerPage(newPerPage);
            setCurrentPage(1);
          }}
        />
      )}

      {/* Manual Lead Entry Modal */}
      <ManualLeadModal
        isOpen={isManualLeadModalOpen}
        onClose={handleModalClose}
        onSuccess={handleManualLeadSuccess}
        editMode={editMode}
        businessToEdit={businessToEdit || undefined}
      />

      {/* Enroll to Campaign Modal */}
      <EnrollToCampaignModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        leadsToEnroll={getEnrollableLeads()}
        onSuccess={handleEnrollSuccess}
      />

      {/* Convert to Customer Confirmation Modal */}
      {showConvertModal && leadToConvert && (
        <div className="modal-overlay" onClick={handleCloseConvertModal}>
          <div className="modal-content convert-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Mark as Customer</h2>
              <button className="modal-close" onClick={handleCloseConvertModal}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="convert-confirm-message">
                <AlertTriangle size={48} className="warning-icon" />
                <p>
                  Are you sure you want to mark <strong>{leadToConvert.business?.business_name}</strong> as a customer?
                </p>
                <div className="convert-info">
                  <ul>
                    <li>The business type will change from <strong>Prospect</strong> to <strong>Customer</strong></li>
                    <li>The lead status will be set to <strong>Converted</strong></li>
                    <li>Any active campaign enrollments will be <strong>paused</strong></li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <Button
                variant="secondary"
                onClick={handleCloseConvertModal}
                disabled={isConverting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmConvert}
                isLoading={isConverting}
              >
                <CheckCircle size={16} />
                Yes, Mark as Customer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
