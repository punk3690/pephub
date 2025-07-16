import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ExternalLink, Key, Shield, Zap } from 'lucide-react';
import { hubspotService } from '@/services/hubspotService';
import { toast } from 'sonner';

interface AuthSetupProps {
  onAuthComplete: () => void;
}

export function AuthSetup({ onAuthComplete }: AuthSetupProps) {
  const [authenticating, setAuthenticating] = useState(false);
  const [authStep, setAuthStep] = useState<'initial' | 'authorizing' | 'complete'>('initial');

  // Check for OAuth callback on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('code');
    const error = urlParams.get('error');
    
    if (error) {
      toast.error('Autorisatie geannuleerd of mislukt');
      return;
    }
    
    if (authCode) {
      setAuthStep('authorizing');
      handleAuthenticate();
    }
  }, []);

  const handleAuthenticate = async () => {
    setAuthenticating(true);
    setAuthStep('authorizing');
    
    try {
      // Check if we have an authorization code from OAuth callback
      const urlParams = new URLSearchParams(window.location.search);
      const authCode = urlParams.get('code');
      
      if (authCode) {
        // We have an auth code, exchange it for access token
        const success = await hubspotService.authenticate(authCode);
        if (success) {
          setAuthStep('complete');
          toast.success('Succesvol geautoriseerd met HubSpot!');
          // Clear the URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
          setTimeout(() => {
            onAuthComplete();
          }, 1500);
        } else {
          throw new Error('Autorisatie mislukt');
        }
      } else {
        // No auth code, redirect to HubSpot OAuth
        toast.info('Je wordt doorgestuurd naar HubSpot voor autorisatie...');
        // This will redirect to HubSpot OAuth
        await hubspotService.authenticate();
      }
    } catch (error) {
      console.error('Autorisatie fout:', error);
      toast.error('Fout bij autorisatie. Probeer opnieuw.');
      setAuthStep('initial');
    } finally {
      setAuthenticating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary-glow rounded-full">
          <Zap className="h-8 w-8 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">HubSpot Peppol Integratie</h1>
          <p className="text-muted-foreground">
            Verzend facturen automatisch via het Peppol-netwerk
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Autorisatie Vereist
          </CardTitle>
          <CardDescription>
            Geef de app toegang tot je HubSpot-gegevens om facturen te kunnen verzenden
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Required permissions */}
          <div>
            <h3 className="font-medium mb-3">Vereiste Toegangsrechten:</h3>
            <div className="space-y-2">
              {[
                { name: 'Deals lezen', description: 'Om factuurgegevens op te halen uit deals' },
                { name: 'Bedrijven lezen', description: 'Voor klantgegevens en Peppol ID\'s' },
                { name: 'Contacten lezen', description: 'Voor factuuradressering' },
                { name: 'Custom objecten lezen', description: 'Voor factuur custom objecten (optioneel)' }
              ].map((permission, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-success mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{permission.name}</div>
                    <div className="text-xs text-muted-foreground">{permission.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security info */}
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-start gap-3">
              <Key className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium text-sm mb-1">Veilige Verbinding</h4>
                <p className="text-xs text-muted-foreground">
                  Alle gegevens worden veilig uitgewisseld via OAuth2. 
                  Jouw HubSpot-gegevens blijven privé en beveiligd.
                </p>
              </div>
            </div>
          </div>

          {/* Company info */}
          <div className="p-4 bg-muted/30 rounded-lg border-l-4 border-l-primary">
            <p className="text-sm text-muted-foreground">
              <strong>Let op:</strong> Alle Peppol-facturen worden verzonden namens 
              <Badge variant="outline" className="mx-1">PepHub BV</Badge>
              via onze centrale Recommand API-integratie.
            </p>
          </div>

          {/* Auth button */}
          <div className="flex justify-center pt-4">
            {authStep === 'initial' && (
              <Button
                onClick={handleAuthenticate}
                disabled={authenticating}
                size="lg"
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Autoriseer met HubSpot
              </Button>
            )}
            
            {authStep === 'authorizing' && (
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 text-muted-foreground">
                  <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                  Autorisatie verwerken...
                </div>
                <p className="text-xs text-muted-foreground">
                  Je wordt doorgestuurd naar HubSpot voor autorisatie
                </p>
              </div>
            )}
            
            {authStep === 'complete' && (
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 text-success">
                  <CheckCircle className="h-5 w-5" />
                  Autorisatie succesvol!
                </div>
                <p className="text-xs text-muted-foreground">
                  App wordt geladen...
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}