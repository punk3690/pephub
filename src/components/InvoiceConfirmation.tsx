import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, AlertTriangle, FileText, Building, User, Shield, Send, Loader } from 'lucide-react';
import { PeppolInvoiceData } from '@/types/hubspot';

interface InvoiceConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceData: PeppolInvoiceData;
  onConfirm: () => Promise<void>;
  loading?: boolean;
}

export function InvoiceConfirmation({ 
  open, 
  onOpenChange, 
  invoiceData, 
  onConfirm, 
  loading = false 
}: InvoiceConfirmationProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error confirming invoice:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: invoiceData.currency
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Bevestig Peppol-factuur verzending
          </DialogTitle>
          <DialogDescription>
            Controleer alle gegevens voordat de factuur via het Peppol-netwerk wordt verzonden
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Factuuroverzicht</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Factuurnummer</p>
                  <p className="font-medium">{invoiceData.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Factuurdatum</p>
                  <p className="font-medium">{new Date(invoiceData.issueDate).toLocaleDateString('nl-NL')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vervaldatum</p>
                  <p className="font-medium">{new Date(invoiceData.dueDate).toLocaleDateString('nl-NL')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valuta</p>
                  <p className="font-medium">{invoiceData.currency}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Subtotaal</p>
                  <p className="font-medium">{formatCurrency(invoiceData.subtotalAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">BTW</p>
                  <p className="font-medium">{formatCurrency(invoiceData.taxAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-semibold">Totaal</p>
                  <p className="font-bold text-lg">{formatCurrency(invoiceData.totalAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Supplier & Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Supplier */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building className="h-4 w-4" />
                  Verzender (Leverancier)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{invoiceData.supplier.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {invoiceData.supplier.address.street}<br/>
                    {invoiceData.supplier.address.postalCode} {invoiceData.supplier.address.city}<br/>
                    {invoiceData.supplier.address.country}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">BTW-nummer:</span>
                    <Badge variant="outline">{invoiceData.supplier.vatNumber}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">KvK-nummer:</span>
                    <Badge variant="outline">{invoiceData.supplier.registrationNumber}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Peppol ID:</span>
                    <Badge variant="secondary">{invoiceData.supplier.peppolId}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-4 w-4" />
                  Ontvanger (Klant)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{invoiceData.customer.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {invoiceData.customer.address.street}<br/>
                    {invoiceData.customer.address.postalCode} {invoiceData.customer.address.city}<br/>
                    {invoiceData.customer.address.country}
                  </p>
                </div>
                <div className="space-y-1">
                  {invoiceData.customer.vatNumber && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">BTW-nummer:</span>
                      <Badge variant="outline">{invoiceData.customer.vatNumber}</Badge>
                    </div>
                  )}
                  {invoiceData.customer.registrationNumber && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Registratienummer:</span>
                      <Badge variant="outline">{invoiceData.customer.registrationNumber}</Badge>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Peppol ID:</span>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {invoiceData.customer.peppolId}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Invoice Lines */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Factuurregels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invoiceData.lines.map((line, index) => (
                  <div key={line.id} className="flex justify-between items-start p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{line.description}</p>
                      <p className="text-sm text-muted-foreground">
                        Hoeveelheid: {line.quantity} × {formatCurrency(line.unitPrice)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(line.totalPrice)}</p>
                      <p className="text-sm text-muted-foreground">
                        BTW ({line.taxRate}%): {formatCurrency(line.taxAmount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Security & Compliance Notice */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary mt-0.5" />
                <div className="space-y-2">
                  <p className="font-medium text-primary">Veiligheid en Compliance</p>
                  <p className="text-sm text-muted-foreground">
                    Deze factuur wordt verzonden via het beveiligde Peppol-netwerk conform EU-wetgeving. 
                    Alle gegevens worden versleuteld verzonden en er wordt een volledige audit trail bijgehouden 
                    voor compliance-doeleinden.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Door te bevestigen gaat u akkoord met het verzenden van deze factuur via PepHub en het Peppol-netwerk. 
                    Alle gegevens worden verwerkt conform onze AVG-beleid.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isConfirming}
          >
            Annuleren
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={isConfirming}
            className="gap-2"
          >
            {isConfirming ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Verzenden...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Factuur verzenden via Peppol
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}