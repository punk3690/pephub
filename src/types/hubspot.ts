export interface HubSpotDeal {
  id: string;
  properties: {
    dealname: string;
    amount: string;
    closedate: string;
    dealstage: string;
    pipeline: string;
    hubspot_owner_id: string;
    hs_object_id: string;
    createdate: string;
    hs_lastmodifieddate: string;
  };
  associations?: {
    companies?: Array<{ id: string }>;
    contacts?: Array<{ id: string }>;
  };
}

export interface HubSpotCompany {
  id: string;
  properties: {
    name: string;
    domain?: string;
    address?: string;
    address2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    phone?: string;
    website?: string;
    industry?: string;
    numberofemployees?: string;
    annualrevenue?: string;
    // Peppol specific fields
    peppol_participant_id?: string;
    vat_number?: string;
    company_registration_number?: string;
  };
}

export interface HubSpotContact {
  id: string;
  properties: {
    firstname: string;
    lastname: string;
    email: string;
    phone?: string;
    jobtitle?: string;
    company?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
}

export interface PeppolInvoiceData {
  dealId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  totalAmount: number;
  taxAmount: number;
  subtotalAmount: number;
  
  // Supplier (sender) info
  supplier: {
    name: string;
    vatNumber: string;
    registrationNumber: string;
    address: {
      street: string;
      city: string;
      postalCode: string;
      country: string;
    };
    peppolId: string;
  };
  
  // Customer (buyer) info
  customer: {
    name: string;
    vatNumber?: string;
    registrationNumber?: string;
    address: {
      street: string;
      city: string;
      postalCode: string;
      country: string;
    };
    peppolId?: string;
  };
  
  // Invoice lines
  lines: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    taxRate: number;
    taxAmount: number;
  }>;
}

export interface PeppolSendStatus {
  id: string;
  dealId: string;
  invoiceNumber: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'rejected';
  sentAt: string;
  deliveredAt?: string;
  errorMessage?: string;
  peppolMessageId?: string;
  recipientId?: string;
}

export interface HubSpotAppContext {
  portalId: number;
  userId: number;
  userEmail: string;
  dealId?: string;
  objectId?: string;
  objectType?: string;
}