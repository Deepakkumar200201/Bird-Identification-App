import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const subscriptionPlans = {
  FREE: 'free',
  PREMIUM: 'premium',
} as const;

export type SubscriptionPlan = typeof subscriptionPlans[keyof typeof subscriptionPlans];

export interface SubscriptionLimits {
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
}

export const subscriptionLimitsMap: Record<SubscriptionPlan, SubscriptionLimits> = {
  [subscriptionPlans.FREE]: {
    identifications: {
      perDay: 5,
      history: 3,
    },
    sightings: {
      total: 10,
    },
    birdDatabase: {
      fullAccess: false,
      offlineAccess: false,
      detailedInfo: false,
    },
  },
  [subscriptionPlans.PREMIUM]: {
    identifications: {
      perDay: Infinity,
      history: 30,
    },
    sightings: {
      total: Infinity,
    },
    birdDatabase: {
      fullAccess: true,
      offlineAccess: true,
      detailedInfo: true,
    },
  },
};

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  subscriptionPlan: text("subscription_plan").default(subscriptionPlans.FREE).notNull(),
  subscriptionEndDate: timestamp("subscription_end_date"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  dailyIdentificationsCount: integer("daily_identifications_count").default(0),
  lastIdentificationDate: timestamp("last_identification_date"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const birdIdentifications = pgTable("bird_identifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  imageUrl: text("image_url").notNull(),
  identifiedAt: timestamp("identified_at").defaultNow().notNull(),
  result: jsonb("result").notNull(),
});

export const insertBirdIdentificationSchema = createInsertSchema(birdIdentifications).pick({
  userId: true,
  imageUrl: true,
  result: true,
});

export const birdSightings = pgTable("bird_sightings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  birdName: text("bird_name").notNull(),
  scientificName: text("scientific_name"),
  location: text("location"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  sightingDate: timestamp("sighting_date").defaultNow().notNull(),
  notes: text("notes"),
  imageUrl: text("image_url"),
  identificationId: integer("identification_id").references(() => birdIdentifications.id),
  isOffline: boolean("is_offline").default(false).notNull(),
});

export const insertBirdSightingSchema = createInsertSchema(birdSightings).pick({
  userId: true,
  birdName: true,
  scientificName: true,
  location: true,
  latitude: true,
  longitude: true,
  sightingDate: true,
  notes: true,
  imageUrl: true,
  identificationId: true,
  isOffline: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type BirdIdentification = typeof birdIdentifications.$inferSelect;
export type InsertBirdIdentification = z.infer<typeof insertBirdIdentificationSchema>;

export type BirdSighting = typeof birdSightings.$inferSelect;
export type InsertBirdSighting = z.infer<typeof insertBirdSightingSchema>;

export interface PhysicalCharacteristics {
  size?: string;
  weight?: string;
  wingspan?: string;
  plumage?: string;
  bill?: string;
  legs?: string;
  eyeColor?: string;
}

export interface HabitatAndRange {
  preferredHabitat?: string;
  geographicRange?: string;
  rangeMapUrl?: string;
}

export interface MigrationPatterns {
  migratory?: boolean;
  migrationSeason?: string;
  migrationRoute?: string;
  winteringGrounds?: string;
  breedingGrounds?: string;
}

export interface SeasonalVariations {
  breedingPlumage?: string;
  winterPlumage?: string;
  juvenilePlumage?: string;
  seasonalBehavior?: string;
}

export interface BirdSounds {
  calls?: string;
  songs?: string;
  audioUrl?: string;
}

export interface Bird {
  name: string;
  scientificName: string;
  confidence: number;
  description: string;
  features: string[];
  habitat?: string;
  sound?: string;
  imageUrl?: string;
  
  // Enhanced database fields
  physicalCharacteristics?: PhysicalCharacteristics;
  habitatAndRange?: HabitatAndRange;
  migrationPatterns?: MigrationPatterns;
  seasonalVariations?: SeasonalVariations;
  sounds?: BirdSounds;
}

export const physicalCharacteristicsSchema = z.object({
  size: z.string().optional(),
  weight: z.string().optional(),
  wingspan: z.string().optional(),
  plumage: z.string().optional(),
  bill: z.string().optional(),
  legs: z.string().optional(),
  eyeColor: z.string().optional(),
}).optional();

export const habitatAndRangeSchema = z.object({
  preferredHabitat: z.string().optional(),
  geographicRange: z.string().optional(),
  rangeMapUrl: z.string().optional(),
}).optional();

export const migrationPatternsSchema = z.object({
  migratory: z.boolean().optional(),
  migrationSeason: z.string().optional(),
  migrationRoute: z.string().optional(),
  winteringGrounds: z.string().optional(),
  breedingGrounds: z.string().optional(),
}).optional();

export const seasonalVariationsSchema = z.object({
  breedingPlumage: z.string().optional(),
  winterPlumage: z.string().optional(),
  juvenilePlumage: z.string().optional(),
  seasonalBehavior: z.string().optional(),
}).optional();

export const birdSoundsSchema = z.object({
  calls: z.string().optional(),
  songs: z.string().optional(),
  audioUrl: z.string().optional(),
}).optional();

export const birdSchema = z.object({
  name: z.string(),
  scientificName: z.string(),
  confidence: z.number(),
  description: z.string(),
  features: z.array(z.string()),
  habitat: z.string().optional(),
  sound: z.string().optional(),
  imageUrl: z.string().optional(),
  
  // Enhanced database schemas
  physicalCharacteristics: physicalCharacteristicsSchema,
  habitatAndRange: habitatAndRangeSchema,
  migrationPatterns: migrationPatternsSchema,
  seasonalVariations: seasonalVariationsSchema,
  sounds: birdSoundsSchema,
});

export const similarBirdSchema = z.object({
  name: z.string(),
  scientificName: z.string(),
  confidence: z.number(),
  imageUrl: z.string().optional(),
});

export const identificationResultSchema = z.object({
  mainBird: birdSchema,
  similarBirds: z.array(similarBirdSchema).optional(),
  originalImage: z.string(),
});

export type IdentificationResult = z.infer<typeof identificationResultSchema>;
export type SimilarBird = z.infer<typeof similarBirdSchema>;
