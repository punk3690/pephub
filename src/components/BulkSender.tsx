import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Send, CheckSquare, Square, AlertTriangle, CheckCircle, Clock, X } from 'lucide-react';
import { HubSpotDeal, PeppolInvoiceData } from '@/types/hubspot';
import { hubspotService } from '@/services/hubspotService';
import { peppolService } from '@/services/peppolService';
import { toast } from 'sonner';

interface BulkInvoiceItem extends HubSpotDeal {
  peppolId?: string;
  status: 'pending' | 'processing' | 'sent' | 'error';
  errorMessage?: string;
  selected: boolean;
  companyName?: string;
}

interface BulkSendProgress {
  total: number;
  completed: number;
  errors: number;
  isProcessing: boolean;
}

export const BulkSender = () => {
  const [deals, setDeals] = useState<BulkInvoiceItem[]>([]);
  const [filteredDeals, setFilteredDeals] = useState<BulkInvoiceItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<BulkSendProgress>({
    total: 0,
    completed: 0,
    errors: 0,
    isProcessing: false
  });

  const BATCH_LIMIT = 200;

  useEffect(() => {
    loadDeals();
  }, []);

  useEffect(() => {
    filterDeals();
  }, [deals, searchTerm, statusFilter]);

  const loadDeals = async () => {
    try {
      setLoading(true);
      const dealsData = await hubspotService.getDeals();
      
      // Load company data and create bulk items
      const bulkItems: BulkInvoiceItem[] = await Promise.all(
        dealsData.map(async (deal) => {
          let companyName = 'Onbekend bedrijf';
          
          // Try to load company data
          if (deal.associations?.companies?.[0]?.id) {
            try {
              const company = await hubspotService.getCompany(deal.associations.companies[0].id);
              if (company) {
                companyName = company.properties.name;
              }
            } catch (error) {
              console.error('Error loading company:', error);
            }
          }
          
          return {
            ...deal,
            status: 'pending' as const,
            selected: false,
            companyName,
            peppolId: undefined
          };
        })
      );
      
      setDeals(bulkItems);
    } catch (error) {
      toast.error('Fout bij laden van deals');
      console.error('Error loading deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDeals = () => {
    let filtered = deals;

    if (searchTerm) {
      filtered = filtered.filter(deal => 
        deal.properties.dealname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(deal => deal.status === statusFilter);
    }

    setFilteredDeals(filtered);
  };

  const toggleSelectAll = () => {
    const hasUnselected = filteredDeals.some(deal => !deal.selected);
    setDeals(prev => prev.map(deal => ({
      ...deal,
      selected: filteredDeals.find(fd => fd.id === deal.id) ? hasUnselected : deal.selected
    })));
  };

  const toggleSelect = (dealId: string) => {
    setDeals(prev => prev.map(deal => 
      deal.id === dealId ? { ...deal, selected: !deal.selected } : deal
    ));
  };

  const getSelectedDeals = () => deals.filter(deal => deal.selected);

  const mockPeppolLookup = async (deal: BulkInvoiceItem): Promise<string | null> => {
    // Mock Peppol ID lookup - in production this would call the Recommand API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simulate finding Peppol ID for some companies
    const mockPeppolIds = [
      '0088:7318900000000',
      '0088:7318900000001', 
      '0088:7318900000002',
      '0088:7318900000003'
    ];
    
    // Random success rate of 80%
    if (Math.random() > 0.2) {
      return mockPeppolIds[Math.floor(Math.random() * mockPeppolIds.length)];
    }
    
    return null;
  };

  const lookupPeppolIds = async (selectedDeals: BulkInvoiceItem[]) => {
    for (const deal of selectedDeals) {
      if (!deal.peppolId) {
        try {
          const peppolId = await mockPeppolLookup(deal);
          
          if (peppolId) {
            setDeals(prev => prev.map(d => 
              d.id === deal.id ? { ...d, peppolId } : d
            ));
          }
        } catch (error) {
          console.error(`Error looking up Peppol ID for deal ${deal.id}:`, error);
        }
      }
    }
  };

  const processBatch = async (batch: BulkInvoiceItem[]) => {
    // First lookup missing Peppol IDs
    await lookupPeppolIds(batch);
    
    // Get updated deals with Peppol IDs
    const updatedDeals = deals.filter(d => batch.some(b => b.id === d.id));

    for (const deal of updatedDeals) {
      try {
        setDeals(prev => prev.map(d => 
          d.id === deal.id ? { ...d, status: 'processing' } : d
        ));

        if (!deal.peppolId) {
          throw new Error('Geen Peppol-ID gevonden voor deze klant');
        }

        // Create mock invoice data
        const invoiceData: PeppolInvoiceData = {
          dealId: deal.id,
          invoiceNumber: `INV-${Date.now()}-${deal.id.slice(-4)}`,
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          currency: 'EUR',
          totalAmount: parseFloat(deal.properties.amount || '0') * 1.21, // Including VAT
          taxAmount: parseFloat(deal.properties.amount || '0') * 0.21,
          subtotalAmount: parseFloat(deal.properties.amount || '0'),
          supplier: {
            name: 'PepHub BV',
            vatNumber: 'NL123456789B01',
            registrationNumber: '12345678',
            address: {
              street: 'Hoofdstraat 123',
              city: 'Amsterdam',
              postalCode: '1000 AA',
              country: 'NL'
            },
            peppolId: '0088:7318900000999'
          },
          customer: {
            name: deal.companyName || 'Onbekend bedrijf',
            address: {
              street: 'Klantstraat 456',
              city: 'Rotterdam',
              postalCode: '2000 BB',
              country: 'NL'
            },
            peppolId: deal.peppolId
          },
          lines: [{
            id: '1',
            description: deal.properties.dealname || 'Service',
            quantity: 1,
            unitPrice: parseFloat(deal.properties.amount || '0'),
            totalPrice: parseFloat(deal.properties.amount || '0'),
            taxRate: 21,
            taxAmount: parseFloat(deal.properties.amount || '0') * 0.21
          }]
        };

        await peppolService.sendInvoice(invoiceData);

        setDeals(prev => prev.map(d => 
          d.id === deal.id ? { ...d, status: 'sent', selected: false } : d
        ));

        setProgress(prev => ({ ...prev, completed: prev.completed + 1 }));

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Onbekende fout';
        
        setDeals(prev => prev.map(d => 
          d.id === deal.id ? { 
            ...d, 
            status: 'error', 
            errorMessage,
            selected: false 
          } : d
        ));

        setProgress(prev => ({ ...prev, errors: prev.errors + 1, completed: prev.completed + 1 }));
      }
    }
  };

  const sendSelectedInvoices = async () => {
    const selectedDeals = getSelectedDeals();
    
    if (selectedDeals.length === 0) {
      toast.error('Selecteer minimaal één factuur om te verzenden');
      return;
    }

    if (selectedDeals.length > BATCH_LIMIT) {
      toast.error(`Maximaal ${BATCH_LIMIT} facturen per batch toegestaan`);
      return;
    }

    setProgress({
      total: selectedDeals.length,
      completed: 0,
      errors: 0,
      isProcessing: true
    });

    try {
      await processBatch(selectedDeals);
      
      // Get final counts after processing
      const currentProgress = progress;
      setProgress(prev => {
        const successful = prev.completed - prev.errors;
        
        if (prev.errors === 0) {
          toast.success(`Alle ${successful} facturen succesvol verzonden!`);
        } else {
          toast.warning(`${successful} facturen verzonden, ${prev.errors} fouten`);
        }
        
        return { ...prev, isProcessing: false };
      });
      
    } catch (error) {
      toast.error('Fout bij bulk verzending');
      console.error('Bulk send error:', error);
      setProgress(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const retryFailedInvoice = async (deal: BulkInvoiceItem) => {
    if (!deal.peppolId) {
      // Try to lookup Peppol ID again
      const peppolId = await mockPeppolLookup(deal);
      if (peppolId) {
        setDeals(prev => prev.map(d => 
          d.id === deal.id ? { ...d, peppolId } : d
        ));
      } else {
        toast.error('Geen Peppol-ID gevonden voor deze klant');
        return;
      }
    }
    
    await processBatch([deal]);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'processing': return <Clock className="h-4 w-4 text-warning animate-spin" />;
      case 'error': return <X className="h-4 w-4 text-destructive" />;
      default: return null;
    }
  };

  const selectedCount = getSelectedDeals().length;
  const selectedAmount = getSelectedDeals().reduce((sum, deal) => 
    sum + parseFloat(deal.properties.amount || '0'), 0
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Deals laden...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Factuurverzending</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Zoek op deal of bedrijfsnaam..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter op status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle statussen</SelectItem>
                <SelectItem value="pending">Wachtend</SelectItem>
                <SelectItem value="processing">In behandeling</SelectItem>
                <SelectItem value="sent">Verzonden</SelectItem>
                <SelectItem value="error">Fout</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedCount > 0 && (
            <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg">
              <div>
                <p className="font-medium">
                  {selectedCount} facturen geselecteerd
                </p>
                <p className="text-sm text-muted-foreground">
                  Totaalbedrag: €{selectedAmount.toFixed(2)}
                </p>
              </div>
              <Button 
                onClick={sendSelectedInvoices}
                disabled={progress.isProcessing}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Verzend geselecteerde facturen
              </Button>
            </div>
          )}

          {progress.isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Verwerkt: {progress.completed} van {progress.total}</span>
                <span>Fouten: {progress.errors}</span>
              </div>
              <Progress value={(progress.completed / progress.total) * 100} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deals Table */}
      <Card>
        <CardContent className="p-0">
          <div className="border-b p-4 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSelectAll}
              className="gap-2"
            >
              {filteredDeals.some(deal => !deal.selected) ? (
                <Square className="h-4 w-4" />
              ) : (
                <CheckSquare className="h-4 w-4" />
              )}
              Selecteer alles
            </Button>
            <span className="text-sm text-muted-foreground">
              {filteredDeals.length} deals gevonden
            </span>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Deal</TableHead>
                <TableHead>Bedrijf</TableHead>
                <TableHead>Bedrag</TableHead>
                <TableHead>Peppol-ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeals.map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell>
                    <Checkbox
                      checked={deal.selected}
                      onCheckedChange={() => toggleSelect(deal.id)}
                      disabled={deal.status === 'processing'}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {deal.properties.dealname}
                  </TableCell>
                  <TableCell>
                    {deal.companyName}
                  </TableCell>
                  <TableCell>
                    €{parseFloat(deal.properties.amount || '0').toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {deal.peppolId ? (
                      <Badge variant="outline" className="font-mono text-xs">
                        {deal.peppolId}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">Auto lookup</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(deal.status)}
                      <span className="capitalize">{deal.status}</span>
                      {deal.status === 'error' && deal.errorMessage && (
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 text-destructive" />
                          <span className="text-xs text-muted-foreground truncate max-w-32" title={deal.errorMessage}>
                            {deal.errorMessage}
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {deal.status === 'error' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => retryFailedInvoice(deal)}
                        className="h-8 w-8 p-0"
                        title="Opnieuw proberen"
                      >
                        <Send className="h-3 w-3" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredDeals.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Geen deals gevonden
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};