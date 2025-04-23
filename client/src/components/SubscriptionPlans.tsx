import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Badge } from '@/components/ui/badge';
import { CheckIcon, XIcon } from 'lucide-react';
import { SubscriptionPlan } from '../../../shared/schema';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionFeature {
  name: string;
  value: string | boolean;
  included: boolean;
}

interface SubscriptionPlanCardProps {
  plan: {
    id: string;
    name: string;
    price: number;
    limits: {
      identifications: {
        perDay: number;
        history: number;
      };
      sightings: {
        total: number;
      };
      birdDatabase: {
        fullAccess: boolean;
        offlineAccess: boolean;
        detailedInfo: boolean;
      };
    };
  };
  currentPlan?: string;
  isLoading?: boolean;
  onSelectPlan: (id: string) => void;
}

function SubscriptionPlanCard({ plan, currentPlan, isLoading, onSelectPlan }: SubscriptionPlanCardProps) {
  const isCurrent = plan.id === currentPlan;
  
  // Format features for display
  const features: SubscriptionFeature[] = [
    { 
      name: 'Identifications per day', 
      value: plan.limits.identifications.perDay === -1 ? 'Unlimited' : `${plan.limits.identifications.perDay}`, 
      included: true 
    },
    { 
      name: 'Identification history', 
      value: `${plan.limits.identifications.history === -1 ? 'Unlimited' : plan.limits.identifications.history} entries`, 
      included: true 
    },
    { 
      name: 'Saved sightings', 
      value: plan.limits.sightings.total === -1 ? 'Unlimited' : `${plan.limits.sightings.total}`, 
      included: true 
    },
    { 
      name: 'Full bird database access', 
      value: plan.limits.birdDatabase.fullAccess, 
      included: plan.limits.birdDatabase.fullAccess 
    },
    { 
      name: 'Offline access', 
      value: plan.limits.birdDatabase.offlineAccess, 
      included: plan.limits.birdDatabase.offlineAccess 
    },
    { 
      name: 'Detailed bird information', 
      value: plan.limits.birdDatabase.detailedInfo, 
      included: plan.limits.birdDatabase.detailedInfo 
    },
  ];

  return (
    <Card className={`w-full ${isCurrent ? 'border-primary' : ''} flex flex-col`}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
          {isCurrent && <Badge variant="outline" className="bg-primary text-primary-foreground">Current</Badge>}
        </div>
        <CardDescription>
          {plan.price === 0 ? (
            <span className="text-lg">Free</span>
          ) : (
            <span className="text-lg">${plan.price.toFixed(2)}<span className="text-sm text-muted-foreground">/month</span></span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              {feature.included ? (
                <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
              ) : (
                <XIcon className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
              )}
              <span className="text-sm">
                {feature.name}
                {typeof feature.value === 'string' && feature.included && (
                  <span className="text-muted-foreground ml-1">({feature.value})</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          variant={isCurrent ? "outline" : "default"}
          onClick={() => onSelectPlan(plan.id)}
          disabled={isLoading || isCurrent}
        >
          {isCurrent ? 'Current Plan' : `Upgrade to ${plan.name}`}
        </Button>
      </CardFooter>
    </Card>
  );
}

export function SubscriptionPlans() {
  const { toast } = useToast();
  
  const { data: plans, isLoading: isLoadingPlans } = useQuery({
    queryKey: ['/api/subscription/plans'],
    retry: 2,
  });
  
  const { data: userSubscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ['/api/subscription'],
    retry: 1,
  });
  
  const updateMutation = useMutation({
    mutationFn: (plan: string) => {
      return apiRequest('POST', '/api/subscription/update', { plan });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription'] });
      toast({
        title: 'Subscription updated',
        description: 'Your subscription plan has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating subscription',
        description: error.message || 'There was an error updating your subscription. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  const stripeSubscribeMutation = useMutation({
    mutationFn: () => {
      return apiRequest('POST', '/api/create-subscription');
    },
    onSuccess: (data) => {
      // Redirect to the checkout page with the client secret
      // This would normally handle Stripe payment, but for demo we'll use the free update method
      console.log('Stripe subscription created:', data);
      toast({
        title: 'Processing payment',
        description: 'You will be redirected to complete your payment.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error creating subscription',
        description: error.message || 'There was an error setting up your subscription. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  const handleSelectPlan = (planId: string) => {
    // For demo purposes, directly update without Stripe payment
    updateMutation.mutate(planId);
    
    // In a real app, would use Stripe payment flow:
    // if (planId === 'premium') {
    //   stripeSubscribeMutation.mutate();
    // } else {
    //   updateMutation.mutate(planId);
    // }
  };
  
  const isLoading = isLoadingPlans || isLoadingSubscription || updateMutation.isPending || stripeSubscribeMutation.isPending;
  
  if (isLoadingPlans || isLoadingSubscription) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p>Loading subscription plans...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Subscription Plans</h2>
        <p className="text-muted-foreground">Choose the plan that works best for you</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        {plans?.map((plan: any) => (
          <SubscriptionPlanCard
            key={plan.id}
            plan={plan}
            currentPlan={userSubscription?.plan}
            isLoading={isLoading}
            onSelectPlan={handleSelectPlan}
          />
        ))}
      </div>
      
      {userSubscription?.plan === 'premium' && userSubscription?.endDate && (
        <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm">
            Your premium subscription is active until {new Date(userSubscription.endDate).toLocaleDateString()}.
          </p>
        </div>
      )}
    </div>
  );
}