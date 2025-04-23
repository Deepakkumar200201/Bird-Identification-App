import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { ArrowUpIcon, CameraIcon, CheckCircleIcon, ListIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

interface SubscriptionStatusProps {
  userId: number;
  onUpgradeClick: () => void;
}

export function SubscriptionStatus({ userId, onUpgradeClick }: SubscriptionStatusProps) {
  // Get user's subscription
  const { data: subscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ['/api/subscription'],
    retry: 1,
  });
  
  // Get daily identification usage
  const { data: dailyLimit, isLoading: isLoadingDaily } = useQuery({
    queryKey: ['/api/subscription/daily-limit'],
    retry: 1,
  });
  
  // Get identification count
  const { data: identifications, isLoading: isLoadingIds } = useQuery({
    queryKey: ['/api/identifications', { userId }],
    retry: 1,
  });
  
  // Get sightings count
  const { data: sightings, isLoading: isLoadingSightings } = useQuery({
    queryKey: ['/api/sightings'],
    retry: 1,
  });
  
  const isLoading = isLoadingSubscription || isLoadingDaily || isLoadingIds || isLoadingSightings;
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Calculate usage percentages
  const dailyPercentage = dailyLimit?.limit === -1 
    ? 0 
    : Math.min(100, (dailyLimit?.current / dailyLimit?.limit) * 100) || 0;
  
  const historyLimit = subscription?.limits?.identifications?.history || 0;
  const historyCount = identifications?.length || 0;
  const historyPercentage = historyLimit === -1 
    ? 0 
    : Math.min(100, (historyCount / historyLimit) * 100);
  
  const sightingsLimit = subscription?.limits?.sightings?.total || 0;
  const sightingsCount = sightings?.length || 0;
  const sightingsPercentage = sightingsLimit === -1 
    ? 0 
    : Math.min(100, (sightingsCount / sightingsLimit) * 100);
  
  // Check if user is premium
  const isPremium = subscription?.plan === 'premium';
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Subscription Status</CardTitle>
          <Badge 
            variant={isPremium ? "default" : "secondary"} 
            className={isPremium ? "bg-gradient-to-r from-amber-500 to-amber-300 hover:from-amber-600 hover:to-amber-400" : ""}
          >
            {isPremium ? "Premium" : "Free"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isPremium && (
          <div className="mb-4">
            <Button 
              onClick={onUpgradeClick} 
              variant="default" 
              className="w-full bg-gradient-to-r from-amber-500 to-amber-300 hover:from-amber-600 hover:to-amber-400"
            >
              <ArrowUpIcon className="mr-2 h-4 w-4" />
              Upgrade to Premium
            </Button>
          </div>
        )}
        
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center">
                <CameraIcon className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Daily Identifications</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {dailyLimit?.current || 0} / {dailyLimit?.limit === -1 ? '∞' : dailyLimit?.limit}
              </span>
            </div>
            <Progress value={dailyPercentage} className="h-2" />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center">
                <ListIcon className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Identification History</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {historyCount} / {historyLimit === -1 ? '∞' : historyLimit}
              </span>
            </div>
            <Progress value={historyPercentage} className="h-2" />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center">
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Saved Sightings</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {sightingsCount} / {sightingsLimit === -1 ? '∞' : sightingsLimit}
              </span>
            </div>
            <Progress value={sightingsPercentage} className="h-2" />
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Features</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className={`text-xs p-2 rounded ${isPremium ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-muted text-muted-foreground'}`}>
              Full Bird Database
            </div>
            <div className={`text-xs p-2 rounded ${isPremium ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-muted text-muted-foreground'}`}>
              Offline Access
            </div>
            <div className={`text-xs p-2 rounded ${isPremium ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-muted text-muted-foreground'}`}>
              Detailed Information
            </div>
            <div className={`text-xs p-2 rounded ${isPremium ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-muted text-muted-foreground'}`}>
              Priority Support
            </div>
          </div>
        </div>
        
        {subscription?.endDate && isPremium && (
          <div className="text-xs text-muted-foreground">
            Premium subscription active until: {new Date(subscription.endDate).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}