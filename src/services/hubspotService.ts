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

  async getDeals(limit: number = 50): Promise<HubSpotDeal[]> {
    return this.getDealsForPortal(limit);
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
        },
        associations: {
          companies: [{ id: 'company_456' }],
          contacts: [{ id: 'contact_789' }]
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
        },
        associations: {
          companies: [{ id: 'company_789' }],
          contacts: [{ id: 'contact_890' }]
        }
      },
      {
        id: 'deal_789',
        properties: {
          dealname: 'Marketing Automation Setup',
          amount: '8500',
          closedate: '2024-02-28',
          dealstage: 'closedwon',
          pipeline: 'default',
          hubspot_owner_id: '12345',
          hs_object_id: 'deal_789',
          createdate: '2024-02-01T11:00:00Z',
          hs_lastmodifieddate: '2024-02-28T14:20:00Z'
        },
        associations: {
          companies: [{ id: 'company_101' }],
          contacts: [{ id: 'contact_102' }]
        }
      }
    ];

    return deals;
  }

  async updateCompanyPeppolId(companyId: string, peppolId: string): Promise<boolean> {
    try {
      // Mock updating HubSpot company property
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log(`Updating company ${companyId} with Peppol ID: ${peppolId}`);
      
      // In production, this would call HubSpot API to update the company property
      // await this.apiCall(`/companies/${companyId}`, {
      //   properties: {
      //     peppol_participant_id: peppolId
      //   }
      // });
      
      return true;
    } catch (error) {
      console.error('Fout bij opslaan Peppol ID in HubSpot:', error);
      return false;
    }
  }

  async createTimelineEvent(dealId: string, eventData: any): Promise<boolean> {
    try {
      // Mock creating timeline event in HubSpot
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log(`Creating timeline event for deal ${dealId}:`, eventData);
      
      // In production, this would call HubSpot Timeline API
      // await this.apiCall('/timeline/events', {
      //   objectId: dealId,
      //   objectType: 'deal',
      //   eventType: 'peppol_invoice_sent',
      //   ...eventData
      // });
      
      return true;
    } catch (error) {
      console.error('Fout bij aanmaken timeline event:', error);
      return false;
    }
  }

  getContext(): HubSpotAppContext | null {
    return this.context;
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }
}

export const hubspotService = new HubSpotService();