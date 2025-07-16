import { PeppolInvoiceData, PeppolSendStatus } from '@/types/hubspot';
import { recommandService } from './recommandService';

// Mock Recommand API service for development
export class PeppolService {
  private readonly baseUrl = '/api/peppol'; // Backend endpoint
  
  async sendInvoice(invoiceData: PeppolInvoiceData): Promise<PeppolSendStatus> {
    return await recommandService.sendInvoice(invoiceData);
  }

  async getInvoiceStatus(peppolId: string): Promise<PeppolSendStatus | null> {
    return await recommandService.getInvoiceStatus(peppolId);
  }

  async getSentInvoices(dealId?: string): Promise<PeppolSendStatus[]> {
    return await recommandService.getSentInvoices(dealId);
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