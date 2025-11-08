import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Zap, Crown, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
  reason?: string;
  currentUsage?: number;
  limit?: number;
  type?: 'limit' | 'feature';
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  isOpen,
  onClose,
  feature,
  reason,
  currentUsage,
  limit,
  type = 'limit',
}) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate('/subscription?tab=plans');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-600" />
            Upgrade Required
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Alert */}
          <Alert className="bg-orange-50 border-orange-200">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              {type === 'limit' ? (
                <div>
                  <strong>Limit Reached!</strong>
                  <p className="mt-1">{reason || 'You have reached the limit for your current plan.'}</p>
                </div>
              ) : (
                <div>
                  <strong>Feature Unavailable</strong>
                  <p className="mt-1">
                    {feature || 'This feature'} is not available in your current plan.
                  </p>
                </div>
              )}
            </AlertDescription>
          </Alert>

          {/* Usage Display */}
          {currentUsage !== undefined && limit !== undefined && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Current Usage</span>
                <Badge variant="destructive">
                  {currentUsage} / {limit}
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((currentUsage / limit) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Benefits */}
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-600" />
              Upgrade to unlock:
            </h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {type === 'limit' ? (
                <>
                  <li className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    Higher limits or unlimited access
                  </li>
                  <li className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    More features and capabilities
                  </li>
                  <li className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    Priority support
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    Access to {feature || 'this feature'}
                  </li>
                  <li className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    All premium features
                  </li>
                  <li className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    Enhanced capabilities
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Maybe Later
            </Button>
            <Button onClick={handleUpgrade} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Crown className="h-4 w-4 mr-2" />
              View Plans
            </Button>
          </div>

          {/* Footer */}
          <p className="text-xs text-center text-muted-foreground">
            Upgrade anytime with instant activation
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Inline upgrade alert (for smaller prompts)
export const InlineUpgradeAlert: React.FC<{
  message: string;
  onUpgrade: () => void;
}> = ({ message, onUpgrade }) => {
  return (
    <Alert className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
      <Crown className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        <Button size="sm" onClick={onUpgrade} className="ml-4">
          <Zap className="h-3 w-3 mr-1" />
          Upgrade
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default UpgradePrompt;
