import { HubSpotDeal, HubSpotCompany, HubSpotContact, HubSpotAppContext } from '@/types/hubspot';

// Mock HubSpot service for development - replace with actual HubSpot API calls
export class HubSpotService {
  private accessToken: string | null = null;
  private context: HubSpotAppContext | null = null;

  constructor() {
    // In production, this would get the access token from HubSpot's OAuth flow
    this.initializeContext();
  }

  private initializeContext() {
    // Mock context - in production this would come from HubSpot's iframe context
    this.context = {
      portalId: 12345678,
      userId: 987654,
      userEmail: 'user@company.com',
      dealId: 'deal_123',
      objectType: 'deal'
    };
  }

  async authenticate(authCode?: string): Promise<boolean> {
    // Mock authentication - in production this would exchange auth code for access token
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.accessToken = 'mock_access_token_' + Date.now();
    return true;
  }

  async getCurrentDeal(): Promise<HubSpotDeal | null> {
    if (!this.context?.dealId) return null;

    // Mock deal data
    return {
      id: this.context.dealId,
      properties: {
        dealname: 'Software License Q1 2024',
        amount: '25000',
        closedate: '2024-01-31',
        dealstage: 'closedwon',
        pipeline: 'default',
        hubspot_owner_id: '12345',
        hs_object_id: this.context.dealId,
        createdate: '2024-01-01T10:00:00Z',
        hs_lastmodifieddate: '2024-01-31T15:30:00Z'
      },
      associations: {
        companies: [{ id: 'company_456' }],
        contacts: [{ id: 'contact_789' }]
      }
    };
  }

  async getCompany(companyId: string): Promise<HubSpotCompany | null> {
    // Mock company data
    return {
      id: companyId,
      properties: {
        name: 'Acme Corporation',
        domain: 'acme.com',
        address: 'Hoofdstraat 123',
        address2: '',
        city: 'Amsterdam',
        state: 'Noord-Holland',
        zip: '1000 AA',
        country: 'Netherlands',
        phone: '+31 20 123 4567',
        website: 'https://acme.com',
        industry: 'Software',
        numberofemployees: '100-500',
        annualrevenue: '10000000',
        peppol_participant_id: '0088:7318900000000',
        vat_number: 'NL123456789B01',
        company_registration_number: '12345678'
      }
    };
  }

  async getContact(contactId: string): Promise<HubSpotContact | null> {
    // Mock contact data
    return {
      id: contactId,
      properties: {
        firstname: 'Jan',
        lastname: 'van der Berg',
        email: 'jan@acme.com',
        phone: '+31 20 123 4567',
        jobtitle: 'Financial Controller',
        company: 'Acme Corporation',
        address: 'Hoofdstraat 123',
        city: 'Amsterdam',
        state: 'Noord-Holland',
        zip: '1000 AA',
        country: 'Netherlands'
      }
    };
  }

  async getDealsForPortal(limit: number = 50): Promise<HubSpotDeal[]> {
    // Mock multiple deals
    const deals: HubSpotDeal[] = [
      {
        id: 'deal_123',
        properties: {
          dealname: 'Software License Q1 2024',
          amount: '25000',
          closedate: '2024-01-31',
          dealstage: 'closedwon',
          pipeline: 'default',
          hubspot_owner_id: '12345',
          hs_object_id: 'deal_123',
          createdate: '2024-01-01T10:00:00Z',
          hs_lastmodifieddate: '2024-01-31T15:30:00Z'
        }
      },
      {
        id: 'deal_456',
        properties: {
          dealname: 'Consulting Services Q1',
          amount: '15000',
          closedate: '2024-02-15',
          dealstage: 'closedwon',
          pipeline: 'default',
          hubspot_owner_id: '12345',
          hs_object_id: 'deal_456',
          createdate: '2024-01-15T09:00:00Z',
          hs_lastmodifieddate: '2024-02-15T16:45:00Z'
        }
      }
    ];

    return deals;
  }

  getContext(): HubSpotAppContext | null {
    return this.context;
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }
}

export const hubspotService = new HubSpotService();