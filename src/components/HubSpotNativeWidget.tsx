import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Send, History, RefreshCw, FileText, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { HubSpotDeal, PeppolSendStatus } from '@/types/hubspot';
import { InvoiceGenerator } from './InvoiceGenerator';
import { InvoiceHistory } from './InvoiceHistory';
import { StatusBadge } from './StatusBadge';
import { hubspotService } from '@/services/hubspotService';
import { peppolService } from '@/services/peppolService';
import { toast } from 'sonner';

interface HubSpotNativeWidgetProps {
  dealId?: string;
  embedded?: boolean; // Whether this is embedded in HubSpot's native interface
}

export function HubSpotNativeWidget({ dealId, embedded = false }: HubSpotNativeWidgetProps) {
  const [deal, setDeal] = useState<HubSpotDeal | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<PeppolSendStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadData();
  }, [dealId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load current deal
      const currentDeal = dealId 
        ? await hubspotService.getCurrentDeal() // Mock: would get specific deal in production
        : await hubspotService.getCurrentDeal();
      
      setDeal(currentDeal);

      // Load recent invoices for this deal
      if (currentDeal) {
        const invoices = await peppolService.getSentInvoices(currentDeal.id);
        setRecentInvoices(invoices.slice(0, 3)); // Show last 3 invoices
      }
    } catch (error) {
      console.error('Error loading HubSpot data:', error);
      toast.error('Fout bij laden van dealgegevens');
    } finally {
      setLoading(false);
    }
  };

  const handleInvoiceSent = (status: PeppolSendStatus) => {
    setRefreshTrigger(prev => prev + 1);
    loadData(); // Refresh all data
    
    toast.success('Peppol-factuur verzonden!', {
      description: `Factuur ${status.invoiceNumber} is succesvol verzonden`
    });
  };

  const handleRetryInvoice = async (invoice: PeppolSendStatus) => {
    try {
      if (deal) {
        await hubspotService.retryFailedInvoice(deal.id, invoice.id);
        toast.success('Factuur wordt opnieuw verzonden');
        loadData(); // Refresh data
      }
    } catch (error) {
      toast.error('Fout bij opnieuw verzenden');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" />
            <span>Laden...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!deal) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Geen deal geselecteerd</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Compact view for embedded HubSpot widget
  if (embedded) {
    return (
      <div className="space-y-4">
        {/* Quick Status Overview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Peppol Facturen
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {recentInvoices.length > 0 ? (
                <>
                  <div className="space-y-2">
                    {recentInvoices.map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <div>
                          <p className="text-sm font-medium">{invoice.invoiceNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(invoice.sentAt).toLocaleDateString('nl-NL')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={invoice.status} />
                          {invoice.status === 'failed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRetryInvoice(invoice)}
                              className="h-6 w-6 p-0"
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => window.open('/pephub-full-interface', '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-2" />
                      Open volledige interface
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    Nog geen Peppol-facturen verzonden voor deze deal
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" className="gap-2">
                        <Send className="h-3 w-3" />
                        Eerste factuur verzenden
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-6xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Peppol-factuur verzenden</AlertDialogTitle>
                        <AlertDialogDescription>
                          Verzend een factuur via het Peppol-netwerk voor deal: {deal.properties.dealname}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="max-h-[70vh] overflow-y-auto">
                        <InvoiceGenerator 
                          deal={deal} 
                          onInvoiceSent={handleInvoiceSent}
                        />
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Sluiten</AlertDialogCancel>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Full interface view
  return (
    <div className="space-y-6">
      {/* Deal Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {deal.properties.dealname}
              </CardTitle>
              <CardDescription>
                Deal ID: {deal.id} • Waarde: €{new Intl.NumberFormat('nl-NL').format(parseFloat(deal.properties.amount))}
              </CardDescription>
            </div>
            <Badge variant={deal.properties.dealstage === 'closedwon' ? 'default' : 'secondary'}>
              {deal.properties.dealstage === 'closedwon' ? 'Afgesloten' : 'In behandeling'}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Main Tabs Interface */}
      <Tabs defaultValue="send" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="send" className="gap-2">
            <Send className="h-4 w-4" />
            Factuur verzenden
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Geschiedenis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-6">
          <InvoiceGenerator 
            deal={deal} 
            onInvoiceSent={handleInvoiceSent}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <InvoiceHistory 
            dealId={deal.id}
            refreshTrigger={refreshTrigger}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}