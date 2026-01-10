import { leadsApiClient, outreachApiClient, dashboardApiClient, handleApiError } from './api.service';
import type { 
  LeadsResponse, 
  LeadsQueryParams, 
  LeadEmailsResponse,
  ManualLeadInput,
  ManualLeadResponse,
  BusinessSearchResponse,
  ContactSearchResponse,
  BulkUploadResponse,
  LeadsWithStatsResponse,
  ContactsResponse,
  ContactMessagesResponse,
  InboxResponse,
  SendEmailRequest,
  SendEmailResponse,
  GoogleMapsSearchInput,
  GoogleMapsSearchResponse,
  GoogleMapsSearchStatus,
  GoogleMapsSearchResponseV2,
  GoogleMapsSearchStatusV2,
  GoogleMapsPreviewResponse,
  GoogleMapsUnlockResponse,
  GoogleMapsHistoryResponse,
  DraftsResponse,
  DraftDetailResponse,
  ApproveDraftRequest,
  DraftActionResponse,
  SendDraftResponse,
  DraftStatus,
  BusinessWithContactsResponse,
  BusinessUpdateInput,
  BusinessUpdateResponse
} from '../types/leads.types';

// Leads Service - Handle all lead-related operations
class LeadsService {
  private readonly baseEndpoint = '/leads';

  async getLeads(params: LeadsQueryParams = {}): Promise<LeadsResponse> {
    try {
      const response = await leadsApiClient.get<LeadsResponse>(this.baseEndpoint, {
        params: {
          page: params.page || 1,
          per_page: params.per_page || 20,
          ...(params.lead_status && { lead_status: params.lead_status }),
          ...(params.source && { source: params.source }),
          ...(params.search && { search: params.search }),
          ...(params.sort_by && { sort_by: params.sort_by }),
          ...(params.sort_order && { sort_order: params.sort_order }),
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Get leads with aggregated contact statistics
  async getLeadsWithStats(params: LeadsQueryParams = {}): Promise<LeadsWithStatsResponse> {
    try {
      const response = await leadsApiClient.get<LeadsWithStatsResponse>(`${this.baseEndpoint}/with-stats`, {
        params: {
          page: params.page || 1,
          per_page: params.per_page || 20,
          ...(params.lead_status && { lead_status: params.lead_status }),
          ...(params.search && { search: params.search }),
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async getLeadEmails(placeId: string): Promise<LeadEmailsResponse> {
    try {
      const response = await leadsApiClient.get<LeadEmailsResponse>(
        `${this.baseEndpoint}/${encodeURIComponent(placeId)}/emails`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Get contacts for a lead with conversation stats
  async getLeadContacts(placeId: string): Promise<ContactsResponse> {
    try {
      const response = await leadsApiClient.get<ContactsResponse>(
        `${this.baseEndpoint}/${encodeURIComponent(placeId)}/contacts`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Get messages for a specific contact
  async getContactMessages(leadEmailId: number): Promise<ContactMessagesResponse> {
    try {
      const response = await leadsApiClient.get<ContactMessagesResponse>(
        `/contacts/${leadEmailId}/messages`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Search businesses for autocomplete
  async searchBusinesses(query: string, limit: number = 10): Promise<BusinessSearchResponse> {
    try {
      const response = await leadsApiClient.get<BusinessSearchResponse>(
        `${this.baseEndpoint}/search/businesses`,
        { params: { query, limit } }
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Search contacts for autocomplete
  async searchContacts(query: string, placeId?: string, limit: number = 10): Promise<ContactSearchResponse> {
    try {
      const response = await leadsApiClient.get<ContactSearchResponse>(
        `${this.baseEndpoint}/search/contacts`,
        { params: { query, place_id: placeId, limit } }
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Create manual lead
  async createManualLead(data: ManualLeadInput): Promise<ManualLeadResponse> {
    try {
      // Send contacts as array - backend expects json type
      const response = await leadsApiClient.post<ManualLeadResponse>(
        `${this.baseEndpoint}/manual`,
        data
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Bulk upload from CSV
  async bulkUpload(file: File): Promise<BulkUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('csv_file', file);

      const response = await leadsApiClient.post<BulkUploadResponse>(
        `${this.baseEndpoint}/bulk-upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Google Maps Discovery - Start a search
  async startGoogleMapsSearch(input: GoogleMapsSearchInput): Promise<GoogleMapsSearchResponse> {
    try {
      const response = await leadsApiClient.post<GoogleMapsSearchResponse>(
        `${this.baseEndpoint}/google-maps/search`,
        input
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Google Maps Discovery - Check search status
  async getGoogleMapsSearchStatus(runId: string): Promise<GoogleMapsSearchStatus> {
    try {
      const response = await leadsApiClient.get<GoogleMapsSearchStatus>(
        `${this.baseEndpoint}/google-maps/status/${encodeURIComponent(runId)}`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // ============== Enhanced Google Maps Discovery V2 ==============

  // Start or resume a Google Maps search (V2 - with normalization)
  async startGoogleMapsSearchV2(input: { 
    searchKeywords: string; 
    countryCode?: string;
    city?: string;
    state?: string;
    county?: string;
    postalCode?: string;
  }): Promise<GoogleMapsSearchResponseV2> {
    try {
      const response = await leadsApiClient.post<GoogleMapsSearchResponseV2>(
        `${this.baseEndpoint}/google-maps/search`,
        {
          search_keywords: input.searchKeywords,
          ...(input.countryCode && { country_code: input.countryCode.toLowerCase() }),
          ...(input.city && { city: input.city }),
          ...(input.state && { state: input.state }),
          ...(input.county && { county: input.county }),
          ...(input.postalCode && { postal_code: input.postalCode })
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Get search status by search_id (V2)
  async getGoogleMapsSearchStatusV2(searchId: number): Promise<GoogleMapsSearchStatusV2> {
    try {
      const response = await leadsApiClient.get<GoogleMapsSearchStatusV2>(
        `${this.baseEndpoint}/google-maps/search/${searchId}/status`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Get preview results from Apify dataset
  async getGoogleMapsPreview(searchId: number, page: number = 1, perPage: number = 20): Promise<GoogleMapsPreviewResponse> {
    try {
      const response = await leadsApiClient.get<GoogleMapsPreviewResponse>(
        `${this.baseEndpoint}/google-maps/search/${searchId}/preview`,
        { params: { page, per_page: perPage } }
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Unlock a batch of results
  async unlockGoogleMapsResults(searchId: number, batchSize: number): Promise<GoogleMapsUnlockResponse> {
    try {
      const response = await leadsApiClient.post<GoogleMapsUnlockResponse>(
        `${this.baseEndpoint}/google-maps/search/${searchId}/unlock`,
        { batch_size: batchSize }
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Get search history
  async getGoogleMapsHistory(page: number = 1, perPage: number = 10): Promise<GoogleMapsHistoryResponse> {
    try {
      const response = await leadsApiClient.get<GoogleMapsHistoryResponse>(
        `${this.baseEndpoint}/google-maps/history`,
        { params: { page, per_page: perPage } }
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // ============== Business Edit APIs ==============

  // Get business with all contacts for editing
  async getBusinessWithContacts(placeId: string): Promise<BusinessWithContactsResponse> {
    try {
      const response = await leadsApiClient.get<BusinessWithContactsResponse>(
        `${this.baseEndpoint}/${encodeURIComponent(placeId)}`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Update business and manage contacts
  async updateBusiness(placeId: string, data: BusinessUpdateInput): Promise<BusinessUpdateResponse> {
    try {
      const response = await leadsApiClient.put<BusinessUpdateResponse>(
        `${this.baseEndpoint}/${encodeURIComponent(placeId)}`,
        data
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Delete a contact (lead_email)
  async deleteContact(contactId: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await leadsApiClient.delete<{ success: boolean; message: string }>(
        `${this.baseEndpoint}/contacts/${contactId}`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

// Outreach Service - Handle email outreach operations
class OutreachService {
  // Get inbox conversations
  async getInboxConversations(params: {
    filter?: 'all' | 'needs_reply' | 'awaiting' | 'new';
    campaign_id?: number;
    search?: string;
    page?: number;
    per_page?: number;
  } = {}): Promise<InboxResponse> {
    try {
      const response = await outreachApiClient.get<InboxResponse>('/inbox/conversations', {
        params: {
          filter: params.filter || 'all',
          page: params.page || 1,
          per_page: params.per_page || 20,
          ...(params.campaign_id && { campaign_id: params.campaign_id }),
          ...(params.search && { search: params.search }),
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Send email to a contact
  async sendEmail(data: SendEmailRequest): Promise<SendEmailResponse> {
    try {
      const response = await outreachApiClient.post<SendEmailResponse>(
        `/contacts/${data.lead_email_id}/send`,
        {
          subject: data.subject,
          body: data.body,
          ...(data.template_id && { template_id: data.template_id }),
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

// AI Drafts Service - Handle AI-generated email drafts
class DraftsService {
  // Get all drafts with optional status filter
  async getDrafts(params: {
    status?: DraftStatus | 'all';
    page?: number;
    per_page?: number;
  } = {}): Promise<DraftsResponse> {
    try {
      const response = await leadsApiClient.get<DraftsResponse>('/drafts', {
        params: {
          status: params.status || 'pending_review',
          page: params.page || 1,
          per_page: params.per_page || 20,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Get a specific draft with full details
  async getDraft(draftId: number): Promise<DraftDetailResponse> {
    try {
      const response = await leadsApiClient.get<DraftDetailResponse>(`/drafts/${draftId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Approve a draft (optionally with edits)
  async approveDraft(data: ApproveDraftRequest): Promise<DraftActionResponse> {
    try {
      const response = await leadsApiClient.put<DraftActionResponse>(
        `/drafts/${data.draft_id}/approve`,
        {
          ...(data.subject && { subject: data.subject }),
          ...(data.body && { body: data.body }),
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Reject a draft
  async rejectDraft(draftId: number): Promise<DraftActionResponse> {
    try {
      const response = await leadsApiClient.put<DraftActionResponse>(`/drafts/${draftId}/reject`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Send an approved/edited draft
  async sendDraft(draftId: number): Promise<SendDraftResponse> {
    try {
      const response = await leadsApiClient.post<SendDraftResponse>(`/drafts/${draftId}/send`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

// Dashboard Service - Handle dashboard statistics
class DashboardService {
  // Get main dashboard stats (businesses, leads by status)
  async getStats(): Promise<{
    businesses: {
      total: number;
      customers: number;
      prospects: number;
    };
    leads: {
      total: number;
      by_status: {
        new: number;
        contacted: number;
        in_progress: number;
        converted: number;
        lost: number;
        dormant: number;
      };
    };
  }> {
    try {
      const response = await dashboardApiClient.get('/stats');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Get email statistics with optional date filtering
  async getEmailStats(params: {
    start_date?: number;
    end_date?: number;
  } = {}): Promise<{
    emails_sent: number;
    emails_delivered: number;
    emails_engaged: number;
    delivery_rate: number;
    engagement_rate: number;
  }> {
    try {
      const response = await dashboardApiClient.get('/email-stats', {
        params: {
          ...(params.start_date && { start_date: params.start_date }),
          ...(params.end_date && { end_date: params.end_date }),
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Get response rate statistics
  async getResponseRate(params: {
    start_date?: number;
    end_date?: number;
  } = {}): Promise<{
    total_contacted: number;
    total_replied: number;
    response_rate: number;
    emails_sent: number;
    replies_received: number;
  }> {
    try {
      const response = await dashboardApiClient.get('/response-rate', {
        params: {
          ...(params.start_date && { start_date: params.start_date }),
          ...(params.end_date && { end_date: params.end_date }),
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // Get trends data (weekly/monthly)
  async getTrends(params: {
    period?: 'weekly' | 'monthly';
    limit?: number;
  } = {}): Promise<{
    period: string;
    data: Array<{
      period_index: number;
      period_label: string;
      period_start: number;
      period_end: number;
      leads_added: number;
      emails_sent: number;
      replies_received: number;
    }>;
  }> {
    try {
      const response = await dashboardApiClient.get('/trends', {
        params: {
          period: params.period || 'weekly',
          limit: params.limit || 12,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export const leadsService = new LeadsService();
export const outreachService = new OutreachService();
export const draftsService = new DraftsService();
export const dashboardService = new DashboardService();

