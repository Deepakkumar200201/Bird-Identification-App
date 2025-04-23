import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from 'wouter';

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY as string);

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/subscription',
        },
      });
      
      if (error) {
        toast({
          title: 'Payment Failed',
          description: error.message || 'An error occurred while processing your payment.',
          variant: 'destructive',
        });
      } else {
        // For demo, show success and redirect
        toast({
          title: 'Payment Successful',
          description: 'Your premium subscription has been activated!',
        });
        setLocation('/subscription');
      }
    } catch (error: any) {
      toast({
        title: 'Payment Error',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <PaymentElement />
      </div>
      <Button 
        type="submit" 
        className="w-full"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? 'Processing...' : 'Subscribe Now'}
      </Button>
    </form>
  );
}

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // Create payment intent when the page loads
    const createSubscription = async () => {
      try {
        const response = await apiRequest('POST', '/api/create-subscription', {});
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error: any) {
        toast({
          title: 'Error',
          description: 'Could not initialize payment. Please try again.',
          variant: 'destructive',
        });
        // Redirect back to subscription page
        setLocation('/subscription');
      }
    };
    
    createSubscription();
  }, [toast, setLocation]);
  
  if (!clientSecret) {
    return (
      <div className="container max-w-lg mx-auto py-16 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
    },
  };
  
  return (
    <div className="container max-w-lg mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Complete Your Subscription</CardTitle>
          <CardDescription>
            Subscribe to BirdLens Premium for $2.99/month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Elements stripe={stripePromise} options={options}>
            <CheckoutForm />
          </Elements>
        </CardContent>
        <CardFooter className="flex-col space-y-4">
          <div className="text-sm text-muted-foreground">
            Your subscription will automatically renew each month. You can cancel anytime from your subscription page.
          </div>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => setLocation('/subscription')}
          >
            Return to Subscription
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}