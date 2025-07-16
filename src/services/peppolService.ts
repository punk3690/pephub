import { PeppolInvoiceData, PeppolSendStatus } from '@/types/hubspot';

// Mock Recommand API service for development
export class PeppolService {
  private readonly baseUrl = '/api/peppol'; // Backend endpoint
  
  async sendInvoice(invoiceData: PeppolInvoiceData): Promise<PeppolSendStatus> {
    // Mock API call - in production this would call your backend
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const sendStatus: PeppolSendStatus = {
      id: 'peppol_' + Date.now(),
      dealId: invoiceData.dealId,
      invoiceNumber: invoiceData.invoiceNumber,
      status: 'sent',
      sentAt: new Date().toISOString(),
      peppolMessageId: 'MSG_' + Math.random().toString(36).substr(2, 9),
      recipientId: invoiceData.customer.peppolId || 'Unknown'
    };

    // Mock random status scenarios for demo
    const random = Math.random();
    if (random < 0.1) {
      sendStatus.status = 'failed';
      sendStatus.errorMessage = 'Recipient Peppol ID not found in network';
    } else if (random < 0.3) {
      sendStatus.status = 'pending';
    } else {
      sendStatus.status = 'delivered';
      sendStatus.deliveredAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    }

    return sendStatus;
  }

  async getInvoiceStatus(peppolId: string): Promise<PeppolSendStatus | null> {
    // Mock status check
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      id: peppolId,
      dealId: 'deal_123',
      invoiceNumber: 'INV-2024-001',
      status: 'delivered',
      sentAt: '2024-01-31T10:00:00Z',
      deliveredAt: '2024-01-31T10:05:23Z',
      peppolMessageId: 'MSG_ABC123',
      recipientId: '0088:7318900000000'
    };
  }

  async getSentInvoices(dealId?: string): Promise<PeppolSendStatus[]> {
    // Mock invoice history
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockInvoices: PeppolSendStatus[] = [
      {
        id: 'peppol_001',
        dealId: 'deal_123',
        invoiceNumber: 'INV-2024-001',
        status: 'delivered',
        sentAt: '2024-01-31T10:00:00Z',
        deliveredAt: '2024-01-31T10:05:23Z',
        peppolMessageId: 'MSG_ABC123',
        recipientId: '0088:7318900000000'
      },
      {
        id: 'peppol_002',
        dealId: 'deal_456',
        invoiceNumber: 'INV-2024-002',
        status: 'sent',
        sentAt: '2024-02-15T14:30:00Z',
        peppolMessageId: 'MSG_DEF456',
        recipientId: '0088:7318900000001'
      },
      {
        id: 'peppol_003',
        dealId: 'deal_789',
        invoiceNumber: 'INV-2024-003',
        status: 'failed',
        sentAt: '2024-02-20T09:15:00Z',
        errorMessage: 'Invalid VAT number format',
        recipientId: '0088:7318900000002'
      }
    ];

    if (dealId) {
      return mockInvoices.filter(invoice => invoice.dealId === dealId);
    }

    return mockInvoices;
  }

  generateUBLPayload(invoiceData: PeppolInvoiceData): string {
    // Mock UBL 2.1 XML generation - in production this would generate proper UBL XML
    return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
    <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
    <cbc:ID>${invoiceData.invoiceNumber}</cbc:ID>
    <cbc:IssueDate>${invoiceData.issueDate}</cbc:IssueDate>
    <cbc:DueDate>${invoiceData.dueDate}</cbc:DueDate>
    <cbc:DocumentCurrencyCode>${invoiceData.currency}</cbc:DocumentCurrencyCode>
    
    <cac:AccountingSupplierParty>
        <cac:Party>
            <cbc:EndpointID schemeID="0088">${invoiceData.supplier.peppolId}</cbc:EndpointID>
            <cac:PartyName>
                <cbc:Name>${invoiceData.supplier.name}</cbc:Name>
            </cac:PartyName>
            <cac:PartyTaxScheme>
                <cbc:CompanyID>${invoiceData.supplier.vatNumber}</cbc:CompanyID>
            </cac:PartyTaxScheme>
        </cac:Party>
    </cac:AccountingSupplierParty>
    
    <cac:AccountingCustomerParty>
        <cac:Party>
            <cbc:EndpointID schemeID="0088">${invoiceData.customer.peppolId || 'Unknown'}</cbc:EndpointID>
            <cac:PartyName>
                <cbc:Name>${invoiceData.customer.name}</cbc:Name>
            </cac:PartyName>
        </cac:Party>
    </cac:AccountingCustomerParty>
    
    <cac:LegalMonetaryTotal>
        <cbc:TaxExclusiveAmount currencyID="${invoiceData.currency}">${invoiceData.subtotalAmount}</cbc:TaxExclusiveAmount>
        <cbc:TaxInclusiveAmount currencyID="${invoiceData.currency}">${invoiceData.totalAmount}</cbc:TaxInclusiveAmount>
        <cbc:PayableAmount currencyID="${invoiceData.currency}">${invoiceData.totalAmount}</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>
    
    ${invoiceData.lines.map((line, index) => `
    <cac:InvoiceLine>
        <cbc:ID>${index + 1}</cbc:ID>
        <cbc:InvoicedQuantity>${line.quantity}</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="${invoiceData.currency}">${line.totalPrice}</cbc:LineExtensionAmount>
        <cac:Item>
            <cbc:Description>${line.description}</cbc:Description>
        </cac:Item>
        <cac:Price>
            <cbc:PriceAmount currencyID="${invoiceData.currency}">${line.unitPrice}</cbc:PriceAmount>
        </cac:Price>
    </cac:InvoiceLine>`).join('')}
</Invoice>`;
  }

  validatePeppolId(peppolId: string): boolean {
    // Basic Peppol ID validation
    const peppolPattern = /^\d{4}:[a-zA-Z0-9]+$/;
    return peppolPattern.test(peppolId);
  }
}

export const peppolService = new PeppolService();