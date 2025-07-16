import { Shield, ExternalLink, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ComplianceFooterProps {
  companyName?: string;
}

export function ComplianceFooter({ companyName = "PepHub BV" }: ComplianceFooterProps) {
  return (
    <Card className="border-muted">
      <CardContent className="pt-4">
        <div className="flex items-start gap-3 text-sm">
          <Shield className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <p className="text-muted-foreground">
              <strong>Peppol-verzending via PepHub:</strong> Facturen worden namens {companyName} verzonden 
              via PepHub en het Recommand API-netwerk door het beveiligde Peppol-netwerk conform EU-wetgeving 
              voor elektronische facturering.
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <a 
                href="#" 
                className="flex items-center gap-1 hover:text-foreground transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  // In production, this would open the privacy policy
                  console.log('Open privacy policy');
                }}
              >
                <Info className="h-3 w-3" />
                AVG-beleid
                <ExternalLink className="h-3 w-3" />
              </a>
              <a 
                href="#" 
                className="flex items-center gap-1 hover:text-foreground transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  // In production, this would open compliance documentation
                  console.log('Open compliance docs');
                }}
              >
                <Shield className="h-3 w-3" />
                Compliance & Audit
                <ExternalLink className="h-3 w-3" />
              </a>
              <a 
                href="https://peppol.org" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <Info className="h-3 w-3" />
                Meer over Peppol
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <p className="text-xs text-muted-foreground">
              Alle verzendingen worden gelogd en bewaard voor audit-doeleinden. 
              Voor vragen over privacy en gegevensverwerking, neem contact op met support.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}