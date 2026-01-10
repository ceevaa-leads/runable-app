// Lead Types
// NOTE: leads table has been deprecated - business table now contains lead fields

export type LeadStatus = 'NEW' | 'CONTACTED' | 'IN_PROGRESS' | 'CONVERTED' | 'LOST' | 'DORMANT';
export type BusinessType = 'prospect' | 'customer';
export type LeadSource = 'google_maps' | 'manual' | 'bulk_upload' | 'referral' | 'other';
export type MessageDirection = 'inbound' | 'outbound';

export interface Business {
  id: number;
  place_id: string;
  account_id: number;
  business_name: string;
  business_type: BusinessType;
  // Lead fields (previously in leads table)
  lead_status?: LeadStatus;
  source?: LeadSource;
  notes?: string;
  last_contacted_at?: string;
  converted_at?: string;
  // Address fields
  address?: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  country_code?: string;
  zip?: string;
  postal_code?: string;
  // Contact & web
  phone?: string;
  website?: string;
  google_maps_url?: string;
  // Business metadata
  category?: string;
  categories?: string[];
  rating?: number;
  review_count?: number;
  latitude?: number;
  longitude?: number;
  parent_company?: string;
  // Timestamps
  created_at?: string;
  updated_at?: string;
}

// Google Maps Search Types
export interface GoogleMapsSearchInput {
  searchStrings: string[];
  location: string;
}

export interface GoogleMapsSearchResponse {
  success: boolean;
  run_id: string;
  message: string;
  estimated_time?: number;
}

export interface GoogleMapsSearchStatus {
  run_id: string;
  status: 'READY' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'ABORTED' | 'TIMED-OUT' | 'UNKNOWN';
  progress?: number;
  results_count?: number;
  error_message?: string;
  businesses_added?: number;
  leads_added?: number;
  contacts_added?: number;
  duplicates_updated?: number;
}

export interface GoogleMapsSearchResult {
  run_id: string;
  status: 'SUCCEEDED' | 'FAILED';
  businesses_added: number;
  leads_added: number;
  contacts_added: number;
  duplicates_updated: number;
  errors: string[];
}

// ============== Enhanced Google Maps Discovery Types ==============

// Response from POST /leads/google-maps/search (enhanced)
export interface GoogleMapsSearchResponseV2 {
  success: boolean;
  is_new_search: boolean;
  search_id: number;
  query_hash: string;
  run_id?: string;
  dataset_id?: string;
  status: GoogleMapsSearchStatus['status'];
  unique_records: number;
  unlocked_count: number;
  location?: {
    text: string;
    latitude: number;
    longitude: number;
  };
  message: string;
}

// Response from GET /leads/google-maps/search/{id}/status
export interface GoogleMapsSearchStatusV2 {
  search_id: number;
  status: 'READY' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'ABORTED' | 'TIMED-OUT' | 'UNKNOWN';
  unique_records: number;
  unlocked_count: number;
  available_to_unlock: number;
  progress: number;
}

// Preview item from Apify dataset
export interface GoogleMapsPreviewItem {
  place_id: string;
  title: string;
  category?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  rating?: number;
  review_count?: number;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  is_unlocked: boolean;
  latitude?: number;
  longitude?: number;
}

// Response from GET /leads/google-maps/search/{id}/preview
export interface GoogleMapsPreviewResponse {
  search_id: number;
  items: GoogleMapsPreviewItem[];
  pagination: {
    page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  unlock_batches: number[];
  unique_records: number;
  unlocked_count: number;
  available_to_unlock: number;
  credits_balance: number;
}

// Unlocked item details
export interface GoogleMapsUnlockedItem {
  place_id: string;
  title: string;
  category?: string;
  address?: string;
  city?: string;
  phone?: string;
  website?: string;
  rating?: number;
}

// Response from POST /leads/google-maps/search/{id}/unlock
export interface GoogleMapsUnlockResponse {
  success: boolean;
  unlocked: number;
  businesses_created: number;
  leads_created: number;
  skipped_duplicates: number;
  total_unlocked: number;
  remaining: number;
  credits_used: number;
  credits_remaining: number;
  needs_deepening: boolean;
  deepening_triggered: boolean;
  deepening_result?: {
    success: boolean;
    new_run_id: string;
    new_dataset_id: string;
    new_max_places: number;
    old_max_places: number;
    message: string;
  } | null;
  items: GoogleMapsUnlockedItem[];
  message: string;
}

// Search history item
export interface GoogleMapsSearchHistoryItem {
  search_id: number;
  query_text: string;
  location_text: string;
  location_latitude?: number;
  location_longitude?: number;
  status: GoogleMapsSearchStatus['status'];
  unique_records: number;
  unlocked_count: number;
  available_to_unlock: number;
  created_at: string;
  last_accessed_at: string;
}

// Response from GET /leads/google-maps/history
export interface GoogleMapsHistoryResponse {
  items: GoogleMapsSearchHistoryItem[];
  pagination: {
    page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// Lead type is now just an alias for Business (leads table deprecated)
export interface Lead extends Business {
  // Legacy compatibility - lead fields are now on Business
  status?: LeadStatus;  // Maps to lead_status
}

// Contact stats for aggregated view
export interface ContactStats {
  total: number;
  needs_reply: number;
  new: number;
  contacted: number;
  in_progress: number;
}

// Lead with aggregated contact statistics (API returns nested business object)
export interface LeadWithStats {
  id: number;
  account_id: number;
  business: Business;
  contact_count: number;
  conversation_count: number;
  contact_stats?: ContactStats;
  last_activity?: string | null;
}

// Lead Email (contact) for a business
export interface LeadEmail {
  id: number;
  place_id: string;
  account_id: number;
  email: string;
  contact_name?: string;
  email_status: LeadStatus;
  source: LeadSource;
  current_campaign_id?: number;
  current_conversation_id?: string;
  created_at: string;
  updated_at?: string;
}

// Contact with conversation stats
export interface ContactWithStats extends LeadEmail {
  conversation_id: string | null;
  message_count: number;
  last_message_at: string | null;
  last_message_direction: MessageDirection | null;
  needs_reply: boolean;
}

// Email message in a conversation
export interface Message {
  id: number;
  conversation_id: string;
  message_id: string;
  subject: string;
  body: string;
  contact_name?: string;
  direction: MessageDirection;
  sendgrid_message_id?: string;
  sendgrid_event?: string;
  in_reply_to?: string;
  created_at: string;
  updated_at?: string;
}

// Conversation record
export interface Conversation {
  id: number;
  place_id: string;
  account_id: number;
  email: string;
  conversation_id: string;
  campaign_id?: number;
  sent_message_count: number;
  last_activity_at: string;
  created_at: string;
  updated_at?: string;
}

// Email template
export interface EmailTemplate {
  id: number;
  account_id: number;
  template_type: string;
  subject: string;
  body: string;
  signature?: string;
  created_at: string;
  updated_at?: string;
}

// Campaign
export interface Campaign {
  id: number;
  account_id: number;
  name: string;
  description?: string;
  active: boolean;
  created_at: string;
  updated_at?: string;
}

// Inbox conversation with details
export interface InboxConversation extends Conversation {
  contact: LeadEmail;
  business: Business;
  last_message: Message | null;
  message_count: number;
  needs_reply: boolean;
  is_awaiting: boolean;
  ai_draft: EmailDraft | null;
  ai_analysis: LLMAnalysis | null;
}

export interface LeadEmailsResponse {
  items: LeadEmail[];
}

// Response for leads with stats
export interface LeadsWithStatsResponse {
  items: LeadWithStats[];
  pagination: LeadsPagination;
}

// Response for contacts with stats
export interface ContactsResponse {
  business: Business;
  contacts: ContactWithStats[];
  total_contacts: number;
}

// Response for contact messages
export interface ContactMessagesResponse {
  contact: LeadEmail;
  business: Business;
  conversation: Conversation | null;
  messages: Message[];
  templates: EmailTemplate[];
}

// Response for inbox conversations
export interface InboxResponse {
  conversations: InboxConversation[];
  pagination: LeadsPagination;
  counts: {
    needs_reply: number;
    awaiting: number;
    new: number;
    pending_drafts: number;
  };
  campaigns: Campaign[];
}

// Send email request/response
export interface SendEmailRequest {
  lead_email_id: number;
  subject: string;
  body: string;
  template_id?: number;
}

export interface SendEmailResponse {
  success: boolean;
  message_id: string;
  conversation_id: string;
  is_new_conversation: boolean;
  contact_status: LeadStatus;
}

export interface LeadsFilters {
  lead_status?: LeadStatus;
  source?: LeadSource;
  search?: string;
  sort_by?: 'created_at' | 'updated_at' | 'lead_status';
  sort_order?: 'asc' | 'desc';
}

export interface LeadsPagination {
  page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface LeadsResponse {
  items: Lead[];
  pagination: LeadsPagination;
}

export interface LeadsQueryParams extends LeadsFilters {
  page?: number;
  per_page?: number;
}

// Manual Lead Entry Types
export interface ContactInput {
  contact_name: string;
  email: string;
}

export interface ManualLeadInput {
  business_name: string;
  contacts: ContactInput[];
  address?: string;
  city?: string;
  country?: string;
  zip?: string;
  place_id?: string;
}

export interface ManualLeadResponse {
  success: boolean;
  message: string;
  data: {
    business: Business | null;
    lead: Lead | null;
    email: LeadEmail | null;
    place_id: string;
    is_new_business: boolean;
    is_new_lead: boolean;
    is_new_email: boolean;
    email_already_exists: boolean;
  };
}

export interface BusinessSearchResponse {
  items: Business[];
}

export interface ContactSearchResponse {
  items: LeadEmail[];
}

export interface BulkUploadSummary {
  total_rows: number;
  successful: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

export interface BulkUploadResponse {
  success: boolean;
  message: string;
  summary: BulkUploadSummary;
}

// AI Draft Types
export type DraftStatus = 'pending_review' | 'approved' | 'rejected' | 'sent' | 'edited';

export interface LLMAnalysis {
  id: number;
  lead_message_id: number;
  account_id: number;
  intent: 'inquiry' | 'complaint' | 'interested' | 'not_interested' | 'question' | 'follow_up' | 'thank_you' | 'other';
  sentiment: 'positive' | 'neutral' | 'negative';
  key_topics: string[];
  suggested_action?: string;
  summary?: string;
  extracted_questions?: string[];
  raw_analysis?: Record<string, unknown>;
  ai_model_used?: string;
  created_at: string;
}

export interface EmailDraft {
  id: number;
  lead_message_id: number;
  conversation_id: string;
  account_id: number;
  lead_email_id: number;
  subject: string;
  body: string;
  status: DraftStatus;
  ai_confidence_score?: number;
  ai_model_used?: string;
  user_edits?: string;
  created_at: string;
  updated_at?: string;
  sent_at?: string;
}

export interface DraftWithDetails extends EmailDraft {
  contact: LeadEmail | null;
  business: Business | null;
  original_message: Message | null;
  analysis: LLMAnalysis | null;
}

export interface DraftsResponse {
  drafts: DraftWithDetails[];
  pagination: LeadsPagination;
  pending_count: number;
}

export interface DraftDetailResponse {
  draft: EmailDraft;
  contact: LeadEmail | null;
  business: Business | null;
  original_message: Message | null;
  analysis: LLMAnalysis | null;
  conversation_history: Message[];
}

export interface ApproveDraftRequest {
  draft_id: number;
  subject?: string;
  body?: string;
}

export interface DraftActionResponse {
  success: boolean;
  draft: EmailDraft;
  message: string;
}

export interface SendDraftResponse {
  success: boolean;
  message_id: string;
  conversation_id: string;
  message: string;
}

// Business Edit Types
export interface ContactEditData {
  id?: number;              // Existing contacts have ID, new ones don't
  contact_name: string;
  email: string;
  email_status?: string;
  hasEnrollment?: boolean;  // True if enrolled in active/scheduled campaign
  isDeleted?: boolean;      // Marked for deletion
}

export interface BusinessEditData {
  place_id: string;
  business_name: string;
  address?: string;
  city?: string;
  country?: string;
  zip?: string;
  contacts: ContactEditData[];
}

export interface BusinessWithContactsResponse {
  success: boolean;
  business: Business;
  contacts: ContactEditData[];
}

export interface BusinessUpdateInput {
  business_name: string;
  address?: string;
  city?: string;
  country?: string;
  zip?: string;
  contacts: ContactEditData[];
  deleted_contact_ids?: number[];
}

export interface BusinessUpdateResponse {
  success: boolean;
  message: string;
  data: {
    business: Business;
    contacts_created: number;
    contacts_updated: number;
    contacts_deleted: number;
    auto_enrollments: number;
  };
}

