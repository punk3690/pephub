import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Zap, FileText, History, Settings, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { HubSpotDeal, PeppolSendStatus } from '@/types/hubspot';
import { hubspotService } from '@/services/hubspotService';
import { AuthSetup } from '@/components/AuthSetup';
import { DealSelector } from '@/components/DealSelector';
import { InvoiceGenerator } from '@/components/InvoiceGenerator';
import { InvoiceHistory } from '@/components/InvoiceHistory';
import { MonthlyStats } from '@/components/MonthlyStats';
import { ModeToggle } from '@/components/ModeToggle';
import { BulkSender } from '@/components/BulkSender';
import { toast } from 'sonner';

const Index = () => {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<HubSpotDeal | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('invoice');
  const [isBulkMode, setIsBulkMode] = useState(false);

  useEffect(() => {
    // Check if already authenticated
    if (hubspotService.isAuthenticated()) {
      setAuthenticated(true);
    }
  }, []);

  const handleAuthComplete = () => {
    setAuthenticated(true);
  };

  const handleDealSelect = (deal: HubSpotDeal) => {
    setSelectedDeal(deal);
    setActiveTab('invoice');
  };

  const handleInvoiceSent = (status: PeppolSendStatus) => {
    setRefreshTrigger(prev => prev + 1);
    setActiveTab('history');
    toast.success('Factuur succesvol verzonden via Peppol!');
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/50 p-4">
        <div className="max-w-4xl mx-auto py-8">
          <AuthSetup onAuthComplete={handleAuthComplete} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/50">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Pephub</h1>
                <p className="text-xs text-muted-foreground">Facturen via Peppol-netwerk</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={() => navigate('/credits')}
                className="gap-2 bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90 text-primary-foreground shadow-lg"
              >
                <CreditCard className="h-4 w-4" />
                Koop credits voor volumekorting
              </Button>
              
              <Badge variant="outline" className="gap-1">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                Verbonden
              </Badge>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRefreshTrigger(prev => prev + 1)}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Vernieuwen
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <MonthlyStats />
        
        {/* Mode Toggle */}
        <ModeToggle 
          isBulkMode={isBulkMode} 
          onModeChange={setIsBulkMode}
        />

        {isBulkMode ? (
          /* Bulk Mode */
          <BulkSender />
        ) : (
          /* Standard Mode */
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Deal selector - Always visible */}
            <div className="xl:col-span-1">
              <DealSelector
                selectedDeal={selectedDeal}
                onDealSelect={handleDealSelect}
              />
            </div>

            {/* Main content area */}
            <div className="xl:col-span-2">
              {selectedDeal ? (
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="invoice" className="gap-2">
                      <FileText className="h-4 w-4" />
                      Factuur Verzenden
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-2">
                      <History className="h-4 w-4" />
                      Geschiedenis
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="invoice" className="mt-6">
                    <InvoiceGenerator
                      deal={selectedDeal}
                      onInvoiceSent={handleInvoiceSent}
                    />
                  </TabsContent>
                  
                  <TabsContent value="history" className="mt-6">
                    <InvoiceHistory
                      dealId={selectedDeal.id}
                      refreshTrigger={refreshTrigger}
                    />
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Selecteer een Deal</h3>
                  <p className="text-muted-foreground text-sm">
                    Kies een deal uit de lijst om een Peppol-factuur te verzenden
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Global history at bottom for context - only in standard mode */}
        {!isBulkMode && !selectedDeal && (
          <div className="mt-8">
            <InvoiceHistory refreshTrigger={refreshTrigger} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/30 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="space-y-1">
              <p>Facturen worden verzonden namens <strong>PepHub BV</strong> via het Peppol-netwerk</p>
              <p className="text-xs">Verwerking van gegevens volgens AVG/GDPR. Alle verzendingen worden beveiligd verwerkt.</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="gap-1">
                <Settings className="h-3 w-3" />
                Centrale API-key beheer
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
