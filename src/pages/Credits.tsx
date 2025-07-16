import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, CreditCard, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface CreditPackage {
  id: string;
  invoices: number;
  price: number;
  pricePerInvoice: number;
  discount: number;
  popular?: boolean;
}

const creditPackages: CreditPackage[] = [
  {
    id: 'package-1000',
    invoices: 1000,
    price: 150,
    pricePerInvoice: 0.15,
    discount: 25,
  },
  {
    id: 'package-2500',
    invoices: 2500,
    price: 350,
    pricePerInvoice: 0.14,
    discount: 30,
    popular: true,
  },
  {
    id: 'package-5000',
    invoices: 5000,
    price: 650,
    pricePerInvoice: 0.13,
    discount: 35,
  },
  {
    id: 'package-10000',
    invoices: 10000,
    price: 1200,
    pricePerInvoice: 0.12,
    discount: 40,
  },
];

const Credits = () => {
  const navigate = useNavigate();
  const [purchasingPackage, setPurchasingPackage] = useState<string | null>(null);

  const handlePurchase = async (pkg: CreditPackage) => {
    setPurchasingPackage(pkg.id);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`${pkg.invoices.toLocaleString()} credits succesvol aangekocht!`);
      
      // In a real implementation, this would integrate with Stripe
      // and update the user's credit balance in the database
      
      navigate('/');
    } catch (error) {
      toast.error('Er ging iets mis bij de betaling. Probeer het opnieuw.');
    } finally {
      setPurchasingPackage(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/50">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Terug naar Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex items-center justify-center mx-auto mb-4">
            <Zap className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Koop Credits voor Volumekorting</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Bespaar tot 40% op bulkfacturen met onze voordelige creditpakketten. 
            Perfecte oplossing voor bedrijven met hoge volumes.
          </p>
        </div>

        {/* Current pricing info */}
        <div className="bg-muted/30 rounded-lg p-4 mb-8 text-center">
          <p className="text-sm text-muted-foreground">
            <strong>Huidige prijs:</strong> €0,20 per factuur • 
            <strong className="text-primary ml-2">Met volumekorting:</strong> vanaf €0,12 per factuur
          </p>
        </div>

        {/* Credit packages */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {creditPackages.map((pkg) => (
            <Card 
              key={pkg.id} 
              className={`relative ${pkg.popular ? 'ring-2 ring-primary shadow-lg scale-105' : ''}`}
            >
              {pkg.popular && (
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Meest Populair
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold">
                  {pkg.invoices.toLocaleString()}
                </CardTitle>
                <CardDescription>facturen</CardDescription>
                
                <div className="mt-4">
                  <div className="text-3xl font-bold">€{pkg.price}</div>
                  <div className="text-sm text-muted-foreground">
                    €{pkg.pricePerInvoice.toFixed(3)} per factuur
                  </div>
                </div>
                
                <Badge variant="secondary" className="mt-2">
                  {pkg.discount}% korting
                </Badge>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success" />
                    <span>Geen vervaldatum</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success" />
                    <span>Directe activatie</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success" />
                    <span>Besparing: €{((0.20 - pkg.pricePerInvoice) * pkg.invoices).toFixed(0)}</span>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter>
                <Button
                  className="w-full gap-2"
                  onClick={() => handlePurchase(pkg)}
                  disabled={purchasingPackage === pkg.id}
                  variant={pkg.popular ? "default" : "outline"}
                >
                  {purchasingPackage === pkg.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Verwerken...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Nu kopen
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Additional info */}
        <div className="mt-12 bg-card border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Veelgestelde vragen</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium mb-2">Hoe werkt het creditssysteem?</h4>
              <p className="text-muted-foreground">
                Credits worden automatisch gebruikt bij het verzenden van facturen. 
                Eén credit = één verzonden Peppol-factuur.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Vervallen credits?</h4>
              <p className="text-muted-foreground">
                Nee, credits hebben geen vervaldatum en blijven beschikbaar 
                zolang uw account actief is.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Welke betaalmethoden accepteren jullie?</h4>
              <p className="text-muted-foreground">
                Wij accepteren alle gangbare betaalmethoden via Stripe: 
                iDEAL, creditcard, bankoverschrijving.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Kan ik credits bijkopen?</h4>
              <p className="text-muted-foreground">
                Ja, u kunt altijd extra credits bijkopen. Deze worden 
                toegevoegd aan uw bestaande saldo.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/30 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>Facturen worden verzonden namens <strong>PepHub BV</strong> via het Peppol-netwerk</p>
            <p className="text-xs mt-1">Verwerking van gegevens volgens AVG/GDPR. Alle betalingen worden beveiligd verwerkt via Stripe.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Credits;