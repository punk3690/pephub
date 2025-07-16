import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Send, Loader, FileText, CheckCircle, AlertTriangle, Shield } from 'lucide-react';
import { HubSpotDeal, PeppolInvoiceData } from '@/types/hubspot';
import { peppolService } from '@/services/peppolService';
import { hubspotService } from '@/services/hubspotService';
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
          
          setInvoiceData(prev => ({
            ...prev,
            customerPeppolId: company.properties.peppol_participant_id || '',
            customerVatNumber: company.properties.vat_number || ''
          }));
        }
      }
    } catch (error) {
      console.error('Fout bij laden klantgegevens:', error);
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
          name: 'Uw Bedrijf BV',
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

      const result = await peppolService.sendInvoice(peppolInvoiceData);
      
      toast.success('Peppol-factuur succesvol verzonden!');
      onInvoiceSent(result);
      
    } catch (error) {
      console.error('Fout bij verzenden factuur:', error);
      toast.error('Fout bij verzenden factuur');
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
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerPeppolId">Peppol ID *</Label>
                <div className="relative">
                  <Input
                    id="customerPeppolId"
                    value={invoiceData.customerPeppolId}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, customerPeppolId: e.target.value }))}
                    placeholder="iso6523-actorid-upis::0088::1234567890123"
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
                    Formaat: iso6523-actorid-upis::scheme::value
                  </p>
                )}
              </div>
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
            <p>Facturen worden namens Uw Bedrijf BV via het Peppol-netwerk verzonden.</p>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={loading || !validationStatus.peppolId || !customerInfo.name}
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