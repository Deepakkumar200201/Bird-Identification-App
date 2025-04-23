import { BirdIdentification, InsertBirdIdentification, User, type InsertUser, IdentificationResult, BirdSighting, InsertBirdSighting, SubscriptionPlan } from "@shared/schema";

// Stripe-related types
export interface StripeCustomerInfo {
  customerId: string;
  subscriptionId?: string;
}

// Daily identification limit check result
export interface DailyLimitCheckResult {
  withinLimit: boolean;
  current: number;
  limit: number;
}

// Modify the interface with any CRUD methods you might need
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  
  // Subscription methods
  updateUserSubscription(userId: number, plan: SubscriptionPlan, endDate?: Date): Promise<User>;
  updateStripeCustomerId(userId: number, customerId: string): Promise<User>;
  updateUserStripeInfo(userId: number, stripeInfo: StripeCustomerInfo): Promise<User>;
  
  // Usage limits methods
  checkDailyIdentificationLimit(userId: number): Promise<DailyLimitCheckResult>;
  incrementDailyIdentificationCount(userId: number): Promise<number>;
  resetDailyIdentificationCount(userId: number): Promise<void>;
  
  // Bird identification methods
  createIdentification(identification: InsertBirdIdentification): Promise<BirdIdentification>;
  getIdentification(id: number): Promise<BirdIdentification | undefined>;
  getRecentIdentifications(userId?: number, limit?: number): Promise<BirdIdentification[]>;
  getUserIdentificationCount(userId: number): Promise<number>;
  
  // Bird sightings methods
  createSighting(sighting: InsertBirdSighting): Promise<BirdSighting>;
  getSighting(id: number): Promise<BirdSighting | undefined>;
  getUserSightings(userId: number, limit?: number): Promise<BirdSighting[]>;
  updateSighting(id: number, updates: Partial<BirdSighting>): Promise<BirdSighting>;
  deleteSighting(id: number): Promise<boolean>;
  getUserSightingCount(userId: number): Promise<number>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private identifications: Map<number, BirdIdentification>;
  private sightings: Map<number, BirdSighting>;
  private userIdCounter: number;
  private identificationIdCounter: number;
  private sightingIdCounter: number;

  constructor() {
    this.users = new Map();
    this.identifications = new Map();
    this.sightings = new Map();
    this.userIdCounter = 1;
    this.identificationIdCounter = 1;
    this.sightingIdCounter = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { 
      ...insertUser, 
      id, 
      email: null,
      subscriptionPlan: 'free',
      subscriptionEndDate: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      dailyIdentificationsCount: 0,
      lastIdentificationDate: null,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Subscription methods
  async updateUserSubscription(userId: number, plan: SubscriptionPlan, endDate?: Date): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }
    
    const updates: Partial<User> = {
      subscriptionPlan: plan,
      subscriptionEndDate: endDate,
    };
    
    return this.updateUser(userId, updates);
  }

  async updateStripeCustomerId(userId: number, customerId: string): Promise<User> {
    return this.updateUser(userId, { stripeCustomerId: customerId });
  }

  async updateUserStripeInfo(userId: number, stripeInfo: StripeCustomerInfo): Promise<User> {
    return this.updateUser(userId, { 
      stripeCustomerId: stripeInfo.customerId,
      stripeSubscriptionId: stripeInfo.subscriptionId,
    });
  }

  // Usage limits methods
  async checkDailyIdentificationLimit(userId: number): Promise<DailyLimitCheckResult> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }
    
    const isNewDay = user.lastIdentificationDate ? 
      new Date().toDateString() !== new Date(user.lastIdentificationDate).toDateString() : 
      true;
    
    if (isNewDay) {
      await this.resetDailyIdentificationCount(userId);
      return { withinLimit: true, current: 0, limit: 5 };
    }
    
    const limit = user.subscriptionPlan === 'premium' ? Infinity : 5;
    const current = user.dailyIdentificationsCount || 0;
    
    return {
      withinLimit: current < limit,
      current,
      limit: limit === Infinity ? -1 : limit, // Using -1 to represent infinity in API responses
    };
  }

  async incrementDailyIdentificationCount(userId: number): Promise<number> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }
    
    const isNewDay = user.lastIdentificationDate ? 
      new Date().toDateString() !== new Date(user.lastIdentificationDate).toDateString() : 
      true;
    
    let count = isNewDay ? 1 : (user.dailyIdentificationsCount || 0) + 1;
    
    await this.updateUser(userId, {
      dailyIdentificationsCount: count,
      lastIdentificationDate: new Date(),
    });
    
    return count;
  }

  async resetDailyIdentificationCount(userId: number): Promise<void> {
    await this.updateUser(userId, {
      dailyIdentificationsCount: 0,
      lastIdentificationDate: new Date(),
    });
  }

  // Bird identification methods
  async createIdentification(insertIdentification: InsertBirdIdentification): Promise<BirdIdentification> {
    const id = this.identificationIdCounter++;
    const now = new Date();
    
    // If there's a user, increment their daily identification count
    if (insertIdentification.userId) {
      await this.incrementDailyIdentificationCount(insertIdentification.userId);
    }
    
    const identification: BirdIdentification = {
      id,
      userId: insertIdentification.userId || null,
      imageUrl: insertIdentification.imageUrl,
      result: insertIdentification.result,
      identifiedAt: now,
    };
    
    this.identifications.set(id, identification);
    return identification;
  }

  async getIdentification(id: number): Promise<BirdIdentification | undefined> {
    return this.identifications.get(id);
  }

  async getRecentIdentifications(userId?: number, limit: number = 10): Promise<BirdIdentification[]> {
    let identifications = Array.from(this.identifications.values());
    
    // Filter by userId if provided
    if (userId !== undefined) {
      identifications = identifications.filter(id => id.userId === userId);
      
      // If there's a user, check their subscription and apply the history limit
      const user = await this.getUser(userId);
      if (user) {
        const historyLimit = user.subscriptionPlan === 'premium' ? 30 : 3;
        limit = Math.min(limit, historyLimit);
      }
    }
    
    // Sort by identifiedAt in descending order (newest first)
    identifications.sort((a, b) => {
      return new Date(b.identifiedAt).getTime() - new Date(a.identifiedAt).getTime();
    });
    
    return identifications.slice(0, limit);
  }

  async getUserIdentificationCount(userId: number): Promise<number> {
    const identifications = Array.from(this.identifications.values());
    return identifications.filter(id => id.userId === userId).length;
  }

  // Bird sightings methods
  async createSighting(sighting: InsertBirdSighting): Promise<BirdSighting> {
    const id = this.sightingIdCounter++;
    const now = new Date();
    
    const newSighting: BirdSighting = {
      id,
      userId: sighting.userId,
      birdName: sighting.birdName,
      scientificName: sighting.scientificName || null,
      location: sighting.location || null,
      latitude: sighting.latitude || null,
      longitude: sighting.longitude || null,
      sightingDate: sighting.sightingDate || now,
      notes: sighting.notes || null,
      imageUrl: sighting.imageUrl || null,
      identificationId: sighting.identificationId || null,
      isOffline: sighting.isOffline || false,
    };
    
    this.sightings.set(id, newSighting);
    return newSighting;
  }

  async getSighting(id: number): Promise<BirdSighting | undefined> {
    return this.sightings.get(id);
  }

  async getUserSightings(userId: number, limit?: number): Promise<BirdSighting[]> {
    // Check user's subscription to apply limit
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }
    
    // Apply limit based on subscription plan
    const maxAllowed = user.subscriptionPlan === 'premium' ? Infinity : 10;
    
    const sightings = Array.from(this.sightings.values())
      .filter(s => s.userId === userId)
      .sort((a, b) => new Date(b.sightingDate).getTime() - new Date(a.sightingDate).getTime());
    
    const effectiveLimit = limit === undefined ? maxAllowed : Math.min(limit, maxAllowed);
    return sightings.slice(0, effectiveLimit === Infinity ? sightings.length : effectiveLimit);
  }

  async updateSighting(id: number, updates: Partial<BirdSighting>): Promise<BirdSighting> {
    const sighting = this.sightings.get(id);
    if (!sighting) {
      throw new Error(`Sighting with id ${id} not found`);
    }
    
    const updatedSighting = { ...sighting, ...updates };
    this.sightings.set(id, updatedSighting);
    return updatedSighting;
  }

  async deleteSighting(id: number): Promise<boolean> {
    if (!this.sightings.has(id)) {
      return false;
    }
    
    return this.sightings.delete(id);
  }

  async getUserSightingCount(userId: number): Promise<number> {
    const sightings = Array.from(this.sightings.values());
    return sightings.filter(s => s.userId === userId).length;
  }
}

export const storage = new MemStorage();
