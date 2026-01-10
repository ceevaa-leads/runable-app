// Campaign Types

export interface CampaignDefinition {
  id: number;
  name: string;
  description: string | null;
  trigger_statuses: string[];
  trigger_conditions: Record<string, unknown> | null;
  step_count: number;
  is_enabled: boolean; // Account-specific enabled status
}

export interface CampaignStep {
  id: number;
  campaign_definition_id: number;
  step_number: number;
  delay_days: number;
  step_name: string;
  default_subject: string;
  default_body: string;
  is_active: boolean;
  created_at: number;
  updated_at: number;
}

export interface CampaignWithSteps extends CampaignDefinition {
  steps: CampaignStep[];
}

export interface CampaignTemplate {
  step_id: number;
  step_number: number;
  step_name: string;
  delay_days: number;
  default_subject: string;
  default_body: string;
  custom_subject: string | null;
  custom_body: string | null;
  has_custom_template: boolean;
}

export interface CampaignTemplatesResponse {
  campaign_id: number;
  campaign_name: string;
  templates: CampaignTemplate[];
  custom_templates: Array<{
    id: number;
    account_id: number;
    campaign_step_id: number;
    custom_subject: string | null;
    custom_body: string | null;
  }>;
}

export interface CampaignEnrollment {
  id: number;
  account_id: number;
  place_id: string;
  lead_email_id: number;
  campaign_definition_id: number;
  lead_conversation_id: number | null;
  current_step: number;
  status: 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled' | 'replied';
  next_step_at: number | null;
  enrolled_at: number;
  completed_at: number | null;
  paused_reason: string | null;
}

// Enroll request/response types
export interface EnrollLeadsRequest {
  lead_email_ids: string; // Comma-separated IDs like "84,85,86"
}

export interface EnrollLeadsResponse {
  success: boolean;
  total_requested: number;
  enrolled: number;
  failed: number;
  results: EnrollResult[];
}

export interface EnrollResult {
  lead_email_id: number;
  success: boolean;
  message: string;
  enrollment_id?: number;
  email?: string;
  business_name?: string;
  status?: string;
  first_email_at?: number;
  delay_minutes?: number;
}

// Unenroll response types
export interface UnenrollResponse {
  success: boolean;
  message: string;
  enrollment_id: number;
  status?: string;
  business_name?: string;
  email?: string;
  current_status?: string;
  suggestion?: string;
}

// Cancel response types
export interface CancelEnrollmentResponse {
  success: boolean;
  message: string;
  enrollment_id: number;
  previous_status?: string;
  new_status?: string;
  emails_sent?: number;
  business_name?: string;
  email?: string;
  lead_email_status?: string;
  reason?: string;
}

export interface AccountCampaignSetting {
  id: number;
  account_id: number;
  campaign_definition_id: number;
  is_enabled: boolean;
}

export interface CampaignListResponse {
  campaigns: Omit<CampaignDefinition, 'is_enabled'>[];
  enabled_settings: AccountCampaignSetting[];
  account_id: number;
}

export interface CampaignToggleResponse {
  success: boolean;
  campaign_id: number;
  is_enabled: boolean;
  account_id: number;
}

export interface SaveTemplateRequest {
  custom_subject?: string;
  custom_body?: string;
}

export interface SaveTemplateResponse {
  success: boolean;
  campaign_id: number;
  step_id: number;
  custom_subject: string | null;
  custom_body: string | null;
}

export interface EnrollmentsResponse {
  items: CampaignEnrollment[];
  curPage: number;
  nextPage: number | null;
  prevPage: number | null;
  itemsTotal: number;
  pageTotal: number;
}

