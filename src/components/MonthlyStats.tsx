import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Euro, TrendingUp, Calendar } from 'lucide-react';

export function MonthlyStats() {
  const [monthlyStats, setMonthlyStats] = useState({
    invoicesSent: 127,
    totalCost: 25.40,
    pricePerInvoice: 0.20
  });

  const currentMonth = new Date().toLocaleDateString('nl-NL', { 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{monthlyStats.invoicesSent}</p>
                <p className="text-sm text-muted-foreground">facturen verzonden</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                <Euro className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">€{monthlyStats.totalCost.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">totale kosten</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-lg font-semibold">{currentMonth}</p>
                <p className="text-sm text-muted-foreground">huidige periode</p>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <Badge variant="outline" className="gap-1">
              <TrendingUp className="h-3 w-3" />
              €{monthlyStats.pricePerInvoice.toFixed(2)} per factuur
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              Kostenefficiënte Peppol-verzending
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}