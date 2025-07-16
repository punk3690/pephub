import { HubSpotDeal, HubSpotCompany, HubSpotContact, HubSpotAppContext } from '@/types/hubspot';

// Mock HubSpot service for development - replace with actual HubSpot API calls
export class HubSpotService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private context: HubSpotAppContext | null = null;
  private readonly clientId = 'YOUR_HUBSPOT_CLIENT_ID'; // Replace with actual Client ID
  private readonly clientSecret = 'YOUR_HUBSPOT_CLIENT_SECRET'; // Replace with actual Client Secret  
  private readonly redirectUri = window.location.origin + '/oauth/callback';
  private readonly scope = 'crm.objects.companies.read crm.objects.deals.read crm.objects.contacts.read timeline';

  constructor() {
    this.loadStoredTokens();
    this.initializeContext();
  }

  private loadStoredTokens() {
    this.accessToken = localStorage.getItem('hubspot_access_token');
    this.refreshToken = localStorage.getItem('hubspot_refresh_token');
  }

  private storeTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('hubspot_access_token', accessToken);
    localStorage.setItem('hubspot_refresh_token', refreshToken);
  }

  private clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('hubspot_access_token');
    localStorage.removeItem('hubspot_refresh_token');
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

  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scope,
      response_type: 'code',
      state: 'pephub_oauth_state_' + Date.now()
    });
    
    return `https://app.hubspot.com/oauth/authorize?${params.toString()}`;
  }

  async authenticate(authCode?: string): Promise<boolean> {
    if (!authCode) {
      // Redirect to OAuth authorization
      window.location.href = this.getAuthUrl();
      return false;
    }

    try {
      // Exchange authorization code for access token
      const response = await fetch('https://api.hubapi.com/oauth/v1/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: this.redirectUri,
          code: authCode,
        }),
      });

      if (!response.ok) {
        throw new Error('OAuth token exchange failed');
      }

      const data = await response.json();
      this.storeTokens(data.access_token, data.refresh_token);
      
      // Fetch user context after successful authentication
      await this.fetchUserContext();
      
      return true;
    } catch (error) {
      console.error('OAuth authentication failed:', error);
      return false;
    }
  }

  async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      return false;
    }

    try {
      const response = await fetch('https://api.hubapi.com/oauth/v1/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: this.refreshToken,
        }),
      });

      if (!response.ok) {
        this.clearTokens();
        return false;
      }

      const data = await response.json();
      this.storeTokens(data.access_token, data.refresh_token);
      
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens();
      return false;
    }
  }

  private async fetchUserContext(): Promise<void> {
    try {
      const response = await this.apiCall('/account-info/v3/api-usage/daily/');
      // This would fetch actual user context from HubSpot
      // For now, keep the mock context
    } catch (error) {
      console.error('Failed to fetch user context:', error);
    }
  }

  private async apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `https://api.hubapi.com${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Try to refresh token
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        // Retry the original request
        return this.apiCall(endpoint, options);
      } else {
        throw new Error('Authentication failed');
      }
    }

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    return response.json();
  }

  logout(): void {
    this.clearTokens();
    this.context = null;
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
    // Mock company data with different companies
    const companies: { [key: string]: HubSpotCompany } = {
      'company_456': {
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
      },
      'company_789': {
        id: companyId,
        properties: {
          name: 'Tech Solutions B.V.',
          domain: 'techsolutions.nl',
          address: 'Damrak 70',
          address2: '',
          city: 'Amsterdam',
          state: 'Noord-Holland',
          zip: '1012 LP',
          country: 'Netherlands',
          phone: '+31 20 555 0123',
          website: 'https://techsolutions.nl',
          industry: 'Technology',
          numberofemployees: '50-100',
          annualrevenue: '5000000',
          peppol_participant_id: '0088:7318900000001',
          vat_number: 'NL987654321B01',
          company_registration_number: '87654321'
        }
      },
      'company_101': {
        id: companyId,
        properties: {
          name: 'Digital Marketing Plus',
          domain: 'digitalmarketing.com',
          address: 'Kalverstraat 92',
          address2: '',
          city: 'Amsterdam',
          state: 'Noord-Holland',
          zip: '1012 PH',
          country: 'Netherlands',
          phone: '+31 20 555 0234',
          website: 'https://digitalmarketing.com',
          industry: 'Marketing',
          numberofemployees: '25-50',
          annualrevenue: '2000000',
          peppol_participant_id: '0088:7318900000002',
          vat_number: 'NL456789123B01',
          company_registration_number: '45678912'
        }
      },
      'company_2001': {
        id: companyId,
        properties: {
          name: 'WebDev Studio',
          domain: 'webdev.nl',
          address: 'Prinsengracht 263',
          address2: '',
          city: 'Amsterdam',
          state: 'Noord-Holland',
          zip: '1016 GV',
          country: 'Netherlands',
          phone: '+31 20 555 0345',
          website: 'https://webdev.nl',
          industry: 'Web Development',
          numberofemployees: '10-25',
          annualrevenue: '1500000',
          peppol_participant_id: '0088:7318900000003',
          vat_number: 'NL789123456B01',
          company_registration_number: '78912345'
        }
      },
      'company_2002': {
        id: companyId,
        properties: {
          name: 'SEO Masters',
          domain: 'seomasters.nl',
          address: 'Nieuwezijds Voorburgwal 147',
          address2: '',
          city: 'Amsterdam',
          state: 'Noord-Holland',
          zip: '1012 RJ',
          country: 'Netherlands',
          phone: '+31 20 555 0456',
          website: 'https://seomasters.nl',
          industry: 'Digital Marketing',
          numberofemployees: '5-10',
          annualrevenue: '800000',
          peppol_participant_id: '0088:7318900000004',
          vat_number: 'NL321654987B01',
          company_registration_number: '32165498'
        }
      },
      'company_2003': {
        id: companyId,
        properties: {
          name: 'E-commerce Solutions',
          domain: 'ecommerce.nl',
          address: 'Spui 21',
          address2: '',
          city: 'Amsterdam',
          state: 'Noord-Holland',
          zip: '1012 WX',
          country: 'Netherlands',
          phone: '+31 20 555 0567',
          website: 'https://ecommerce.nl',
          industry: 'E-commerce',
          numberofemployees: '25-50',
          annualrevenue: '3000000',
          peppol_participant_id: '0088:7318900000005',
          vat_number: 'NL654987321B01',
          company_registration_number: '65498732'
        }
      },
      'company_2004': {
        id: companyId,
        properties: {
          name: 'Mobile App Factory',
          domain: 'mobileapps.nl',
          address: 'Rokin 75',
          address2: '',
          city: 'Amsterdam',
          state: 'Noord-Holland',
          zip: '1012 KL',
          country: 'Netherlands',
          phone: '+31 20 555 0678',
          website: 'https://mobileapps.nl',
          industry: 'Mobile Development',
          numberofemployees: '15-25',
          annualrevenue: '2200000',
          peppol_participant_id: '0088:7318900000006',
          vat_number: 'NL987321654B01',
          company_registration_number: '98732165'
        }
      },
      'company_2005': {
        id: companyId,
        properties: {
          name: 'Database Experts B.V.',
          domain: 'dbexperts.nl',
          address: 'Leidsestraat 106',
          address2: '',
          city: 'Amsterdam',
          state: 'Noord-Holland',
          zip: '1017 PG',
          country: 'Netherlands',
          phone: '+31 20 555 0789',
          website: 'https://dbexperts.nl',
          industry: 'Database Services',
          numberofemployees: '10-15',
          annualrevenue: '1800000',
          peppol_participant_id: '0088:7318900000007',
          vat_number: 'NL147258369B01',
          company_registration_number: '14725836'
        }
      },
      'company_2006': {
        id: companyId,
        properties: {
          name: 'IT Consultancy Pro',
          domain: 'itconsultancy.nl',
          address: 'Herengracht 481',
          address2: '',
          city: 'Amsterdam',
          state: 'Noord-Holland',
          zip: '1017 BT',
          country: 'Netherlands',
          phone: '+31 20 555 0890',
          website: 'https://itconsultancy.nl',
          industry: 'IT Consulting',
          numberofemployees: '20-30',
          annualrevenue: '2500000',
          peppol_participant_id: '0088:7318900000008',
          vat_number: 'NL369258147B01',
          company_registration_number: '36925814'
        }
      },
      'company_2007': {
        id: companyId,
        properties: {
          name: 'Cloud Solutions B.V.',
          domain: 'cloudsolutions.nl',
          address: 'Keizersgracht 324',
          address2: '',
          city: 'Amsterdam',
          state: 'Noord-Holland',
          zip: '1016 EZ',
          country: 'Netherlands',
          phone: '+31 20 555 0901',
          website: 'https://cloudsolutions.nl',
          industry: 'Cloud Services',
          numberofemployees: '30-50',
          annualrevenue: '4000000',
          peppol_participant_id: '0088:7318900000009',
          vat_number: 'NL258147369B01',
          company_registration_number: '25814736'
        }
      },
      'company_2008': {
        id: companyId,
        properties: {
          name: 'Security First',
          domain: 'securityfirst.nl',
          address: 'Vijzelstraat 68',
          address2: '',
          city: 'Amsterdam',
          state: 'Noord-Holland',
          zip: '1017 HL',
          country: 'Netherlands',
          phone: '+31 20 555 0012',
          website: 'https://securityfirst.nl',
          industry: 'Cybersecurity',
          numberofemployees: '15-20',
          annualrevenue: '1900000',
          peppol_participant_id: '0088:7318900000010',
          vat_number: 'NL741852963B01',
          company_registration_number: '74185296'
        }
      },
      'company_2009': {
        id: companyId,
        properties: {
          name: 'API Integration Co',
          domain: 'apiintegration.nl',
          address: 'Reguliersgracht 36',
          address2: '',
          city: 'Amsterdam',
          state: 'Noord-Holland',
          zip: '1017 LR',
          country: 'Netherlands',
          phone: '+31 20 555 0123',
          website: 'https://apiintegration.nl',
          industry: 'Software Integration',
          numberofemployees: '8-15',
          annualrevenue: '1200000',
          peppol_participant_id: '0088:7318900000011',
          vat_number: 'NL963852741B01',
          company_registration_number: '96385274'
        }
      },
      'company_2010': {
        id: companyId,
        properties: {
          name: 'Digital Campaign Agency',
          domain: 'digitalcampaign.nl',
          address: 'Utrechtsestraat 40',
          address2: '',
          city: 'Amsterdam',
          state: 'Noord-Holland',
          zip: '1017 VN',
          country: 'Netherlands',
          phone: '+31 20 555 0234',
          website: 'https://digitalcampaign.nl',
          industry: 'Digital Advertising',
          numberofemployees: '12-20',
          annualrevenue: '1600000',
          peppol_participant_id: '0088:7318900000012',
          vat_number: 'NL852741963B01',
          company_registration_number: '85274196'
        }
      },
      'company_2011': {
        id: companyId,
        properties: {
          name: 'Enterprise Systems B.V.',
          domain: 'enterprise.nl',
          address: 'Museumplein 19',
          address2: '',
          city: 'Amsterdam',
          state: 'Noord-Holland',
          zip: '1071 DJ',
          country: 'Netherlands',
          phone: '+31 20 555 0345',
          website: 'https://enterprise.nl',
          industry: 'Enterprise Software',
          numberofemployees: '100-200',
          annualrevenue: '15000000',
          peppol_participant_id: '0088:7318900000013',
          vat_number: 'NL159753468B01',
          company_registration_number: '15975346'
        }
      },
      'company_2012': {
        id: companyId,
        properties: {
          name: 'DevOps Specialists',
          domain: 'devops.nl',
          address: 'Vondelpark 1',
          address2: '',
          city: 'Amsterdam',
          state: 'Noord-Holland',
          zip: '1071 AA',
          country: 'Netherlands',
          phone: '+31 20 555 0456',
          website: 'https://devops.nl',
          industry: 'DevOps',
          numberofemployees: '25-35',
          annualrevenue: '2800000',
          peppol_participant_id: '0088:7318900000014',
          vat_number: 'NL468159753B01',
          company_registration_number: '46815975'
        }
      },
      'company_2013': {
        id: companyId,
        properties: {
          name: 'UX Design Studio',
          domain: 'uxdesign.nl',
          address: 'Concertgebouwplein 10',
          address2: '',
          city: 'Amsterdam',
          state: 'Noord-Holland',
          zip: '1071 LN',
          country: 'Netherlands',
          phone: '+31 20 555 0567',
          website: 'https://uxdesign.nl',
          industry: 'Design',
          numberofemployees: '15-25',
          annualrevenue: '2000000',
          peppol_participant_id: '0088:7318900000015',
          vat_number: 'NL753468159B01',
          company_registration_number: '75346815'
        }
      },
      'company_2014': {
        id: companyId,
        properties: {
          name: 'Data Analytics Pro',
          domain: 'dataanalytics.nl',
          address: 'Leidseplein 29',
          address2: '',
          city: 'Amsterdam',
          state: 'Noord-Holland',
          zip: '1017 PS',
          country: 'Netherlands',
          phone: '+31 20 555 0678',
          website: 'https://dataanalytics.nl',
          industry: 'Data Analytics',
          numberofemployees: '40-60',
          annualrevenue: '5500000',
          peppol_participant_id: '0088:7318900000016',
          vat_number: 'NL357159468B01',
          company_registration_number: '35715946'
        }
      },
      'company_2015': {
        id: companyId,
        properties: {
          name: 'Backup Solutions',
          domain: 'backupsolutions.nl',
          address: 'Rembrandtplein 5',
          address2: '',
          city: 'Amsterdam',
          state: 'Noord-Holland',
          zip: '1017 CT',
          country: 'Netherlands',
          phone: '+31 20 555 0789',
          website: 'https://backupsolutions.nl',
          industry: 'Data Backup',
          numberofemployees: '10-20',
          annualrevenue: '1400000',
          peppol_participant_id: '0088:7318900000017',
          vat_number: 'NL951357468B01',
          company_registration_number: '95135746'
        }
      },
      'company_2016': {
        id: companyId,
        properties: {
          name: 'E-commerce Integration',
          domain: 'eintegration.nl',
          address: 'Nieuwmarkt 22',
          address2: '',
          city: 'Amsterdam',
          state: 'Noord-Holland',
          zip: '1011 HP',
          country: 'Netherlands',
          phone: '+31 20 555 0890',
          website: 'https://eintegration.nl',
          industry: 'E-commerce',
          numberofemployees: '20-30',
          annualrevenue: '2600000',
          peppol_participant_id: '0088:7318900000018',
          vat_number: 'NL468951357B01',
          company_registration_number: '46895135'
        }
      },
      'company_2017': {
        id: companyId,
        properties: {
          name: 'CRM Solutions Plus',
          domain: 'crmsolutions.nl',
          address: 'Waterlooplein 6',
          address2: '',
          city: 'Amsterdam',
          state: 'Noord-Holland',
          zip: '1011 PG',
          country: 'Netherlands',
          phone: '+31 20 555 0901',
          website: 'https://crmsolutions.nl',
          industry: 'CRM Software',
          numberofemployees: '15-25',
          annualrevenue: '2100000',
          peppol_participant_id: '0088:7318900000019',
          vat_number: 'NL357468951B01',
          company_registration_number: '35746895'
        }
      },
      'company_2018': {
        id: companyId,
        properties: {
          name: 'Performance Optimization',
          domain: 'performance.nl',
          address: 'Jodenbreestraat 4',
          address2: '',
          city: 'Amsterdam',
          state: 'Noord-Holland',
          zip: '1011 NK',
          country: 'Netherlands',
          phone: '+31 20 555 0012',
          website: 'https://performance.nl',
          industry: 'Performance Optimization',
          numberofemployees: '12-18',
          annualrevenue: '1750000',
          peppol_participant_id: '0088:7318900000020',
          vat_number: 'NL951468357B01',
          company_registration_number: '95146835'
        }
      }
    };

    return companies[companyId] || companies['company_456'];
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
      },
      {
        id: 'deal_1001',
        properties: {
          dealname: 'Website ontwikkeling',
          amount: '15000',
          closedate: '2024-03-01',
          dealstage: 'closedwon',
          pipeline: 'default',
          hubspot_owner_id: '12345',
          hs_object_id: 'deal_1001',
          createdate: '2024-02-15T10:00:00Z',
          hs_lastmodifieddate: '2024-03-01T10:00:00Z'
        },
        associations: {
          companies: [{ id: 'company_2001' }],
          contacts: [{ id: 'contact_3001' }]
        }
      },
      {
        id: 'deal_1002',
        properties: {
          dealname: 'SEO optimalisatie',
          amount: '5000',
          closedate: '2024-03-05',
          dealstage: 'closedwon',
          pipeline: 'default',
          hubspot_owner_id: '12345',
          hs_object_id: 'deal_1002',
          createdate: '2024-02-20T10:00:00Z',
          hs_lastmodifieddate: '2024-03-05T10:00:00Z'
        },
        associations: {
          companies: [{ id: 'company_2002' }],
          contacts: [{ id: 'contact_3002' }]
        }
      },
      {
        id: 'deal_1003',
        properties: {
          dealname: 'E-commerce platform',
          amount: '25000',
          closedate: '2024-03-10',
          dealstage: 'closedwon',
          pipeline: 'default',
          hubspot_owner_id: '12345',
          hs_object_id: 'deal_1003',
          createdate: '2024-02-25T10:00:00Z',
          hs_lastmodifieddate: '2024-03-10T10:00:00Z'
        },
        associations: {
          companies: [{ id: 'company_2003' }],
          contacts: [{ id: 'contact_3003' }]
        }
      },
      {
        id: 'deal_1004',
        properties: {
          dealname: 'Mobile app ontwikkeling',
          amount: '30000',
          closedate: '2024-03-15',
          dealstage: 'closedwon',
          pipeline: 'default',
          hubspot_owner_id: '12345',
          hs_object_id: 'deal_1004',
          createdate: '2024-03-01T10:00:00Z',
          hs_lastmodifieddate: '2024-03-15T10:00:00Z'
        },
        associations: {
          companies: [{ id: 'company_2004' }],
          contacts: [{ id: 'contact_3004' }]
        }
      },
      {
        id: 'deal_1005',
        properties: {
          dealname: 'Database migratie',
          amount: '8000',
          closedate: '2024-03-20',
          dealstage: 'closedwon',
          pipeline: 'default',
          hubspot_owner_id: '12345',
          hs_object_id: 'deal_1005',
          createdate: '2024-03-05T10:00:00Z',
          hs_lastmodifieddate: '2024-03-20T10:00:00Z'
        },
        associations: {
          companies: [{ id: 'company_2005' }],
          contacts: [{ id: 'contact_3005' }]
        }
      },
      {
        id: 'deal_1006',
        properties: {
          dealname: 'IT consultancy',
          amount: '12000',
          closedate: '2024-03-25',
          dealstage: 'closedwon',
          pipeline: 'default',
          hubspot_owner_id: '12345',
          hs_object_id: 'deal_1006',
          createdate: '2024-03-10T10:00:00Z',
          hs_lastmodifieddate: '2024-03-25T10:00:00Z'
        },
        associations: {
          companies: [{ id: 'company_2006' }],
          contacts: [{ id: 'contact_3006' }]
        }
      },
      {
        id: 'deal_1007',
        properties: {
          dealname: 'Cloud migratie',
          amount: '18000',
          closedate: '2024-03-30',
          dealstage: 'closedwon',
          pipeline: 'default',
          hubspot_owner_id: '12345',
          hs_object_id: 'deal_1007',
          createdate: '2024-03-15T10:00:00Z',
          hs_lastmodifieddate: '2024-03-30T10:00:00Z'
        },
        associations: {
          companies: [{ id: 'company_2007' }],
          contacts: [{ id: 'contact_3007' }]
        }
      },
      {
        id: 'deal_1008',
        properties: {
          dealname: 'Security audit',
          amount: '7500',
          closedate: '2024-04-01',
          dealstage: 'closedwon',
          pipeline: 'default',
          hubspot_owner_id: '12345',
          hs_object_id: 'deal_1008',
          createdate: '2024-03-20T10:00:00Z',
          hs_lastmodifieddate: '2024-04-01T10:00:00Z'
        },
        associations: {
          companies: [{ id: 'company_2008' }],
          contacts: [{ id: 'contact_3008' }]
        }
      },
      {
        id: 'deal_1009',
        properties: {
          dealname: 'API integratie',
          amount: '9500',
          closedate: '2024-04-05',
          dealstage: 'closedwon',
          pipeline: 'default',
          hubspot_owner_id: '12345',
          hs_object_id: 'deal_1009',
          createdate: '2024-03-25T10:00:00Z',
          hs_lastmodifieddate: '2024-04-05T10:00:00Z'
        },
        associations: {
          companies: [{ id: 'company_2009' }],
          contacts: [{ id: 'contact_3009' }]
        }
      },
      {
        id: 'deal_1010',
        properties: {
          dealname: 'Digital marketing campaign',
          amount: '6000',
          closedate: '2024-04-10',
          dealstage: 'closedwon',
          pipeline: 'default',
          hubspot_owner_id: '12345',
          hs_object_id: 'deal_1010',
          createdate: '2024-03-30T10:00:00Z',
          hs_lastmodifieddate: '2024-04-10T10:00:00Z'
        },
        associations: {
          companies: [{ id: 'company_2010' }],
          contacts: [{ id: 'contact_3010' }]
        }
      },
      {
        id: 'deal_1011',
        properties: {
          dealname: 'ERP implementatie',
          amount: '45000',
          closedate: '2024-04-15',
          dealstage: 'closedwon',
          pipeline: 'default',
          hubspot_owner_id: '12345',
          hs_object_id: 'deal_1011',
          createdate: '2024-04-01T10:00:00Z',
          hs_lastmodifieddate: '2024-04-15T10:00:00Z'
        },
        associations: {
          companies: [{ id: 'company_2011' }],
          contacts: [{ id: 'contact_3011' }]
        }
      },
      {
        id: 'deal_1012',
        properties: {
          dealname: 'DevOps setup',
          amount: '11000',
          closedate: '2024-04-20',
          dealstage: 'closedwon',
          pipeline: 'default',
          hubspot_owner_id: '12345',
          hs_object_id: 'deal_1012',
          createdate: '2024-04-05T10:00:00Z',
          hs_lastmodifieddate: '2024-04-20T10:00:00Z'
        },
        associations: {
          companies: [{ id: 'company_2012' }],
          contacts: [{ id: 'contact_3012' }]
        }
      },
      {
        id: 'deal_1013',
        properties: {
          dealname: 'UX/UI redesign',
          amount: '13500',
          closedate: '2024-04-25',
          dealstage: 'closedwon',
          pipeline: 'default',
          hubspot_owner_id: '12345',
          hs_object_id: 'deal_1013',
          createdate: '2024-04-10T10:00:00Z',
          hs_lastmodifieddate: '2024-04-25T10:00:00Z'
        },
        associations: {
          companies: [{ id: 'company_2013' }],
          contacts: [{ id: 'contact_3013' }]
        }
      },
      {
        id: 'deal_1014',
        properties: {
          dealname: 'Data analytics platform',
          amount: '22000',
          closedate: '2024-04-30',
          dealstage: 'closedwon',
          pipeline: 'default',
          hubspot_owner_id: '12345',
          hs_object_id: 'deal_1014',
          createdate: '2024-04-15T10:00:00Z',
          hs_lastmodifieddate: '2024-04-30T10:00:00Z'
        },
        associations: {
          companies: [{ id: 'company_2014' }],
          contacts: [{ id: 'contact_3014' }]
        }
      },
      {
        id: 'deal_1015',
        properties: {
          dealname: 'Backup & recovery solution',
          amount: '8500',
          closedate: '2024-05-01',
          dealstage: 'closedwon',
          pipeline: 'default',
          hubspot_owner_id: '12345',
          hs_object_id: 'deal_1015',
          createdate: '2024-04-20T10:00:00Z',
          hs_lastmodifieddate: '2024-05-01T10:00:00Z'
        },
        associations: {
          companies: [{ id: 'company_2015' }],
          contacts: [{ id: 'contact_3015' }]
        }
      },
      {
        id: 'deal_1016',
        properties: {
          dealname: 'Webshop integratie',
          amount: '16500',
          closedate: '2024-05-05',
          dealstage: 'closedwon',
          pipeline: 'default',
          hubspot_owner_id: '12345',
          hs_object_id: 'deal_1016',
          createdate: '2024-04-25T10:00:00Z',
          hs_lastmodifieddate: '2024-05-05T10:00:00Z'
        },
        associations: {
          companies: [{ id: 'company_2016' }],
          contacts: [{ id: 'contact_3016' }]
        }
      },
      {
        id: 'deal_1017',
        properties: {
          dealname: 'CRM customization',
          amount: '9200',
          closedate: '2024-05-10',
          dealstage: 'closedwon',
          pipeline: 'default',
          hubspot_owner_id: '12345',
          hs_object_id: 'deal_1017',
          createdate: '2024-04-30T10:00:00Z',
          hs_lastmodifieddate: '2024-05-10T10:00:00Z'
        },
        associations: {
          companies: [{ id: 'company_2017' }],
          contacts: [{ id: 'contact_3017' }]
        }
      },
      {
        id: 'deal_1018',
        properties: {
          dealname: 'Performance optimization',
          amount: '7800',
          closedate: '2024-05-15',
          dealstage: 'closedwon',
          pipeline: 'default',
          hubspot_owner_id: '12345',
          hs_object_id: 'deal_1018',
          createdate: '2024-05-01T10:00:00Z',
          hs_lastmodifieddate: '2024-05-15T10:00:00Z'
        },
        associations: {
          companies: [{ id: 'company_2018' }],
          contacts: [{ id: 'contact_3018' }]
        }
      }
    ];

    return deals.slice(0, limit);
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

  async updateDealCustomProperties(dealId: string, properties: { [key: string]: any }): Promise<boolean> {
    try {
      // Mock updating HubSpot deal custom properties
      await new Promise(resolve => setTimeout(resolve, 400));
      
      console.log(`Updating deal ${dealId} with custom properties:`, properties);
      
      // In production, this would call HubSpot API to update deal properties
      // await this.apiCall(`/deals/${dealId}`, {
      //   properties: {
      //     peppol_invoice_last_status: properties.lastStatus,
      //     peppol_invoice_last_sent_date: properties.lastSentDate,
      //     peppol_invoice_count: properties.invoiceCount,
      //     peppol_invoice_total_amount: properties.totalAmount,
      //     peppol_invoice_last_error: properties.lastError || null,
      //     ...properties
      //   }
      // });
      
      return true;
    } catch (error) {
      console.error('Fout bij updaten custom properties:', error);
      return false;
    }
  }

  async createAuditLogEntry(dealId: string, action: string, details: any): Promise<boolean> {
    try {
      // Mock creating audit log entry
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const auditEntry = {
        dealId,
        action,
        details,
        timestamp: new Date().toISOString(),
        userId: this.context?.userId,
        userEmail: this.context?.userEmail,
        portalId: this.context?.portalId
      };
      
      console.log('Audit log entry created:', auditEntry);
      
      // In production, this would be stored in HubSpot custom objects or external audit system
      // await this.apiCall('/audit-logs', auditEntry);
      
      return true;
    } catch (error) {
      console.error('Fout bij aanmaken audit log:', error);
      return false;
    }
  }

  async retryFailedInvoice(dealId: string, invoiceId: string): Promise<boolean> {
    try {
      // Mock retry functionality
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`Retrying failed invoice ${invoiceId} for deal ${dealId}`);
      
      // Create timeline event for retry attempt
      await this.createTimelineEvent(dealId, {
        eventType: 'peppol_invoice_retry',
        title: 'Peppol-factuur opnieuw verzenden',
        description: `Poging tot opnieuw verzenden van factuur ${invoiceId}`,
        invoiceId,
        retryAttempt: true
      });
      
      return true;
    } catch (error) {
      console.error('Fout bij opnieuw verzenden factuur:', error);
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