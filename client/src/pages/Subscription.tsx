import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SubscriptionPlans } from '@/components/SubscriptionPlans';
import { SubscriptionStatus } from '@/components/SubscriptionStatus';
import { useLocation } from 'wouter';

export default function Subscription() {
  // For demo purposes, use a mock user ID
  // In a real app, this would come from authentication
  const userId = 1; 
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('status');
  
  const handleUpgradeClick = () => {
    setActiveTab('plans');
  };
  
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Subscription</h1>
        <p className="text-muted-foreground">Manage your BirdLens subscription plan and usage</p>
      </div>
      
      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="status">Status & Usage</TabsTrigger>
          <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
        </TabsList>
        
        <TabsContent value="status" className="space-y-6">
          <SubscriptionStatus userId={userId} onUpgradeClick={handleUpgradeClick} />
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Usage Guidelines</h3>
            <p className="text-sm text-muted-foreground">
              The Free plan provides basic access to the bird identification features with limited usage.
              Upgrade to Premium for unlimited identifications, offline access, and comprehensive bird information.
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Support</h3>
            <p className="text-sm text-muted-foreground">
              Need help with your subscription? Contact our support team at support@birdlens.com
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="plans">
          <SubscriptionPlans />
        </TabsContent>
      </Tabs>
    </div>
  );
}