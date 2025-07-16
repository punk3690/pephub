import { PeppolLookupResult, PeppolDirectorySearchParams } from './peppolLookupService';
import { PeppolInvoiceData, PeppolSendStatus } from '@/types/hubspot';

export class RecommandService {
  private readonly baseUrl = 'https://api.recommand.com/v1';
  private readonly teamId = 'team_01K098HBVJ9HA4GKWBDXR0CHV2';
  private readonly apiKey = 'key_01K098M5SZEF5C7HMSGTG8RKJG';
  private readonly clientSecret = 'secret_ced0963ce9574edb977cc6a28b203ca6';

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'X-Team-ID': this.teamId
    };
  }

  /**
   * Lookup Peppol ID via Recommand API
   */
  async lookupPeppolId(searchParams: PeppolDirectorySearchParams): Promise<PeppolLookupResult> {
    try {
      const response = await fetch(`${this.baseUrl}/peppol/lookup`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          companyName: searchParams.companyName,
          vatNumber: searchParams.vatNumber,
          registrationNumber: searchParams.registrationNumber,
          country: searchParams.country,
          address: searchParams.address,
          city: searchParams.city
        })
      });

      if (!response.ok) {
        throw new Error(`Recommand API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.peppolId) {
        return {
          peppolId: data.peppolId,
          found: true,
          source: 'recommand_api',
          confidence: data.confidence || 'high',
          metadata: {
            vatNumber: data.vatNumber || searchParams.vatNumber,
            registrationNumber: data.registrationNumber || searchParams.registrationNumber,
            companyName: data.companyName || searchParams.companyName,
            country: data.country || searchParams.country
          }
        };
      }

      return { found: false, source: 'recommand_api', confidence: 'low' };
      
    } catch (error) {
      console.error('Recommand API lookup error:', error);
      return { found: false, source: 'recommand_api', confidence: 'low' };
    }
  }

  /**
   * Send Peppol invoice via Recommand API
   */
  async sendInvoice(invoiceData: PeppolInvoiceData): Promise<PeppolSendStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/peppol/send`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          dealId: invoiceData.dealId,
          invoiceNumber: invoiceData.invoiceNumber,
          issueDate: invoiceData.issueDate,
          dueDate: invoiceData.dueDate,
          currency: invoiceData.currency,
          
          supplier: {
            name: invoiceData.supplier.name,
            peppolId: invoiceData.supplier.peppolId,
            vatNumber: invoiceData.supplier.vatNumber,
            address: invoiceData.supplier.address.street,
            city: invoiceData.supplier.address.city,
            postalCode: invoiceData.supplier.address.postalCode,
            country: invoiceData.supplier.address.country
          },
          
          customer: {
            name: invoiceData.customer.name,
            peppolId: invoiceData.customer.peppolId,
            vatNumber: invoiceData.customer.vatNumber,
            address: invoiceData.customer.address.street,
            city: invoiceData.customer.address.city,
            postalCode: invoiceData.customer.address.postalCode,
            country: invoiceData.customer.address.country
          },
          
          lines: invoiceData.lines.map(line => ({
            description: line.description,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            totalPrice: line.totalPrice,
            taxRate: line.taxRate || 0.21
          })),
          
          subtotalAmount: invoiceData.subtotalAmount,
          taxAmount: invoiceData.taxAmount,
          totalAmount: invoiceData.totalAmount,
          
          metadata: {
            teamId: this.teamId,
            source: 'pephub_hubspot'
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Recommand API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        id: data.id || 'peppol_' + Date.now(),
        dealId: invoiceData.dealId,
        invoiceNumber: invoiceData.invoiceNumber,
        status: data.status || 'sent',
        sentAt: data.sentAt || new Date().toISOString(),
        peppolMessageId: data.peppolMessageId,
        recipientId: invoiceData.customer.peppolId || 'Unknown',
        deliveredAt: data.deliveredAt,
        errorMessage: data.errorMessage
      };
      
    } catch (error) {
      console.error('Recommand API send error:', error);
      
      return {
        id: 'peppol_' + Date.now(),
        dealId: invoiceData.dealId,
        invoiceNumber: invoiceData.invoiceNumber,
        status: 'failed',
        sentAt: new Date().toISOString(),
        peppolMessageId: '',
        recipientId: invoiceData.customer.peppolId || 'Unknown',
        errorMessage: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get invoice status from Recommand API
   */
  async getInvoiceStatus(peppolId: string): Promise<PeppolSendStatus | null> {
    try {
      const response = await fetch(`${this.baseUrl}/peppol/status/${peppolId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Recommand API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        id: data.id,
        dealId: data.dealId,
        invoiceNumber: data.invoiceNumber,
        status: data.status,
        sentAt: data.sentAt,
        deliveredAt: data.deliveredAt,
        peppolMessageId: data.peppolMessageId,
        recipientId: data.recipientId,
        errorMessage: data.errorMessage
      };
      
    } catch (error) {
      console.error('Recommand API status error:', error);
      return null;
    }
  }

  /**
   * Validate Peppol ID exists in network via Recommand API
   */
  async validatePeppolIdInNetwork(peppolId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/peppol/validate/${peppolId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.valid === true;
      
    } catch (error) {
      console.error('Recommand API validation error:', error);
      return false;
    }
  }

  /**
   * Get sent invoices from Recommand API
   */
  async getSentInvoices(dealId?: string): Promise<PeppolSendStatus[]> {
    try {
      const url = dealId 
        ? `${this.baseUrl}/peppol/invoices?dealId=${dealId}`
        : `${this.baseUrl}/peppol/invoices`;
        
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Recommand API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.invoices || [];
      
    } catch (error) {
      console.error('Recommand API invoices error:', error);
      return [];
    }
  }
}

export const recommandService = new RecommandService();