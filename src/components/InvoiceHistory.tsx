import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { History, RefreshCw, ExternalLink, Calendar, Hash, Building, Download, FileDown } from 'lucide-react';
import { PeppolSendStatus } from '@/types/hubspot';
import { peppolService } from '@/services/peppolService';
import { StatusBadge } from './StatusBadge';

interface InvoiceHistoryProps {
  dealId?: string;
  refreshTrigger?: number;
}

export function InvoiceHistory({ dealId, refreshTrigger }: InvoiceHistoryProps) {
  const [invoices, setInvoices] = useState<PeppolSendStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const invoicesData = await peppolService.getSentInvoices(dealId);
      setInvoices(invoicesData);
    } catch (error) {
      console.error('Fout bij ophalen factuurgeschiedenis:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshInvoices = async () => {
    setRefreshing(true);
    await loadInvoices();
    setRefreshing(false);
  };

  useEffect(() => {
    loadInvoices();
  }, [dealId, refreshTrigger]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeSince = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} dag${diffDays > 1 ? 'en' : ''} geleden`;
    } else if (diffHours > 0) {
      return `${diffHours} uur geleden`;
    } else {
      return 'Net verzonden';
    }
  };

  const filteredInvoices = dealId 
    ? invoices.filter(invoice => invoice.dealId === dealId)
    : invoices;

  const exportToCSV = () => {
    const headers = ['Factuurnummer', 'Status', 'Verzonden op', 'Afgeleverd op', 'Deal ID', 'Ontvanger ID', 'Peppol Message ID'];
    const csvData = filteredInvoices.map(invoice => [
      invoice.invoiceNumber,
      invoice.status,
      formatDate(invoice.sentAt),
      invoice.deliveredAt ? formatDate(invoice.deliveredAt) : '',
      invoice.dealId,
      invoice.recipientId || '',
      invoice.peppolMessageId || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `peppol-facturen-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Verzendgeschiedenis
            </CardTitle>
            <CardDescription>
              {dealId 
                ? 'Peppol-facturen voor deze deal'
                : 'Alle verzonden Peppol-facturen'
              }
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {filteredInvoices.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={refreshInvoices}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Vernieuwen
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Geschiedenis laden...</span>
            </div>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">
              {dealId 
                ? 'Nog geen facturen verzonden voor deze deal'
                : 'Nog geen Peppol-facturen verzonden'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInvoices.map((invoice, index) => (
              <div key={invoice.id}>
                <div className="flex items-start justify-between gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{invoice.invoiceNumber}</span>
                      </div>
                      <StatusBadge status={invoice.status} />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Verzonden: {formatDate(invoice.sentAt)}
                      </div>
                      
                      {invoice.deliveredAt && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Afgeleverd: {formatDate(invoice.deliveredAt)}
                        </div>
                      )}
                      
                      {!dealId && (
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          Deal ID: {invoice.dealId}
                        </div>
                      )}
                      
                      {invoice.recipientId && (
                        <div className="flex items-center gap-1">
                          <span>Ontvanger:</span>
                          <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                            {invoice.recipientId}
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    {invoice.errorMessage && (
                      <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
                        {invoice.errorMessage}
                      </div>
                    )}
                    
                    {invoice.peppolMessageId && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Peppol Message ID: <code className="bg-muted px-1 rounded">{invoice.peppolMessageId}</code>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-xs text-muted-foreground text-right">
                      {getTimeSince(invoice.sentAt)}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          // Download individual invoice as CSV
                          const csvContent = [
                            'Factuurnummer,Status,Verzonden op,Afgeleverd op,Deal ID,Ontvanger ID,Peppol Message ID',
                            `"${invoice.invoiceNumber}","${invoice.status}","${formatDate(invoice.sentAt)}","${invoice.deliveredAt ? formatDate(invoice.deliveredAt) : ''}","${invoice.dealId}","${invoice.recipientId || ''}","${invoice.peppolMessageId || ''}"`
                          ].join('\n');
                          
                          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                          const link = document.createElement('a');
                          link.href = URL.createObjectURL(blob);
                          link.download = `peppol-factuur-${invoice.invoiceNumber}.csv`;
                          link.click();
                        }}
                        title="Download factuur"
                      >
                        <FileDown className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          console.log('Open deal in HubSpot:', invoice.dealId);
                        }}
                        title="Open deal in HubSpot"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {index < filteredInvoices.length - 1 && (
                  <Separator className="my-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}