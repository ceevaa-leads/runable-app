import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Search, 
  Building2,
  User,
  UserCheck,
  UserPlus,
  Loader2,
  CheckCircle,
  AlertTriangle,
  X,
  MoreVertical,
  Phone,
  Globe,
  Star
} from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { Alert } from '../../components/ui/Alert';
import { ToastContainer, useToast } from '../../components/ui/Toast';
import { businessesService } from '../../services/businesses.service';
import type { Business, BusinessesResponse } from '../../services/businesses.service';

type BusinessTypeFilter = '' | 'customer' | 'prospect';

export const BusinessesPage: React.FC = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [pagination, setPagination] = useState<BusinessesResponse['pagination'] | null>(null);
  const [counts, setCounts] = useState<BusinessesResponse['counts']>({ all: 0, customers: 0, prospects: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<BusinessTypeFilter>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // Convert to customer modal state
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [businessToConvert, setBusinessToConvert] = useState<Business | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  // Actions menu state
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
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

  // Toast notifications
  const { toasts, addToast, dismissToast } = useToast();

  const fetchBusinesses = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await businessesService.getBusinesses({
        business_type: typeFilter || undefined,
        page: currentPage,
        per_page: perPage,
      });
      
      // Client-side search filter (since API doesn't support it yet)
      let filteredItems = response.items;
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        filteredItems = response.items.filter(biz => 
          biz.business_name?.toLowerCase().includes(searchLower) ||
          biz.city?.toLowerCase().includes(searchLower) ||
          biz.address?.toLowerCase().includes(searchLower)
        );
      }
      
      setBusinesses(filteredItems);
      setPagination(response.pagination);
      setCounts(response.counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load businesses');
    } finally {
      setIsLoading(false);
    }
  }, [typeFilter, currentPage, perPage, searchTerm]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchBusinesses();
  };

  const handleTypeFilterChange = (type: BusinessTypeFilter) => {
    setTypeFilter(type);
    setCurrentPage(1);
  };

  const getTypeIcon = (type: string) => {
    if (type === 'customer') {
      return <UserCheck size={14} className="type-icon customer" />;
    }
    return <UserPlus size={14} className="type-icon prospect" />;
  };

  const getTypeBadgeVariant = (type: string): 'success' | 'warning' => {
    return type === 'customer' ? 'success' : 'warning';
  };

  // Toggle actions menu
  const toggleActionsMenu = (businessId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === businessId ? null : businessId);
  };

  // Open convert confirmation modal
  const handleConvertClick = (business: Business) => {
    setOpenMenuId(null);
    setBusinessToConvert(business);
    setShowConvertModal(true);
  };

  // Close convert modal
  const handleCloseConvertModal = () => {
    setShowConvertModal(false);
    setBusinessToConvert(null);
  };

  // Confirm conversion
  const handleConfirmConvert = async () => {
    if (!businessToConvert) return;

    setIsConverting(true);
    try {
      const result = await businessesService.convertToCustomer(businessToConvert.id);
      
      addToast({
        type: 'success',
        title: 'Conversion Successful',
        message: result.message,
      });

      // Close modal and refresh list
      handleCloseConvertModal();
      fetchBusinesses();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Conversion Failed',
        message: err instanceof Error ? err.message : 'Failed to convert business',
      });
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="businesses-page">
      {/* Header */}
      <div className="businesses-header">
        <div className="businesses-title-section">
          <h1>Businesses</h1>
          <p className="businesses-subtitle">
            Manage your customers and prospects
          </p>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="businesses-filter-bar">
        <div className="filter-pills">
          <button
            className={`filter-pill ${typeFilter === '' ? 'active' : ''}`}
            onClick={() => handleTypeFilterChange('')}
          >
            <Building2 size={16} />
            All ({counts.all})
          </button>
          <button
            className={`filter-pill customer ${typeFilter === 'customer' ? 'active' : ''}`}
            onClick={() => handleTypeFilterChange('customer')}
          >
            <UserCheck size={16} />
            Customers ({counts.customers})
          </button>
          <button
            className={`filter-pill prospect ${typeFilter === 'prospect' ? 'active' : ''}`}
            onClick={() => handleTypeFilterChange('prospect')}
          >
            <UserPlus size={16} />
            Prospects ({counts.prospects})
          </button>
        </div>

        <form onSubmit={handleSearch} className="businesses-search-form">
          <Input
            type="text"
            placeholder="Search businesses..."
            icon={<Search size={18} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button type="submit" variant="primary" size="md">
            Search
          </Button>
        </form>
      </div>

      {/* Error State */}
      {error && (
        <Alert type="error" message={error} className="businesses-error" />
      )}

      {/* Data Grid */}
      <div className="businesses-table-container">
        <table className="businesses-table">
          <thead>
            <tr>
              <th className="col-name">Name</th>
              <th className="col-type">Type</th>
              <th className="col-address">Address</th>
              <th className="col-location">Location</th>
              <th className="col-contacts">Contacts</th>
              <th className="col-phone">Phone</th>
              <th className="col-website">Website</th>
              <th className="col-rating">Rating</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9} className="table-loading">
                  <Loader2 size={24} className="spinning" />
                  <span>Loading businesses...</span>
                </td>
              </tr>
            ) : businesses.length === 0 ? (
              <tr className="empty-row">
                <td colSpan={9} className="table-empty">
                  <div className="empty-state">
                    {typeFilter === 'customer' ? (
                      <UserCheck size={48} />
                    ) : typeFilter === 'prospect' ? (
                      <UserPlus size={48} />
                    ) : (
                      <Building2 size={48} />
                    )}
                    <h3>
                      {typeFilter === 'customer' 
                        ? 'No customers found' 
                        : typeFilter === 'prospect' 
                          ? 'No prospects found' 
                          : 'No businesses found'}
                    </h3>
                    <p>
                      {searchTerm 
                        ? 'Try adjusting your search term'
                        : typeFilter === 'customer'
                          ? 'Customers will appear here when prospects are converted'
                          : typeFilter === 'prospect'
                            ? 'Prospects will appear here when you source leads'
                            : 'Businesses will appear here when you source leads'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              businesses.map((business) => (
                <tr key={business.id}>
                  <td className="business-name-cell">
                    <span 
                      className="business-name" 
                      title={business.business_name || 'Unknown'}
                    >
                      {business.business_name || 'Unknown'}
                    </span>
                  </td>
                  <td className="business-type-cell">
                    <Badge variant={getTypeBadgeVariant(business.business_type)}>
                      {getTypeIcon(business.business_type)}
                      {business.business_type === 'customer' ? 'Customer' : 'Prospect'}
                    </Badge>
                  </td>
                  <td className="business-address-cell">
                    {business.address ? (
                      <span className="address-text" title={business.address}>
                        {business.address}
                      </span>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td className="business-location-cell">
                    {business.city || business.country ? (
                      <span 
                        className="location-text" 
                        title={[business.city, business.country].filter(Boolean).join(', ')}
                      >
                        {[business.city, business.country].filter(Boolean).join(', ') || '-'}
                      </span>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td className="business-contacts-cell">
                    <div className="contacts-count">
                      <User size={14} />
                      <span>{business.contact_count || 0}</span>
                    </div>
                  </td>
                  <td className="business-phone-cell">
                    {business.phone ? (
                      <a 
                        href={`tel:${business.phone}`} 
                        className="phone-link" 
                        title={business.phone}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone size={14} />
                        <span>{business.phone}</span>
                      </a>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td className="business-website-cell">
                    {business.website ? (
                      <a 
                        href={business.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="website-link"
                        title={business.website}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Globe size={14} />
                        <span>Visit</span>
                      </a>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td className="business-rating-cell">
                    {business.rating ? (
                      <div className="rating-info" title={`${business.rating} (${business.review_count || 0} reviews)`}>
                        <Star size={14} />
                        <span>{business.rating}</span>
                      </div>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td className="business-actions-cell">
                    <div className="actions-menu-wrapper" ref={openMenuId === business.id ? menuRef : null}>
                      <button
                        className="actions-menu-trigger"
                        onClick={(e) => toggleActionsMenu(business.id, e)}
                        title="Actions"
                      >
                        <MoreVertical size={18} />
                      </button>
                      {openMenuId === business.id && (
                        <div className="actions-menu-dropdown">
                          {business.business_type === 'prospect' ? (
                            <button
                              className="actions-menu-item convert-action"
                              onClick={() => handleConvertClick(business)}
                            >
                              <UserCheck size={14} />
                              Convert to Customer
                            </button>
                          ) : (
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
              ))
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

      {/* Convert to Customer Confirmation Modal */}
      {showConvertModal && businessToConvert && (
        <div className="modal-overlay" onClick={handleCloseConvertModal}>
          <div className="modal-content convert-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Convert to Customer</h2>
              <button className="modal-close" onClick={handleCloseConvertModal}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="convert-confirm-message">
                <AlertTriangle size={48} className="warning-icon" />
                <p>
                  Are you sure you want to convert <strong>{businessToConvert.business_name}</strong> to a customer?
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
                Yes, Convert to Customer
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

