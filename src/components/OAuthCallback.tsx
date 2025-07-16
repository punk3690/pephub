import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hubspotService } from '@/services/hubspotService';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle } from 'lucide-react';

export function OAuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        if (error) {
          setStatus('error');
          setErrorMessage(errorDescription || 'Autorisatie geannuleerd');
          toast.error('Autorisatie mislukt');
          return;
        }

        if (!code) {
          setStatus('error');
          setErrorMessage('Geen autorisatiecode ontvangen');
          toast.error('Ongeldige autorisatie-callback');
          return;
        }

        // Exchange code for access token
        const success = await hubspotService.authenticate(code);
        
        if (success) {
          setStatus('success');
          toast.success('Succesvol geautoriseerd met HubSpot!');
          
          // Redirect to main app after short delay
          setTimeout(() => {
            navigate('/');
          }, 2000);
        } else {
          setStatus('error');
          setErrorMessage('Kon toegangstoken niet ophalen');
          toast.error('Autorisatie mislukt');
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setErrorMessage('Onbekende fout bij autorisatie');
        toast.error('Autorisatie mislukt');
      }
    };

    handleOAuthCallback();
  }, [navigate]);

  const handleRetry = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {status === 'processing' && 'Autorisatie verwerken...'}
              {status === 'success' && 'Autorisatie Succesvol'}
              {status === 'error' && 'Autorisatie Mislukt'}
            </CardTitle>
            <CardDescription className="text-center">
              {status === 'processing' && 'Je autorisatie wordt verwerkt, even geduld...'}
              {status === 'success' && 'Je wordt doorgestuurd naar de app...'}
              {status === 'error' && 'Er ging iets mis tijdens de autorisatie'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {status === 'processing' && (
              <div className="flex items-center justify-center">
                <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
              </div>
            )}
            
            {status === 'success' && (
              <div className="flex items-center justify-center text-success">
                <CheckCircle className="h-12 w-12" />
              </div>
            )}
            
            {status === 'error' && (
              <div className="space-y-4">
                <div className="flex items-center justify-center text-destructive">
                  <AlertCircle className="h-12 w-12" />
                </div>
                <p className="text-sm text-muted-foreground">{errorMessage}</p>
                <button
                  onClick={handleRetry}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md transition-colors"
                >
                  Opnieuw proberen
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}