import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader, RefreshCw, ExternalLink, Euro, Search, Send } from 'lucide-react';
import { HubSpotDeal } from '@/types/hubspot';
import { hubspotService } from '@/services/hubspotService';

interface DealSelectorProps {
  selectedDeal: HubSpotDeal | null;
  onDealSelect: (deal: HubSpotDeal) => void;
  selectedDeals?: HubSpotDeal[];
  onBatchSelect?: (deals: HubSpotDeal[]) => void;
  batchMode?: boolean;
}

export function DealSelector({ selectedDeal, onDealSelect, selectedDeals = [], onBatchSelect, batchMode = false }: DealSelectorProps) {
  const [deals, setDeals] = useState<HubSpotDeal[]>([]);
  const [filteredDeals, setFilteredDeals] = useState<HubSpotDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadDeals = async () => {
    try {
      setLoading(true);
      const dealsData = await hubspotService.getDealsForPortal();
      setDeals(dealsData);
      setFilteredDeals(dealsData);
      
      // Auto-select current deal if available
      const context = hubspotService.getContext();
      if (context?.dealId && !selectedDeal) {
        const currentDeal = dealsData.find(deal => deal.id === context.dealId);
        if (currentDeal) {
          onDealSelect(currentDeal);
        }
      }
    } catch (error) {
      console.error('Fout bij ophalen deals:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter deals based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredDeals(deals);
    } else {
      const filtered = deals.filter(deal => 
        deal.properties.dealname.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredDeals(filtered);
    }
  }, [deals, searchQuery]);

  const handleBatchToggle = (deal: HubSpotDeal, checked: boolean) => {
    if (!onBatchSelect) return;
    
    let newSelection;
    if (checked) {
      newSelection = [...selectedDeals, deal];
    } else {
      newSelection = selectedDeals.filter(d => d.id !== deal.id);
    }
    onBatchSelect(newSelection);
  };

  const refreshDeals = async () => {
    setRefreshing(true);
    await loadDeals();
    setRefreshing(false);
  };

  useEffect(() => {
    loadDeals();
  }, []);

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL');
  };

  const getDealStageLabel = (stage: string) => {
    const stages: Record<string, string> = {
      'closedwon': 'Gewonnen',
      'closedlost': 'Verloren',
      'contractsent': 'Contract verzonden',
      'decisionmakerboughtin': 'Beslisser akkoord',
      'qualifiedtobuy': 'Gekwalificeerd',
      'appointmentscheduled': 'Afspraak ingepland',
      'presentationscheduled': 'Presentatie ingepland'
    };
    return stages[stage] || stage;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader className="h-5 w-5 animate-spin" />
            <span>Deals laden...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              Selecteer Deal{batchMode && ` (${selectedDeals.length} geselecteerd)`}
            </CardTitle>
            <CardDescription>
              {batchMode ? 'Selecteer meerdere deals voor batch verzending' : 'Kies de deal waarvoor je een Peppol-factuur wilt verzenden'}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshDeals}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Vernieuwen
          </Button>
        </div>
        
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoek op dealnaam..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {filteredDeals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>{searchQuery ? 'Geen deals gevonden met deze zoekterm' : 'Geen deals gevonden'}</p>
          </div>
        ) : (
          filteredDeals.map((deal) => (
            <div
              key={deal.id}
              className={`p-4 rounded-lg border-2 transition-all ${!batchMode ? 'cursor-pointer' : ''} hover:shadow-md ${
                selectedDeal?.id === deal.id
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-muted hover:border-primary/50'
              }`}
              onClick={!batchMode ? () => onDealSelect(deal) : undefined}
            >
              <div className="flex items-start justify-between gap-4">
                {batchMode && (
                  <div className="pt-1">
                    <Checkbox
                      checked={selectedDeals.some(d => d.id === deal.id)}
                      onCheckedChange={(checked) => handleBatchToggle(deal, checked as boolean)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-sm truncate">
                      {deal.properties.dealname}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {getDealStageLabel(deal.properties.dealstage)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Euro className="h-3 w-3" />
                      {formatAmount(deal.properties.amount)}
                    </div>
                    <div>
                      Sluiting: {formatDate(deal.properties.closedate)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!batchMode && selectedDeal?.id === deal.id && (
                    <Badge variant="default" className="text-xs">
                      Geselecteerd
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Open deal in HubSpot (in iframe context this would work)
                      console.log('Open deal in HubSpot:', deal.id);
                    }}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}