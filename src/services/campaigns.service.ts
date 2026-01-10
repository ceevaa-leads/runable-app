import { campaignsApiClient, handleApiError } from './api.service';
import type {
  CampaignDefinition,
  CampaignListResponse,
  CampaignWithSteps,
  CampaignToggleResponse,
  CampaignTemplatesResponse,
  SaveTemplateRequest,
  SaveTemplateResponse,
  EnrollmentsResponse,
  EnrollLeadsResponse,
  UnenrollResponse,
  CancelEnrollmentResponse,
} from '../types/campaign.types';

export interface ProcessedCampaignListResponse {
  campaigns: CampaignDefinition[];
  account_id: number;
}

export const campaignsService = {
  /**
   * Get all campaigns with account-specific enabled status
   */
  async getCampaigns(): Promise<ProcessedCampaignListResponse> {
    try {
      const response = await campaignsApiClient.get<CampaignListResponse>('/campaigns');
      const { campaigns, enabled_settings, account_id } = response.data;
      
      // Create a set of enabled campaign IDs for fast lookup
      const enabledIds = new Set(
        enabled_settings.map(s => s.campaign_definition_id)
      );
      
      // Map campaigns with is_enabled flag
      const processedCampaigns: CampaignDefinition[] = campaigns.map(campaign => ({
        ...campaign,
        is_enabled: enabledIds.has(campaign.id),
      }));
      
      return {
        campaigns: processedCampaigns,
        account_id,
      };
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Get a single campaign with its steps
   */
  async getCampaign(campaignId: number): Promise<CampaignWithSteps> {
    try {
      const response = await campaignsApiClient.get<CampaignWithSteps>(`/campaigns/${campaignId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Toggle campaign enabled/disabled for the current account
   */
  async toggleCampaign(campaignId: number, isEnabled: boolean): Promise<CampaignToggleResponse> {
    try {
      const response = await campaignsApiClient.post<CampaignToggleResponse>(
        `/campaigns/${campaignId}/toggle`,
        { is_enabled: isEnabled }
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Get campaign step templates with custom overrides
   */
  async getTemplates(campaignId: number): Promise<CampaignTemplatesResponse> {
    try {
      const response = await campaignsApiClient.get<CampaignTemplatesResponse>(
        `/campaigns/${campaignId}/templates`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Save a custom template for a campaign step
   */
  async saveTemplate(
    campaignId: number,
    stepId: number,
    template: SaveTemplateRequest
  ): Promise<SaveTemplateResponse> {
    try {
      const response = await campaignsApiClient.put<SaveTemplateResponse>(
        `/campaigns/${campaignId}/templates/${stepId}`,
        template
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Get campaign enrollments for the current account
   */
  async getEnrollments(
    page: number = 1,
    perPage: number = 25,
    status?: string
  ): Promise<EnrollmentsResponse> {
    try {
      const params: Record<string, string | number> = { page, per_page: perPage };
      if (status) {
        params.status = status;
      }
      const response = await campaignsApiClient.get<EnrollmentsResponse>('/campaigns/enrollments', {
        params,
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Enroll one or more leads into a campaign
   * @param leadEmailIds Array of lead_email IDs to enroll
   */
  async enrollLeads(leadEmailIds: number[]): Promise<EnrollLeadsResponse> {
    try {
      const response = await campaignsApiClient.post<EnrollLeadsResponse>(
        '/campaigns/enroll',
        { lead_email_ids: leadEmailIds.join(',') }
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Unenroll a lead from a campaign (only works for scheduled enrollments)
   * @param enrollmentId Campaign enrollment ID
   */
  async unenrollLead(enrollmentId: number): Promise<UnenrollResponse> {
    try {
      const response = await campaignsApiClient.post<UnenrollResponse>(
        `/campaigns/enrollments/${enrollmentId}/unenroll`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Cancel an enrollment (works for scheduled and active enrollments)
   * @param enrollmentId Campaign enrollment ID
   * @param reason Optional cancellation reason
   */
  async cancelEnrollment(enrollmentId: number, reason?: string): Promise<CancelEnrollmentResponse> {
    try {
      const response = await campaignsApiClient.post<CancelEnrollmentResponse>(
        `/campaigns/enrollments/${enrollmentId}/cancel`,
        { reason }
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  /**
   * Get enabled campaigns for the current account (for enrollment UI)
   */
  async getEnabledCampaigns(): Promise<CampaignDefinition[]> {
    try {
      const response = await this.getCampaigns();
      return response.campaigns.filter(c => c.is_enabled);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

