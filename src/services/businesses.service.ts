import { outreachApiClient, handleApiError } from './api.service';

export interface Business {
  id: number;
  place_id: string;
  account_id: number;
  business_name: string;
  business_type: 'customer' | 'prospect';
  address: string | null;
  city: string | null;
  country: string | null;
  website: string | null;
  phone: string | null;
  rating: number | null;
  review_count: number | null;
  created_at: string;
  updated_at: string | null;
  converted_at: string | null;
  contact_count: number;
}

export interface BusinessesResponse {
  items: Business[];
  pagination: {
    page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  counts: {
    all: number;
    customers: number;
    prospects: number;
  };
}

interface GetBusinessesParams {
  business_type?: 'customer' | 'prospect';
  page?: number;
  per_page?: number;
}

export interface ConvertToCustomerResponse {
  success: boolean;
  message: string;
  data: {
    business: Business;
    paused_campaigns: Array<{
      enrollment_id: number;
      campaign_name: string;
      contact_email: string;
    }>;
    paused_count: number;
  };
}

class BusinessesService {
  async getBusinesses(params: GetBusinessesParams = {}): Promise<BusinessesResponse> {
    try {
      const response = await outreachApiClient.get<BusinessesResponse>('/businesses', {
        params: {
          ...(params.business_type && { business_type: params.business_type }),
          ...(params.page && { page: params.page }),
          ...(params.per_page && { per_page: params.per_page }),
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async convertToCustomer(businessId: number): Promise<ConvertToCustomerResponse> {
    try {
      const response = await outreachApiClient.post<ConvertToCustomerResponse>(
        `/businesses/${businessId}/convert-to-customer`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export const businessesService = new BusinessesService();

