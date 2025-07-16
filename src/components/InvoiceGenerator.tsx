import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Send, Loader, FileText, CheckCircle, AlertTriangle, Shield, Search, Info, ExternalLink } from 'lucide-react';
import { InvoiceConfirmation } from './InvoiceConfirmation';
import { ComplianceFooter } from './ComplianceFooter';
import { HubSpotDeal, PeppolInvoiceData } from '@/types/hubspot';
import { peppolService } from '@/services/peppolService';
import { hubspotService } from '@/services/hubspotService';
import { peppolLookupService, PeppolLookupResult } from '@/services/peppolLookupService';
import { validatePeppolId, validateVatNumber } from '@/utils/validation';
import { toast } from 'sonner';

interface InvoiceGeneratorProps {
  deal: HubSpotDeal;
  onInvoiceSent: (status: any) => void;
}

export function InvoiceGenerator({ deal, onInvoiceSent }: InvoiceGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    currency: 'EUR',
    description: deal.properties.dealname,
    amount: deal.properties.amount,
    taxRate: 21,
    customerPeppolId: '',
    customerVatNumber: ''
  });

  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Netherlands',
    validated: false
  });

  const [validationStatus, setValidationStatus] = useState({
    peppolId: false,
    vatNumber: false
  });

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [peppolLookupStatus, setPeppolLookupStatus] = useState<{
    loading: boolean;
    result: PeppolLookupResult | null;
    error: string | null;
  }>({
    loading: false,
    result: null,
    error: null
  });

  const [showPeppolField, setShowPeppolField] = useState(false);

  const calculateTax = () => {
    const amount = parseFloat(invoiceData.amount) || 0;
    return (amount * invoiceData.taxRate) / 100;
  };

  const calculateTotal = () => {
    const amount = parseFloat(invoiceData.amount) || 0;
    const tax = calculateTax();
    return amount + tax;
  };


  const loadCustomerInfo = async () => {
    try {
      if (deal.associations?.companies?.[0]) {
        const company = await hubspotService.getCompany(deal.associations.companies[0].id);
        if (company) {
          setCustomerInfo({
            name: company.properties.name,
            address: company.properties.address || '',
            city: company.properties.city || '',
            postalCode: company.properties.zip || '',
            country: company.properties.country || 'Netherlands',
            validated: true
          });
          
          const hasExistingPeppolId = company.properties.peppol_participant_id;
          
          setInvoiceData(prev => ({
            ...prev,
            customerPeppolId: hasExistingPeppolId || '',
            customerVatNumber: company.properties.vat_number || ''
          }));

          // Auto-lookup Peppol ID if not already available
          if (!hasExistingPeppolId) {
            await performPeppolLookup(company);
          } else {
            setShowPeppolField(true);
          }
        }
      }
    } catch (error) {
      console.error('Fout bij laden klantgegevens:', error);
    }
  };

  const performPeppolLookup = async (company: any) => {
    setPeppolLookupStatus({ loading: true, result: null, error: null });

    try {
      const searchParams = {
        companyName: company.properties.name,
        vatNumber: company.properties.vat_number,
        registrationNumber: company.properties.company_registration_number,
        country: company.properties.country || 'Netherlands',
        address: company.properties.address,
        city: company.properties.city
      };

      const result = await peppolLookupService.lookupPeppolId(searchParams);
      
      setPeppolLookupStatus({ loading: false, result, error: null });

      if (result.found && result.peppolId) {
        setInvoiceData(prev => ({
          ...prev,
          customerPeppolId: result.peppolId!
        }));

        // Save back to HubSpot for future use
        if (deal.associations?.companies?.[0]) {
          await hubspotService.updateCompanyPeppolId(
            deal.associations.companies[0].id,
            result.peppolId
          );
        }

        toast.success(
          `Peppol ID automatisch gevonden via ${result.source === 'peppol_directory' ? 'Peppol directory' : 
            result.source === 'recommand_api' ? 'Recommand API' : 'HubSpot cache'}`
        );
      } else {
        setPeppolLookupStatus({
          loading: false,
          result,
          error: 'Geen Peppol ID gevonden. Voer handmatig in of contacteer de klant.'
        });
        setShowPeppolField(true);
        
        toast.error('Peppol ID niet automatisch gevonden', {
          description: 'Vul het Peppol ID handmatig in of vraag de klant naar hun Peppol identificatie.'
        });
      }
    } catch (error) {
      console.error('Fout bij Peppol lookup:', error);
      setPeppolLookupStatus({
        loading: false,
        result: null,
        error: 'Fout bij automatische lookup. Probeer handmatige invoer.'
      });
      setShowPeppolField(true);
      
      toast.error('Fout bij automatische Peppol lookup');
    }
  };

  useEffect(() => {
    loadCustomerInfo();
  }, [deal]);

  // Real-time validation
  useEffect(() => {
    setValidationStatus({
      peppolId: validatePeppolId(invoiceData.customerPeppolId),
      vatNumber: validateVatNumber(invoiceData.customerVatNumber)
    });
  }, [invoiceData.customerPeppolId, invoiceData.customerVatNumber]);

  const handleSendInvoice = async () => {
    if (!validatePeppolId(invoiceData.customerPeppolId)) {
      toast.error('Ongeldig Peppol ID formaat');
      return;
    }

    if (!customerInfo.name || !customerInfo.address) {
      toast.error('Klantgegevens zijn niet compleet');
      return;
    }

    // Show confirmation dialog first
    setShowConfirmDialog(true);
  };

  const confirmAndSendInvoice = async () => {
    setLoading(true);
    
    try {
      const peppolInvoiceData: PeppolInvoiceData = {
        dealId: deal.id,
        invoiceNumber: invoiceData.invoiceNumber,
        issueDate: invoiceData.issueDate,
        dueDate: invoiceData.dueDate,
        currency: invoiceData.currency,
        totalAmount: calculateTotal(),
        taxAmount: calculateTax(),
        subtotalAmount: parseFloat(invoiceData.amount),
        
        supplier: {
          name: 'PepHub BV',
          vatNumber: 'NL999999999B01',
          registrationNumber: '99999999',
          address: {
            street: 'Bedrijfsstraat 1',
            city: 'Amsterdam',
            postalCode: '1000 AA',
            country: 'Netherlands'
          },
          peppolId: '0088:9999999999999'
        },
        
        customer: {
          name: customerInfo.name,
          vatNumber: invoiceData.customerVatNumber,
          address: {
            street: customerInfo.address,
            city: customerInfo.city,
            postalCode: customerInfo.postalCode,
            country: customerInfo.country
          },
          peppolId: invoiceData.customerPeppolId
        },
        
        lines: [{
          id: '1',
          description: invoiceData.description,
          quantity: 1,
          unitPrice: parseFloat(invoiceData.amount),
          totalPrice: parseFloat(invoiceData.amount),
          taxRate: invoiceData.taxRate,
          taxAmount: calculateTax()
        }]
      };

      // Create audit log entry
      await hubspotService.createAuditLogEntry(deal.id, 'invoice_send_initiated', {
        invoiceNumber: invoiceData.invoiceNumber,
        customerName: customerInfo.name,
        amount: calculateTotal(),
        peppolId: invoiceData.customerPeppolId
      });

      const result = await peppolService.sendInvoice(peppolInvoiceData);
      
      // Create detailed timeline event in HubSpot
      await hubspotService.createTimelineEvent(deal.id, {
        eventType: 'peppol_invoice_sent',
        title: 'Peppol-factuur verzonden via PepHub',
        description: `Factuur ${invoiceData.invoiceNumber} verzonden naar ${customerInfo.name} via Peppol-netwerk`,
        invoiceNumber: invoiceData.invoiceNumber,
        amount: calculateTotal(),
        peppolId: invoiceData.customerPeppolId,
        status: result.status,
        peppolMessageId: result.peppolMessageId,
        recipientId: result.recipientId
      });

      // Update deal custom properties
      await hubspotService.updateDealCustomProperties(deal.id, {
        peppol_invoice_last_status: result.status,
        peppol_invoice_last_sent_date: new Date().toISOString(),
        peppol_invoice_count: 1, // In production, this would increment
        peppol_invoice_total_amount: calculateTotal(),
        peppol_invoice_last_number: invoiceData.invoiceNumber
      });

      // Create success audit log
      await hubspotService.createAuditLogEntry(deal.id, 'invoice_sent_success', {
        invoiceNumber: invoiceData.invoiceNumber,
        status: result.status,
        peppolMessageId: result.peppolMessageId
      });
      
      toast.success('Peppol-factuur succesvol verzonden!', {
        description: `Factuur ${invoiceData.invoiceNumber} is verzonden naar ${customerInfo.name}`
      });
      onInvoiceSent(result);
      
    } catch (error) {
      console.error('Fout bij verzenden factuur:', error);
      
      // Create error audit log
      await hubspotService.createAuditLogEntry(deal.id, 'invoice_send_failed', {
        invoiceNumber: invoiceData.invoiceNumber,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Create error timeline event
      await hubspotService.createTimelineEvent(deal.id, {
        eventType: 'peppol_invoice_error',
        title: 'Fout bij verzenden Peppol-factuur',
        description: `Factuur ${invoiceData.invoiceNumber} kon niet worden verzonden`,
        invoiceNumber: invoiceData.invoiceNumber,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });

      // Update deal properties with error status
      await hubspotService.updateDealCustomProperties(deal.id, {
        peppol_invoice_last_status: 'failed',
        peppol_invoice_last_error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      toast.error('Fout bij verzenden factuur', {
        description: 'De factuur kon niet worden verzonden. Probeer het opnieuw.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Peppol Factuur Genereren
        </CardTitle>
        <CardDescription>
          Vul de factuurgegevens aan en verzend via het Peppol-netwerk
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Deal info */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-sm">Deal: {deal.properties.dealname}</h3>
            <Badge variant="outline">
              €{new Intl.NumberFormat('nl-NL').format(parseFloat(deal.properties.amount))}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Deal ID: {deal.id} • Sluiting: {new Date(deal.properties.closedate).toLocaleDateString('nl-NL')}
          </p>
        </div>

        {/* Invoice details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="invoiceNumber">Factuurnummer</Label>
            <Input
              id="invoiceNumber"
              value={invoiceData.invoiceNumber}
              onChange={(e) => setInvoiceData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Valuta</Label>
            <Input
              id="currency"
              value={invoiceData.currency}
              onChange={(e) => setInvoiceData(prev => ({ ...prev, currency: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="issueDate">Factuurdatum</Label>
            <Input
              id="issueDate"
              type="date"
              value={invoiceData.issueDate}
              onChange={(e) => setInvoiceData(prev => ({ ...prev, issueDate: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDate">Vervaldatum</Label>
            <Input
              id="dueDate"
              type="date"
              value={invoiceData.dueDate}
              onChange={(e) => setInvoiceData(prev => ({ ...prev, dueDate: e.target.value }))}
            />
          </div>
        </div>

        {/* Customer info */}
        <Separator />
        
        <div>
          <h3 className="font-medium mb-4 flex items-center gap-2">
            Klantgegevens
            {customerInfo.validated && <CheckCircle className="h-4 w-4 text-success" />}
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Bedrijfsnaam</Label>
              <Input
                id="customerName"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Automatisch opgehaald uit HubSpot"
              />
            </div>
            
            {/* Peppol Lookup Status */}
            {peppolLookupStatus.loading && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700">
                  <Loader className="h-4 w-4 animate-spin" />
                  <span className="text-sm font-medium">Peppol ID automatisch zoeken...</span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Zoeken in Peppol directory en Recommand API op basis van klantgegevens
                </p>
              </div>
            )}

            {peppolLookupStatus.result?.found && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Peppol ID automatisch gevonden</span>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  Gevonden via {peppolLookupStatus.result.source === 'peppol_directory' ? 'Peppol directory' : 
                    peppolLookupStatus.result.source === 'recommand_api' ? 'Recommand API' : 'HubSpot cache'} 
                  • Betrouwbaarheid: {peppolLookupStatus.result.confidence}
                </p>
              </div>
            )}

            {peppolLookupStatus.error && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Peppol ID niet gevonden</span>
                </div>
                <p className="text-xs text-amber-600 mt-1">{peppolLookupStatus.error}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => setShowPeppolField(true)}
                    className="text-xs text-amber-700 hover:text-amber-800 underline"
                  >
                    Handmatig invoeren
                  </button>
                  <a
                    href="https://peppol.org/directory"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-amber-700 hover:text-amber-800 underline flex items-center gap-1"
                  >
                    Peppol directory <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              {(showPeppolField || invoiceData.customerPeppolId) && (
                <div className="space-y-2">
                  <Label htmlFor="customerPeppolId" className="flex items-center gap-2">
                    Peppol ID *
                    <div className="group relative">
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      <div className="invisible group-hover:visible absolute bottom-5 left-0 z-10 w-64 p-2 bg-popover border border-border rounded-md shadow-md text-xs">
                        Indien leeg, wordt het Peppol-ID automatisch gezocht op basis van klantinformatie
                      </div>
                    </div>
                  </Label>
                  <div className="relative">
                    <Input
                      id="customerPeppolId"
                      value={invoiceData.customerPeppolId}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, customerPeppolId: e.target.value }))}
                      placeholder="0088:1234567890123"
                      className={`pr-8 ${
                        invoiceData.customerPeppolId
                          ? validationStatus.peppolId
                            ? 'border-success'
                            : 'border-destructive'
                          : ''
                      }`}
                    />
                    {invoiceData.customerPeppolId && (
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        {validationStatus.peppolId ? (
                          <CheckCircle className="h-4 w-4 text-success" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    )}
                  </div>
                  {invoiceData.customerPeppolId && !validationStatus.peppolId && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Formaat: 0088:1234567890123
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => deal.associations?.companies?.[0] && performPeppolLookup({ properties: customerInfo })}
                      disabled={peppolLookupStatus.loading}
                      className="text-xs text-primary hover:text-primary/80 underline flex items-center gap-1"
                    >
                      <Search className="h-3 w-3" />
                      Opnieuw zoeken
                    </button>
                  </div>
                </div>
              )}
              
              {!showPeppolField && !invoiceData.customerPeppolId && !peppolLookupStatus.loading && (
                <div className="space-y-2">
                  <Label>Peppol ID</Label>
                  <div className="h-10 px-3 py-2 bg-muted/50 rounded-md flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Wordt automatisch gezocht...</span>
                    <Loader className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="customerVatNumber">BTW-nummer</Label>
                <div className="relative">
                  <Input
                    id="customerVatNumber"
                    value={invoiceData.customerVatNumber}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, customerVatNumber: e.target.value }))}
                    placeholder="NL123456789B01"
                    className={`pr-8 ${
                      invoiceData.customerVatNumber
                        ? validationStatus.vatNumber
                          ? 'border-success'
                          : 'border-destructive'
                        : ''
                    }`}
                  />
                  {invoiceData.customerVatNumber && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      {validationStatus.vatNumber ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  )}
                </div>
                {invoiceData.customerVatNumber && !validationStatus.vatNumber && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Ongeldig BTW-nummer formaat
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Invoice lines */}
        <Separator />
        
        <div>
          <h3 className="font-medium mb-4">Factuurregels</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Omschrijving</Label>
              <Textarea
                id="description"
                value={invoiceData.description}
                onChange={(e) => setInvoiceData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Beschrijving van de geleverde dienst/product"
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Bedrag (excl. BTW)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={invoiceData.amount}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxRate">BTW %</Label>
                <Input
                  id="taxRate"
                  type="number"
                  value={invoiceData.taxRate}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, taxRate: parseFloat(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Totaal (incl. BTW)</Label>
                <div className="h-10 px-3 py-2 bg-muted/50 rounded-md flex items-center text-sm font-medium">
                  €{new Intl.NumberFormat('nl-NL', { minimumFractionDigits: 2 }).format(calculateTotal())}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Send button */}
        <Separator />
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            <p>Facturen worden namens PepHub BV via het Peppol-netwerk verzonden.</p>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={loading || !invoiceData.customerPeppolId || !validationStatus.peppolId || !customerInfo.name}
                size="lg"
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Verzend als Peppol-factuur
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Factuur verzenden bevestigen
                </AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-3">
                    <p>Weet je zeker dat je deze factuur wilt verzenden?</p>
                    <div className="p-3 bg-muted rounded-lg text-sm space-y-2">
                      <div className="flex justify-between">
                        <span>Factuurnummer:</span>
                        <span className="font-medium">{invoiceData.invoiceNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Klant:</span>
                        <span className="font-medium">{customerInfo.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bedrag:</span>
                        <span className="font-medium">€{new Intl.NumberFormat('nl-NL', { minimumFractionDigits: 2 }).format(calculateTotal())}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Peppol ID:</span>
                        <span className="font-medium text-xs">{invoiceData.customerPeppolId}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Deze factuur wordt verzonden namens PepHub BV via het beveiligde Peppol-netwerk.
                    </p>
                    {peppolLookupStatus.result && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Peppol ID gevonden via {peppolLookupStatus.result.source === 'peppol_directory' ? 'Peppol directory' : 
                          peppolLookupStatus.result.source === 'recommand_api' ? 'Recommand API' : 'HubSpot cache'}
                      </p>
                    )}
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuleren</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleSendInvoice}
                  disabled={loading}
                  className="gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Verzenden...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Ja, verzenden
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}