import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader, RefreshCw, ExternalLink, Euro } from 'lucide-react';
import { HubSpotDeal } from '@/types/hubspot';
import { hubspotService } from '@/services/hubspotService';

interface DealSelectorProps {
  selectedDeal: HubSpotDeal | null;
  onDealSelect: (deal: HubSpotDeal) => void;
}

export function DealSelector({ selectedDeal, onDealSelect }: DealSelectorProps) {
  const [deals, setDeals] = useState<HubSpotDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDeals = async () => {
    try {
      setLoading(true);
      const dealsData = await hubspotService.getDealsForPortal();
      setDeals(dealsData);
      
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
            <CardTitle className="text-lg">Selecteer Deal</CardTitle>
            <CardDescription>
              Kies de deal waarvoor je een Peppol-factuur wilt verzenden
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
      </CardHeader>
      <CardContent className="space-y-3">
        {deals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Geen deals gevonden</p>
          </div>
        ) : (
          deals.map((deal) => (
            <div
              key={deal.id}
              className={`p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${
                selectedDeal?.id === deal.id
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-muted hover:border-primary/50'
              }`}
              onClick={() => onDealSelect(deal)}
            >
              <div className="flex items-start justify-between gap-4">
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
                  {selectedDeal?.id === deal.id && (
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