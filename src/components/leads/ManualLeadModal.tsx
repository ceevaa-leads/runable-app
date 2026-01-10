import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  Building2, 
  User, 
  Mail, 
  MapPin, 
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  Trash2,
  Sparkles,
  Plus
} from 'lucide-react';
import { leadsService } from '../../services/leads.service';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';
import type { Business, LeadEmail, ManualLeadInput, ContactInput, BulkUploadSummary, BusinessEditData } from '../../types/leads.types';
import clsx from 'clsx';

export interface LeadSubmissionResult {
  type: 'success' | 'error';
  title: string;
  message?: string;
  details?: {
    businessName?: string;
    email?: string;
    isNewBusiness?: boolean;
    isNewLead?: boolean;
    contactsDeleted?: number;
  };
}

interface ManualLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: LeadSubmissionResult) => void;
  editMode?: boolean;
  businessToEdit?: BusinessEditData;
}

type TabType = 'manual' | 'csv';

export const ManualLeadModal: React.FC<ManualLeadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editMode = false,
  businessToEdit,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('manual');
  
  // Extended contact type for edit mode (includes id and hasEnrollment)
  interface ExtendedContact extends ContactInput {
    id?: number;
    hasEnrollment?: boolean;
    email_status?: string;
  }
  
  // Manual entry state
  const [formData, setFormData] = useState<ManualLeadInput>({
    business_name: '',
    contacts: [{ contact_name: '', email: '' }],
    address: '',
    city: '',
    country: '',
    zip: '',
    place_id: '',
  });
  
  // Extended contacts for edit mode (tracks id and enrollment status)
  const [extendedContacts, setExtendedContacts] = useState<ExtendedContact[]>([{ contact_name: '', email: '' }]);
  
  // Track contacts marked for deletion
  const [deletedContactIds, setDeletedContactIds] = useState<number[]>([]);
  
  // Track inline errors for contact deletion
  const [contactDeleteErrors, setContactDeleteErrors] = useState<Record<number, string>>({});
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Autocomplete state
  const [businessSuggestions, setBusinessSuggestions] = useState<Business[]>([]);
  const [contactSuggestions, setContactSuggestions] = useState<LeadEmail[]>([]);
  const [showBusinessSuggestions, setShowBusinessSuggestions] = useState(false);
  const [showContactSuggestions, setShowContactSuggestions] = useState(false);
  const [isSearchingBusinesses, setIsSearchingBusinesses] = useState(false);
  const [isSearchingContacts, setIsSearchingContacts] = useState(false);
  const [isNewBusiness, setIsNewBusiness] = useState(true); // Track if creating new business

  // CSV upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<BulkUploadSummary | null>(null);

  const businessInputRef = useRef<HTMLInputElement>(null);
  const contactInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const businessSuggestionsRef = useRef<HTMLDivElement>(null);
  const contactSuggestionsRef = useRef<HTMLDivElement>(null);

  // Debounce search
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (editMode && businessToEdit) {
        // Pre-populate form with existing data
        const contacts = businessToEdit.contacts.map(c => ({
          contact_name: c.contact_name,
          email: c.email,
        }));
        
        setFormData({
          business_name: businessToEdit.business_name,
          contacts: contacts.length > 0 ? contacts : [{ contact_name: '', email: '' }],
          address: businessToEdit.address || '',
          city: businessToEdit.city || '',
          country: businessToEdit.country || '',
          zip: businessToEdit.zip || '',
          place_id: businessToEdit.place_id,
        });
        
        // Set extended contacts with id and enrollment info
        setExtendedContacts(
          businessToEdit.contacts.length > 0
            ? businessToEdit.contacts.map(c => ({
                id: c.id,
                contact_name: c.contact_name,
                email: c.email,
                email_status: c.email_status,
                hasEnrollment: c.hasEnrollment || false,
              }))
            : [{ contact_name: '', email: '' }]
        );
        
        setDeletedContactIds([]);
        setContactDeleteErrors({});
        setIsNewBusiness(false);
      } else {
        resetForm();
      }
    }
  }, [isOpen, editMode, businessToEdit]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        businessSuggestionsRef.current &&
        !businessSuggestionsRef.current.contains(event.target as Node) &&
        businessInputRef.current &&
        !businessInputRef.current.contains(event.target as Node)
      ) {
        setShowBusinessSuggestions(false);
      }
      if (
        contactSuggestionsRef.current &&
        !contactSuggestionsRef.current.contains(event.target as Node) &&
        contactInputRef.current &&
        !contactInputRef.current.contains(event.target as Node)
      ) {
        setShowContactSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const resetForm = () => {
    setFormData({
      business_name: '',
      contacts: [{ contact_name: '', email: '' }],
      address: '',
      city: '',
      country: '',
      zip: '',
      place_id: '',
    });
    setExtendedContacts([{ contact_name: '', email: '' }]);
    setDeletedContactIds([]);
    setContactDeleteErrors({});
    setErrors({});
    setSubmitError(null);
    setSubmitSuccess(false);
    setBusinessSuggestions([]);
    setContactSuggestions([]);
    setSelectedFile(null);
    setUploadError(null);
    setUploadResult(null);
    setIsNewBusiness(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear related errors
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // If business name changes manually (not from autocomplete), reset to new business
    if (name === 'business_name') {
      setIsNewBusiness(true);
      // Clear the place_id since user is typing a new name
      setFormData(prev => ({ ...prev, place_id: '' }));
    }
  };

  // Handle contact field changes
  const handleContactChange = (index: number, field: keyof ContactInput, value: string) => {
    // In edit mode, only allow changing contact_name for existing contacts
    if (editMode && extendedContacts[index]?.id && field === 'email') {
      return; // Email is read-only for existing contacts in edit mode
    }
    
    setFormData(prev => ({
      ...prev,
      contacts: prev.contacts.map((contact, i) => 
        i === index ? { ...contact, [field]: value } : contact
      )
    }));
    
    // Also update extended contacts
    setExtendedContacts(prev => prev.map((contact, i) => 
      i === index ? { ...contact, [field]: value } : contact
    ));
    
    // Clear related error
    const errorKey = `contact_${index}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: '' }));
    }
  };

  // Add a new contact
  const addContact = () => {
    setFormData(prev => ({
      ...prev,
      contacts: [...prev.contacts, { contact_name: '', email: '' }]
    }));
    setExtendedContacts(prev => [...prev, { contact_name: '', email: '' }]);
  };

  // Remove a contact
  const removeContact = (index: number) => {
    const contact = extendedContacts[index];
    
    // In create mode, can't remove first contact
    if (!editMode && index === 0) return;
    
    // In edit mode, check if contact is enrolled in campaign
    if (editMode && contact?.id && contact?.hasEnrollment) {
      // Show inline error
      setContactDeleteErrors(prev => ({
        ...prev,
        [index]: 'Cannot delete - enrolled in campaign. Unenroll first.'
      }));
      
      // Clear error after 5 seconds
      setTimeout(() => {
        setContactDeleteErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[index];
          return newErrors;
        });
      }, 5000);
      
      return;
    }
    
    // If existing contact in edit mode, mark for deletion
    if (editMode && contact?.id) {
      setDeletedContactIds(prev => [...prev, contact.id!]);
    }
    
    setFormData(prev => ({
      ...prev,
      contacts: prev.contacts.filter((_, i) => i !== index)
    }));
    setExtendedContacts(prev => prev.filter((_, i) => i !== index));
    
    // Clear any deletion error for this index
    setContactDeleteErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[index];
      return newErrors;
    });
  };

  // Search businesses with debounce
  const handleBusinessSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setBusinessSuggestions([]);
      setShowBusinessSuggestions(false);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearchingBusinesses(true);
      try {
        const response = await leadsService.searchBusinesses(query);
        const items = response.items || [];
        setBusinessSuggestions(items);
        // Only show dropdown if there are actual suggestions
        setShowBusinessSuggestions(items.length > 0);
      } catch (err) {
        console.error('Business search error:', err);
        setShowBusinessSuggestions(false);
      } finally {
        setIsSearchingBusinesses(false);
      }
    }, 300);
  }, []);

  // Search contacts with debounce
  const handleContactSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setContactSuggestions([]);
      setShowContactSuggestions(false);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearchingContacts(true);
      try {
        const response = await leadsService.searchContacts(query, formData.place_id || undefined);
        const items = response.items || [];
        setContactSuggestions(items);
        // Only show dropdown if there are actual suggestions
        setShowContactSuggestions(items.length > 0);
      } catch (err) {
        console.error('Contact search error:', err);
        setShowContactSuggestions(false);
      } finally {
        setIsSearchingContacts(false);
      }
    }, 300);
  }, [formData.place_id]);

  const selectBusiness = (business: Business) => {
    setFormData(prev => ({
      ...prev,
      business_name: business.business_name,
      place_id: business.place_id,
      address: business.address || prev.address,
      city: business.city || prev.city,
      country: business.country || prev.country,
      zip: business.zip || prev.zip,
    }));
    setShowBusinessSuggestions(false);
    setIsNewBusiness(false); // Selected existing business
  };

  const selectContact = (contact: LeadEmail) => {
    // Update the first contact with the selected suggestion
    setFormData(prev => ({
      ...prev,
      contacts: prev.contacts.map((c, i) => 
        i === 0 ? { contact_name: contact.contact_name || '', email: contact.email } : c
      )
    }));
    setShowContactSuggestions(false);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.business_name.trim()) {
      newErrors.business_name = 'Business name is required';
    }

    // Validate each contact's email if provided
    formData.contacts.forEach((contact, index) => {
      if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
        newErrors[`contact_${index}_email`] = 'Please enter a valid email address';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!validateForm()) return;

    // Close any open autocomplete dropdowns
    setShowBusinessSuggestions(false);
    setShowContactSuggestions(false);

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (editMode && businessToEdit) {
        // Update existing business
        const contactsToSend = extendedContacts.map(c => ({
          id: c.id,
          contact_name: c.contact_name,
          email: c.email,
        }));
        
        const response = await leadsService.updateBusiness(businessToEdit.place_id, {
          business_name: formData.business_name,
          address: formData.address,
          city: formData.city,
          country: formData.country,
          zip: formData.zip,
          contacts: contactsToSend,
          deleted_contact_ids: deletedContactIds,
        });
        
        // Build message parts
        const messageParts: string[] = [];
        if (response.data.contacts_updated > 0) {
          messageParts.push(`${response.data.contacts_updated} contact(s) updated`);
        }
        if (response.data.contacts_created > 0) {
          messageParts.push(`${response.data.contacts_created} contact(s) added`);
        }
        if (response.data.contacts_deleted > 0) {
          messageParts.push(`${response.data.contacts_deleted} contact(s) deleted`);
        }
        
        const result: LeadSubmissionResult = {
          type: 'success',
          title: 'Business Updated Successfully',
          message: messageParts.length > 0 ? messageParts.join(', ') + '.' : 'Business details saved.',
          details: {
            businessName: formData.business_name,
            contactsDeleted: response.data.contacts_deleted,
          },
        };
        
        onClose();
        onSuccess(result);
      } else {
        // Create new lead
        const response = await leadsService.createManualLead(formData);
        
        // Close modal immediately and show toast notification
        const contactCount = formData.contacts.filter(c => c.email).length;
        const result: LeadSubmissionResult = {
          type: 'success',
          title: response.data.is_new_business ? 'Lead Created Successfully' : 'Lead Updated Successfully',
          message: response.data.is_new_business 
            ? `New business with ${contactCount} contact${contactCount !== 1 ? 's' : ''} added.`
            : `${contactCount} contact${contactCount !== 1 ? 's' : ''} added to existing business.`,
          details: {
            businessName: formData.business_name,
            email: formData.contacts[0]?.email || undefined,
            isNewBusiness: response.data.is_new_business,
            isNewLead: response.data.is_new_lead,
          },
        };
        
        onClose();
        onSuccess(result);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : editMode ? 'Failed to update business' : 'Failed to create lead';
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prevent form submission on Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  // CSV Upload handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    setUploadError(null);
    setUploadResult(null);

    // Validate file type
    const validTypes = ['text/csv', 'application/csv', 'text/plain', 'application/vnd.ms-excel'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv')) {
      setUploadError('Please upload a valid CSV file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size exceeds 5MB limit');
      return;
    }

    setSelectedFile(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleCsvUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const response = await leadsService.bulkUpload(selectedFile);
      
      // Close modal and show toast notification
      const result: LeadSubmissionResult = {
        type: response.summary.successful > 0 ? 'success' : 'error',
        title: response.summary.successful > 0 ? 'CSV Upload Complete' : 'CSV Upload Failed',
        message: `${response.summary.successful} leads imported successfully${response.summary.failed > 0 ? `, ${response.summary.failed} failed` : ''}`,
      };
      
      onClose();
      onSuccess(result);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = 'business_name,contact_name,email,address,city,country,zip\n' +
      '"Acme Plumbing","John Smith","john@acmeplumbing.com","123 Main St","Los Angeles","USA","90001"\n' +
      '"Best HVAC Services","Jane Doe","jane@besthvac.com","456 Oak Ave","Chicago","USA","60601"';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="manual-lead-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="modal-header">
          <h2>{editMode ? 'Edit Business' : 'Add New Lead'}</h2>
          <p>{editMode ? 'Update business details and manage contacts' : 'Enter lead details manually or upload a CSV file'}</p>
        </div>

        {/* Tabs - hide in edit mode */}
        {!editMode && (
          <div className="modal-tabs">
            <button
              className={clsx('tab-btn', { active: activeTab === 'manual' })}
              onClick={() => setActiveTab('manual')}
            >
              <User size={18} />
              Manual Entry
            </button>
            <button
              className={clsx('tab-btn', { active: activeTab === 'csv' })}
              onClick={() => setActiveTab('csv')}
            >
              <FileSpreadsheet size={18} />
              CSV Upload
            </button>
          </div>
        )}

        <div className="modal-content">
          {/* Manual Entry Tab */}
          {activeTab === 'manual' && (
            <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="manual-entry-form">
              {submitError && (
                <Alert type="error" message={submitError} className="form-alert" />
              )}

              {/* Business Name with Autocomplete */}
              <div className="autocomplete-wrapper">
                <Input
                  ref={businessInputRef}
                  label="Business Name"
                  name="business_name"
                  type="text"
                  placeholder="Start typing to search..."
                  icon={<Building2 size={18} />}
                  value={formData.business_name}
                  onChange={(e) => {
                    handleInputChange(e);
                    handleBusinessSearch(e.target.value);
                  }}
                  onFocus={() => formData.business_name.length >= 2 && businessSuggestions.length > 0 && setShowBusinessSuggestions(true)}
                  error={errors.business_name}
                  autoComplete="off"
                />
                {/* New Business Indicator */}
                {formData.business_name.length >= 2 && isNewBusiness && !showBusinessSuggestions && (
                  <div className="new-business-indicator">
                    <Sparkles size={14} />
                    <span>New business will be created</span>
                  </div>
                )}
                {/* Existing Business Indicator */}
                {!isNewBusiness && formData.place_id && (
                  <div className="existing-business-indicator">
                    <CheckCircle size={14} />
                    <span>Existing business selected</span>
                  </div>
                )}
                {showBusinessSuggestions && businessSuggestions.length > 0 && (
                  <div className="autocomplete-suggestions" ref={businessSuggestionsRef}>
                    {isSearchingBusinesses ? (
                      <div className="suggestion-loading">
                        <Loader2 size={16} className="spinner" />
                        Searching...
                      </div>
                    ) : (
                      businessSuggestions.map((business) => (
                        <div
                          key={business.id}
                          className="suggestion-item"
                          onClick={() => selectBusiness(business)}
                        >
                          <Building2 size={16} />
                          <div className="suggestion-content">
                            <span className="suggestion-title">{business.business_name}</span>
                            {business.city && (
                              <span className="suggestion-subtitle">{business.city}, {business.country}</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Contacts Section */}
              <div className="contacts-section">
                {formData.contacts.map((contact, index) => (
                  <div key={index} className={`contact-group ${index > 0 || editMode ? 'additional-contact' : ''}`}>
                    {/* Show header if multiple contacts OR in edit mode */}
                    {(formData.contacts.length > 1 || editMode) && (
                      <div className="contact-header">
                        <span className="contact-label">
                          Contact {index + 1}
                          {editMode && extendedContacts[index]?.id && (
                            <span className="contact-status-badge">
                              {extendedContacts[index]?.hasEnrollment ? ' (Enrolled)' : ''}
                            </span>
                          )}
                        </span>
                        {/* In edit mode, show delete for all contacts. In create mode, only for index > 0 */}
                        {(editMode || index > 0) && (
                          <button
                            type="button"
                            className={clsx('remove-contact-btn', { 
                              'enrolled': editMode && extendedContacts[index]?.hasEnrollment 
                            })}
                            onClick={() => removeContact(index)}
                            title={editMode && extendedContacts[index]?.hasEnrollment 
                              ? "Unenroll from campaign first to delete" 
                              : "Remove contact"}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    )}
                    
                    {/* Inline error for blocked deletion */}
                    {contactDeleteErrors[index] && (
                      <div className="contact-delete-error">
                        <AlertCircle size={14} />
                        <span>{contactDeleteErrors[index]}</span>
                      </div>
                    )}
                    
                    {/* Contact Name with Autocomplete (first contact only) */}
                    {index === 0 ? (
                      <div className="autocomplete-wrapper">
                        <Input
                          ref={contactInputRef}
                          label={formData.contacts.length > 1 ? undefined : "Contact Name (Optional)"}
                          name={`contact_name_${index}`}
                          type="text"
                          placeholder="Enter contact name..."
                          icon={<User size={18} />}
                          value={contact.contact_name}
                          onChange={(e) => {
                            handleContactChange(index, 'contact_name', e.target.value);
                            handleContactSearch(e.target.value);
                          }}
                          onFocus={() => contact.contact_name.length >= 2 && contactSuggestions.length > 0 && setShowContactSuggestions(true)}
                          error={errors[`contact_${index}_contact_name`]}
                          autoComplete="off"
                        />
                        {showContactSuggestions && contactSuggestions.length > 0 && (
                          <div className="autocomplete-suggestions" ref={contactSuggestionsRef}>
                            {isSearchingContacts ? (
                              <div className="suggestion-loading">
                                <Loader2 size={16} className="spinner" />
                                Searching...
                              </div>
                            ) : (
                              contactSuggestions.map((contactSugg) => (
                                <div
                                  key={contactSugg.id}
                                  className="suggestion-item"
                                  onClick={() => selectContact(contactSugg)}
                                >
                                  <User size={16} />
                                  <div className="suggestion-content">
                                    <span className="suggestion-title">{contactSugg.contact_name || contactSugg.email}</span>
                                    <span className="suggestion-subtitle">{contactSugg.email}</span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Input
                        name={`contact_name_${index}`}
                        type="text"
                        placeholder="Enter contact name..."
                        icon={<User size={18} />}
                        value={contact.contact_name}
                        onChange={(e) => handleContactChange(index, 'contact_name', e.target.value)}
                        error={errors[`contact_${index}_contact_name`]}
                        autoComplete="off"
                      />
                    )}

                    {/* Email */}
                    <Input
                      label={index === 0 && formData.contacts.length === 1 && !editMode ? "Email (Optional)" : undefined}
                      name={`email_${index}`}
                      type="email"
                      placeholder="contact@business.com"
                      icon={<Mail size={18} />}
                      value={contact.email}
                      onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                      error={errors[`contact_${index}_email`]}
                      disabled={editMode && !!extendedContacts[index]?.id}
                    />
                    {/* Read-only hint for existing contacts */}
                    {editMode && extendedContacts[index]?.id && (
                      <div className="email-readonly-hint">
                        Email cannot be changed for existing contacts
                      </div>
                    )}
                  </div>
                ))}

                {/* Add Another Contact Link */}
                <button
                  type="button"
                  className="add-contact-btn"
                  onClick={addContact}
                >
                  <Plus size={16} />
                  Add Another Contact
                </button>
              </div>

              {/* Address Section */}
              <div className="form-section">
                <h4 className="section-title">
                  <MapPin size={16} />
                  Address Details (Optional)
                </h4>
                <Input
                  label="Street Address"
                  name="address"
                  type="text"
                  placeholder="123 Main Street"
                  value={formData.address}
                  onChange={handleInputChange}
                />
                <div className="form-row">
                  <Input
                    label="City"
                    name="city"
                    type="text"
                    placeholder="Los Angeles"
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                  <Input
                    label="Country"
                    name="country"
                    type="text"
                    placeholder="USA"
                    value={formData.country}
                    onChange={handleInputChange}
                  />
                </div>
                <Input
                  label="ZIP Code"
                  name="zip"
                  type="text"
                  placeholder="90001"
                  value={formData.zip}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-actions">
                <Button type="button" variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isSubmitting}>
                  {submitSuccess ? (
                    <>
                      <CheckCircle size={18} />
                      {editMode ? 'Saved!' : 'Created!'}
                    </>
                  ) : (
                    editMode ? 'Save Changes' : 'Create Lead'
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* CSV Upload Tab */}
          {activeTab === 'csv' && (
            <div className="csv-upload-form">
              {uploadResult ? (
                <div className="upload-result">
                  <div className={clsx('result-header', { success: uploadResult.successful > 0, error: uploadResult.failed > 0 && uploadResult.successful === 0 })}>
                    {uploadResult.successful > 0 ? (
                      <CheckCircle size={48} />
                    ) : (
                      <AlertCircle size={48} />
                    )}
                    <h3>Upload Complete</h3>
                  </div>
                  
                  <div className="result-stats">
                    <div className="stat">
                      <span className="stat-value">{uploadResult.total_rows}</span>
                      <span className="stat-label">Total Rows</span>
                    </div>
                    <div className="stat success">
                      <span className="stat-value">{uploadResult.successful}</span>
                      <span className="stat-label">Successful</span>
                    </div>
                    <div className="stat error">
                      <span className="stat-value">{uploadResult.failed}</span>
                      <span className="stat-label">Failed</span>
                    </div>
                  </div>

                  {uploadResult.errors.length > 0 && (
                    <div className="result-errors">
                      <h4>Errors:</h4>
                      <ul>
                        {uploadResult.errors.slice(0, 10).map((err, idx) => (
                          <li key={idx}>Row {err.row}: {err.error}</li>
                        ))}
                        {uploadResult.errors.length > 10 && (
                          <li>...and {uploadResult.errors.length - 10} more errors</li>
                        )}
                      </ul>
                    </div>
                  )}

                  <Button
                    variant="primary"
                    onClick={() => {
                      setUploadResult(null);
                      setSelectedFile(null);
                    }}
                  >
                    Upload Another File
                  </Button>
                </div>
              ) : (
                <>
                  <div className="csv-instructions">
                    <h4>CSV Format Requirements</h4>
                    <p>Your CSV file should include the following columns:</p>
                    <ul>
                      <li><strong>business_name</strong> (required)</li>
                      <li><strong>contact_name</strong> (required)</li>
                      <li>email (optional)</li>
                      <li>address (optional)</li>
                      <li>city (optional)</li>
                      <li>country (optional)</li>
                      <li>zip (optional)</li>
                    </ul>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadTemplate}
                      icon={<Download size={16} />}
                    >
                      Download Template
                    </Button>
                  </div>

                  {uploadError && (
                    <Alert type="error" message={uploadError} className="form-alert" />
                  )}

                  <div
                    className={clsx('dropzone', { dragging: isDragging, 'has-file': selectedFile })}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,text/csv,application/csv"
                      onChange={handleFileInputChange}
                      style={{ display: 'none' }}
                    />

                    {selectedFile ? (
                      <div className="selected-file">
                        <FileSpreadsheet size={40} />
                        <div className="file-info">
                          <span className="file-name">{selectedFile.name}</span>
                          <span className="file-size">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                        <button
                          className="remove-file-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                          }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="dropzone-content">
                        <Upload size={40} />
                        <p className="dropzone-title">
                          Drag & drop your CSV file here
                        </p>
                        <p className="dropzone-subtitle">
                          or click to browse (max 5MB, 1000 rows)
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="form-actions">
                    <Button type="button" variant="secondary" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleCsvUpload}
                      disabled={!selectedFile}
                      isLoading={isUploading}
                    >
                      Upload & Import
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

