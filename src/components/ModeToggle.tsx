import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Users, User } from 'lucide-react';

interface ModeToggleProps {
  isBulkMode: boolean;
  onModeChange: (isBulk: boolean) => void;
}

export const ModeToggle = ({ isBulkMode, onModeChange }: ModeToggleProps) => {
  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="mode-toggle" className="text-sm font-medium">
            Standaard verzender
          </Label>
        </div>
        
        <Switch
          id="mode-toggle"
          checked={isBulkMode}
          onCheckedChange={onModeChange}
          className="data-[state=checked]:bg-primary"
        />
        
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="mode-toggle" className="text-sm font-medium">
            Bulk verzender
          </Label>
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground text-center mt-2">
        {isBulkMode 
          ? "Verzend meerdere facturen tegelijk voor maximale efficiëntie"
          : "Verzend facturen individueel voor volledige controle"
        }
      </p>
    </Card>
  );
};