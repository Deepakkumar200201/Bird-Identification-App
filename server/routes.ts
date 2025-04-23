import type { Express, Request as ExpressRequest, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage, DailyLimitCheckResult } from "./storage";
import multer from "multer";
import { identifyBirdWithGemini } from "./gemini";
import { IdentificationResult, identificationResultSchema, subscriptionPlans, SubscriptionPlan, subscriptionLimitsMap } from "@shared/schema";
import { z } from "zod";
import Stripe from "stripe";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("STRIPE_SECRET_KEY is not set. Subscription features will not work correctly.");
}

const stripe = process.env.STRIPE_SECRET_KEY ? 
  new Stripe(process.env.STRIPE_SECRET_KEY) : 
  null;

// Create a custom Request type with file property
interface Request extends ExpressRequest {
  file?: Express.Multer.File;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // API route for bird identification with base64 image
  app.post("/api/identify", async (req, res) => {
    try {
      // Validate request body
      const { image, source } = z.object({
        image: z.string().min(1),
        source: z.enum(["camera", "upload"]),
      }).parse(req.body);

      // Extract the base64 data (remove metadata prefix if present)
      let imageData = image;
      const dataUrlPattern = /^data:image\/\w+;base64,/;
      
      if (dataUrlPattern.test(imageData)) {
        const commaIndex = imageData.indexOf(",");
        if (commaIndex !== -1) {
          imageData = imageData.substring(commaIndex + 1);
        }
      }

      // Identify the bird using Gemini AI
      try {
        const result = await identifyBirdWithGemini(imageData);
        
        // Store the identification result
        await storage.createIdentification({
          imageUrl: `data:image/jpeg;base64,${imageData.slice(0, 30)}...`, // Store a truncated reference
          result: result,
          userId: null
        });
        
        // Return the identification result
        return res.json(result);
      } catch (geminiError: any) {
        console.error("Gemini API error:", geminiError);
        return res.status(500).json({ 
          message: "Failed to identify bird",
          error: geminiError.message || "Unknown error occurred during identification"
        });
      }
    } catch (error) {
      console.error("Error identifying bird:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to identify bird" });
    }
  });

  // API route for file upload
  app.post("/api/upload", upload.single("image"), async (req: Request, res) => {
    try {
      // Check if file is present
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Get file details
      const fileType = req.file.mimetype || 'image/jpeg';
      
      // Convert file buffer to base64
      const base64Image = req.file.buffer.toString("base64");

      // Identify the bird using Gemini AI
      try {
        const result = await identifyBirdWithGemini(base64Image);
        
        // Store the identification result
        await storage.createIdentification({
          imageUrl: `data:${fileType};base64,${base64Image.slice(0, 30)}...`, // Store a truncated reference
          result: result,
          userId: null
        });
        
        // Return the identification result
        return res.json(result);
      } catch (geminiError: any) {
        console.error("Gemini API error:", geminiError);
        return res.status(500).json({ 
          message: "Failed to identify bird",
          error: geminiError.message || "Unknown error occurred during identification"
        });
      }
    } catch (error) {
      console.error("Error processing uploaded image:", error);
      return res.status(500).json({ 
        message: "Failed to process image",
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // API route to retrieve recent identifications
  app.get("/api/identifications", async (req, res) => {
    try {
      // Get userId from query parameter if provided
      const userId = req.query.userId ? Number(req.query.userId) : undefined;
      const recentIdentifications = await storage.getRecentIdentifications(userId);
      return res.json(recentIdentifications);
    } catch (error) {
      console.error("Error retrieving identifications:", error);
      return res.status(500).json({ message: "Failed to retrieve identifications" });
    }
  });

  // Authentication middleware (simple version for demo purposes)
  const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    // For simplicity in a demo, we'll use a query param or header for user ID
    const userId = req.headers['x-user-id'] || req.query.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const user = await storage.getUser(Number(userId));
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Attach user to request for downstream handlers
      (req as any).user = user;
      next();
    } catch (error) {
      console.error("Authentication error:", error);
      return res.status(500).json({ message: "Authentication error" });
    }
  };
  
  // API route to check daily identification limit
  app.get("/api/subscription/daily-limit", authenticate, async (req: Request, res) => {
    try {
      const user = (req as any).user;
      const result = await storage.checkDailyIdentificationLimit(user.id);
      return res.json(result);
    } catch (error) {
      console.error("Error checking daily limit:", error);
      return res.status(500).json({ message: "Failed to check daily limit" });
    }
  });
  
  // API route to get subscription plans info
  app.get("/api/subscription/plans", async (req, res) => {
    try {
      const plans = Object.keys(subscriptionPlans).map(key => {
        const planId = subscriptionPlans[key as keyof typeof subscriptionPlans];
        const limits = subscriptionLimitsMap[planId];
        
        return {
          id: planId,
          name: key.charAt(0) + key.slice(1).toLowerCase(),
          price: planId === 'premium' ? 2.99 : 0,
          limits: {
            ...limits,
            // Convert Infinity to -1 for JSON serialization
            identifications: {
              ...limits.identifications,
              perDay: limits.identifications.perDay === Infinity ? -1 : limits.identifications.perDay,
              history: limits.identifications.history === Infinity ? -1 : limits.identifications.history,
            },
            sightings: {
              ...limits.sightings,
              total: limits.sightings.total === Infinity ? -1 : limits.sightings.total,
            }
          }
        };
      });
      
      return res.json(plans);
    } catch (error) {
      console.error("Error getting subscription plans:", error);
      return res.status(500).json({ message: "Failed to get subscription plans" });
    }
  });
  
  // API route to get user subscription
  app.get("/api/subscription", authenticate, async (req: Request, res) => {
    try {
      const user = (req as any).user;
      
      return res.json({
        plan: user.subscriptionPlan,
        endDate: user.subscriptionEndDate,
        stripeCustomerId: user.stripeCustomerId,
        stripeSubscriptionId: user.stripeSubscriptionId,
        limits: subscriptionLimitsMap[user.subscriptionPlan as SubscriptionPlan],
      });
    } catch (error) {
      console.error("Error getting user subscription:", error);
      return res.status(500).json({ message: "Failed to get user subscription" });
    }
  });
  
  // API route to update subscription (for testing/demo purposes)
  app.post("/api/subscription/update", authenticate, async (req: Request, res) => {
    try {
      const user = (req as any).user;
      const { plan } = z.object({
        plan: z.enum([subscriptionPlans.FREE, subscriptionPlans.PREMIUM]),
      }).parse(req.body);
      
      // For demo, instantly update the subscription without payment
      const endDate = plan === subscriptionPlans.PREMIUM ? 
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : // 30 days from now
        undefined;
      
      const updatedUser = await storage.updateUserSubscription(user.id, plan, endDate);
      
      return res.json({
        plan: updatedUser.subscriptionPlan,
        endDate: updatedUser.subscriptionEndDate,
        limits: subscriptionLimitsMap[updatedUser.subscriptionPlan as SubscriptionPlan],
      });
    } catch (error) {
      console.error("Error updating subscription:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid subscription plan", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to update subscription" });
    }
  });
  
  // Stripe-related endpoints
  if (stripe) {
    // Create Stripe payment intent for subscription
    app.post("/api/create-subscription", authenticate, async (req: Request, res) => {
      try {
        const user = (req as any).user;
        
        // Check if user already has a Stripe customer ID
        let customerId = user.stripeCustomerId;
        
        if (!customerId) {
          // Create a new customer in Stripe
          const customer = await stripe.customers.create({
            name: user.username,
            metadata: {
              userId: user.id.toString(),
            },
          });
          
          customerId = customer.id;
          await storage.updateStripeCustomerId(user.id, customerId);
        }
        
        // Create a subscription
        const subscription = await stripe.subscriptions.create({
          customer: customerId,
          items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: 'BirdLens Premium',
                  description: 'Monthly subscription to BirdLens Premium',
                },
                unit_amount: 299, // $2.99
                recurring: {
                  interval: 'month',
                },
              },
            },
          ],
          payment_behavior: 'default_incomplete',
          expand: ['latest_invoice.payment_intent'],
        });
        
        // Save the subscription ID to the user
        await storage.updateUserStripeInfo(user.id, {
          customerId,
          subscriptionId: subscription.id,
        });
        
        // Return the client secret for the payment intent
        const latestInvoice = subscription.latest_invoice as any;
        const clientSecret = latestInvoice?.payment_intent?.client_secret;
        
        return res.json({
          subscriptionId: subscription.id,
          clientSecret,
        });
      } catch (error) {
        console.error("Error creating subscription:", error);
        return res.status(500).json({ message: "Failed to create subscription" });
      }
    });
    
    // Handle Stripe webhook for subscription events
    app.post("/api/webhook", async (req, res) => {
      const sig = req.headers['stripe-signature'] as string;
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      let event;
      
      try {
        if (!endpointSecret) {
          // For demo purposes, parse the raw body directly if no webhook secret
          event = req.body;
        } else {
          // Verify webhook signature
          event = stripe.webhooks.constructEvent(
            (req as any).rawBody, 
            sig, 
            endpointSecret
          );
        }
        
        // Handle the event
        switch (event.type) {
          case 'invoice.payment_succeeded':
            // Payment successful, update subscription status
            const invoice = event.data.object;
            if (invoice.subscription) {
              const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
              
              // Find user by customer ID
              const user = Array.from((storage as any).users.values()).find(
                (u: any) => u.stripeCustomerId === invoice.customer
              );
              
              if (user) {
                // Calculate end date based on subscription period
                const endDate = new Date(subscription.current_period_end * 1000);
                
                // Update user subscription
                await storage.updateUserSubscription(user.id, subscriptionPlans.PREMIUM, endDate);
              }
            }
            break;
            
          case 'customer.subscription.updated':
            // Subscription updated
            const updatedSubscription = event.data.object;
            // Handle status changes, etc.
            break;
            
          case 'customer.subscription.deleted':
            // Subscription canceled or expired
            const deletedSubscription = event.data.object;
            // Find user by customer ID
            const userToDowngrade = Array.from((storage as any).users.values()).find(
              (u: any) => u.stripeCustomerId === deletedSubscription.customer
            );
            
            if (userToDowngrade) {
              // Downgrade to free plan
              await storage.updateUserSubscription(userToDowngrade.id, subscriptionPlans.FREE);
            }
            break;
            
          default:
            console.log(`Unhandled event type ${event.type}`);
        }
        
        return res.json({ received: true });
      } catch (error) {
        console.error('Webhook error:', error);
        return res.status(400).send(`Webhook Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  }
  
  // Bird sightings endpoints
  app.post("/api/sightings", authenticate, async (req: Request, res) => {
    try {
      const user = (req as any).user;
      
      // Check if user has reached their sighting limit
      const sightingCount = await storage.getUserSightingCount(user.id);
      const plan = user.subscriptionPlan as SubscriptionPlan;
      const sightingLimit = subscriptionLimitsMap[plan].sightings.total;
      
      if (sightingLimit !== Infinity && sightingCount >= sightingLimit) {
        return res.status(403).json({ 
          message: "Sighting limit reached", 
          sightingCount,
          sightingLimit,
          upgradeRequired: true
        });
      }
      
      // Validate request body
      const sightingData = z.object({
        birdName: z.string().min(1),
        scientificName: z.string().optional(),
        location: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        notes: z.string().optional(),
        imageUrl: z.string().optional(),
        identificationId: z.number().optional(),
        isOffline: z.boolean().optional(),
      }).parse(req.body);
      
      // Create sighting
      const sighting = await storage.createSighting({
        ...sightingData,
        userId: user.id,
        sightingDate: new Date(),
      });
      
      return res.status(201).json(sighting);
    } catch (error) {
      console.error("Error creating sighting:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid sighting data", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to create sighting" });
    }
  });
  
  app.get("/api/sightings", authenticate, async (req: Request, res) => {
    try {
      const user = (req as any).user;
      const sightings = await storage.getUserSightings(user.id);
      return res.json(sightings);
    } catch (error) {
      console.error("Error retrieving sightings:", error);
      return res.status(500).json({ message: "Failed to retrieve sightings" });
    }
  });

  app.get("/api/sightings/:id", authenticate, async (req: Request, res) => {
    try {
      const sightingId = Number(req.params.id);
      const sighting = await storage.getSighting(sightingId);
      
      if (!sighting) {
        return res.status(404).json({ message: "Sighting not found" });
      }
      
      // Check if the sighting belongs to the authenticated user
      const user = (req as any).user;
      if (sighting.userId !== user.id) {
        return res.status(403).json({ message: "Unauthorized access to sighting" });
      }
      
      return res.json(sighting);
    } catch (error) {
      console.error("Error retrieving sighting:", error);
      return res.status(500).json({ message: "Failed to retrieve sighting" });
    }
  });
  
  app.put("/api/sightings/:id", authenticate, async (req: Request, res) => {
    try {
      const sightingId = Number(req.params.id);
      const sighting = await storage.getSighting(sightingId);
      
      if (!sighting) {
        return res.status(404).json({ message: "Sighting not found" });
      }
      
      // Check if the sighting belongs to the authenticated user
      const user = (req as any).user;
      if (sighting.userId !== user.id) {
        return res.status(403).json({ message: "Unauthorized access to sighting" });
      }
      
      // Validate request body
      const updateData = z.object({
        birdName: z.string().min(1).optional(),
        scientificName: z.string().optional(),
        location: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        notes: z.string().optional(),
        imageUrl: z.string().optional(),
        sightingDate: z.date().optional(),
        isOffline: z.boolean().optional(),
      }).parse(req.body);
      
      // Update sighting
      const updatedSighting = await storage.updateSighting(sightingId, updateData);
      
      return res.json(updatedSighting);
    } catch (error) {
      console.error("Error updating sighting:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid sighting data", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to update sighting" });
    }
  });
  
  app.delete("/api/sightings/:id", authenticate, async (req: Request, res) => {
    try {
      const sightingId = Number(req.params.id);
      const sighting = await storage.getSighting(sightingId);
      
      if (!sighting) {
        return res.status(404).json({ message: "Sighting not found" });
      }
      
      // Check if the sighting belongs to the authenticated user
      const user = (req as any).user;
      if (sighting.userId !== user.id) {
        return res.status(403).json({ message: "Unauthorized access to sighting" });
      }
      
      // Delete sighting
      const success = await storage.deleteSighting(sightingId);
      
      if (success) {
        return res.status(204).send();
      } else {
        return res.status(500).json({ message: "Failed to delete sighting" });
      }
    } catch (error) {
      console.error("Error deleting sighting:", error);
      return res.status(500).json({ message: "Failed to delete sighting" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
