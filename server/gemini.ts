import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { IdentificationResult, identificationResultSchema } from "@shared/schema";
import { z } from "zod";

// Initialize Google Generative AI with API key
const API_KEY = process.env.GEMINI_API_KEY || ""; 
if (!API_KEY) {
  console.warn("Warning: GEMINI_API_KEY environment variable not set. Bird identification will not work.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Configure safety settings
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

export async function identifyBirdWithGemini(
  base64Image: string | null, 
  customPrompt?: string
): Promise<IdentificationResult> {
  try {
    // Get the Gemini model (updated to use 1.5-flash as recommended)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      safetySettings,
    });

    // Generate prompt that asks for structured information about the bird
    const prompt = `
      You are an expert ornithologist. Identify the bird in this image with comprehensive information.
      
      Provide the following information in a JSON format:
      1. Basic identification:
         - The bird's common name
         - Scientific name
         - A confidence percentage of your identification (number between 1-100)
         - A detailed description of the bird
         - At least 4 key physical features of the bird
         - Information about its habitat (if you can identify it)
         - Information about its calls/songs (if known)
      
      2. Detailed physical characteristics:
         - Size (length in cm/inches)
         - Weight (in g/oz if known)
         - Wingspan (in cm/inches if known)
         - Detailed plumage description
         - Bill characteristics
         - Leg characteristics
         - Eye color
      
      3. Habitat and range information:
         - Preferred habitat types
         - Geographic range description
      
      4. Migration patterns (if applicable):
         - Whether the bird is migratory (true/false)
         - Migration seasons
         - Migration routes
         - Wintering grounds
         - Breeding grounds
      
      5. Seasonal variations:
         - Breeding plumage description
         - Winter plumage description
         - Juvenile plumage description
         - Seasonal behavior changes
      
      6. Sounds and vocalizations:
         - Description of calls
         - Description of songs
      
      7. Similar species for comparison (up to 3)

      Format your response ONLY as a JSON object with the following structure:
      {
        "mainBird": {
          "name": "Common name",
          "scientificName": "Scientific name",
          "confidence": 0-100,
          "description": "Detailed description",
          "features": ["feature1", "feature2", "feature3", "feature4"],
          "habitat": "Habitat information if known",
          "sound": "Sound information if known",
          
          "physicalCharacteristics": {
            "size": "Size information",
            "weight": "Weight information",
            "wingspan": "Wingspan information",
            "plumage": "Detailed plumage description",
            "bill": "Bill characteristics",
            "legs": "Leg characteristics",
            "eyeColor": "Eye color"
          },
          
          "habitatAndRange": {
            "preferredHabitat": "Preferred habitat types",
            "geographicRange": "Geographic range description"
          },
          
          "migrationPatterns": {
            "migratory": true/false,
            "migrationSeason": "Migration season information",
            "migrationRoute": "Migration route description",
            "winteringGrounds": "Wintering grounds information",
            "breedingGrounds": "Breeding grounds information"
          },
          
          "seasonalVariations": {
            "breedingPlumage": "Breeding plumage description",
            "winterPlumage": "Winter plumage description",
            "juvenilePlumage": "Juvenile plumage description",
            "seasonalBehavior": "Seasonal behavior changes"
          },
          
          "sounds": {
            "calls": "Description of calls",
            "songs": "Description of songs"
          }
        },
        "similarBirds": [
          {
            "name": "Similar bird name",
            "scientificName": "Scientific name",
            "confidence": 0-100
          }
        ]
      }
      
      If you cannot identify the bird or there is no bird in the image, respond with an error message in JSON format:
      {
        "error": true,
        "message": "Detailed explanation of why identification failed"
      }
      
      IMPORTANT INSTRUCTIONS:
      1. Do NOT wrap the JSON in markdown code blocks (like \`\`\`json)
      2. Respond ONLY with the raw JSON object
      3. Do not include ANY other text, explanation, markdown formatting, or code blocks
      4. If you don't know some information, it's fine to leave those fields out - don't make up information
      5. Always provide as much accurate information as possible based on the visible characteristics in the image
    `;

    // Determine whether we're doing image or text-based identification
    const isImageIdentification = base64Image !== null;
    let imageParts: any[] = [];
    let mimeType = "image/jpeg";
    
    if (isImageIdentification && base64Image) {
      // Prepare the image for the API request
      // Try to determine MIME type based on the base64 data (default to jpeg if can't determine)
      if (base64Image.startsWith("/9j/")) {
        mimeType = "image/jpeg";
      } else if (base64Image.startsWith("iVBORw0KGgo")) {
        mimeType = "image/png";
      } else if (base64Image.startsWith("R0lGODlh")) {
        mimeType = "image/gif";
      } else if (base64Image.startsWith("UklGR")) {
        mimeType = "image/webp";
      }
      
      imageParts = [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
      ];
    }

    // Generate content using the model
    const result = await model.generateContent({ 
      contents: [{ 
        role: "user", 
        parts: isImageIdentification 
          ? [{ text: prompt }, ...imageParts] 
          : [{ text: customPrompt || prompt }] 
      }],
    });

    // Get the response text
    const responseText = result.response.text().trim();
    
    // Parse the JSON response
    try {
      // Clean up any markdown code blocks before parsing
      const cleanedResponse = responseText.replace(/```json\s*/g, "").replace(/```\s*$/g, "").trim();
      
      console.log("Cleaned response:", cleanedResponse);
      
      const parsedResponse = JSON.parse(cleanedResponse);
      
      // Check if there's an error in identification
      if (parsedResponse.error) {
        throw new Error(parsedResponse.message || "Failed to identify bird in image");
      }
      
      // Check if we have the required mainBird data
      if (!parsedResponse.mainBird || !parsedResponse.mainBird.name) {
        console.error("Invalid response structure, missing mainBird data:", parsedResponse);
        throw new Error("The API response did not contain valid bird identification data");
      }
      
      // Validate and process the response against our schema
      const validatedResult: IdentificationResult = {
        mainBird: {
          name: parsedResponse.mainBird.name || "Unknown Bird",
          scientificName: parsedResponse.mainBird.scientificName || "Unknown Species",
          confidence: Math.min(Math.max(1, Math.round(parsedResponse.mainBird.confidence || 0)), 100),
          description: parsedResponse.mainBird.description || "No description available",
          features: parsedResponse.mainBird.features || ["No features available"],
          habitat: parsedResponse.mainBird.habitat || "Unknown habitat",
          sound: parsedResponse.mainBird.sound || "Unknown sound",
          
          // Enhanced database fields
          physicalCharacteristics: parsedResponse.mainBird.physicalCharacteristics ? {
            size: parsedResponse.mainBird.physicalCharacteristics.size,
            weight: parsedResponse.mainBird.physicalCharacteristics.weight,
            wingspan: parsedResponse.mainBird.physicalCharacteristics.wingspan,
            plumage: parsedResponse.mainBird.physicalCharacteristics.plumage,
            bill: parsedResponse.mainBird.physicalCharacteristics.bill,
            legs: parsedResponse.mainBird.physicalCharacteristics.legs,
            eyeColor: parsedResponse.mainBird.physicalCharacteristics.eyeColor,
          } : undefined,
          
          habitatAndRange: parsedResponse.mainBird.habitatAndRange ? {
            preferredHabitat: parsedResponse.mainBird.habitatAndRange.preferredHabitat,
            geographicRange: parsedResponse.mainBird.habitatAndRange.geographicRange,
            rangeMapUrl: parsedResponse.mainBird.habitatAndRange.rangeMapUrl,
          } : undefined,
          
          migrationPatterns: parsedResponse.mainBird.migrationPatterns ? {
            migratory: !!parsedResponse.mainBird.migrationPatterns.migratory,
            migrationSeason: parsedResponse.mainBird.migrationPatterns.migrationSeason,
            migrationRoute: parsedResponse.mainBird.migrationPatterns.migrationRoute,
            winteringGrounds: parsedResponse.mainBird.migrationPatterns.winteringGrounds,
            breedingGrounds: parsedResponse.mainBird.migrationPatterns.breedingGrounds,
          } : undefined,
          
          seasonalVariations: parsedResponse.mainBird.seasonalVariations ? {
            breedingPlumage: parsedResponse.mainBird.seasonalVariations.breedingPlumage,
            winterPlumage: parsedResponse.mainBird.seasonalVariations.winterPlumage,
            juvenilePlumage: parsedResponse.mainBird.seasonalVariations.juvenilePlumage,
            seasonalBehavior: parsedResponse.mainBird.seasonalVariations.seasonalBehavior,
          } : undefined,
          
          sounds: parsedResponse.mainBird.sounds ? {
            calls: parsedResponse.mainBird.sounds.calls,
            songs: parsedResponse.mainBird.sounds.songs,
            audioUrl: parsedResponse.mainBird.sounds.audioUrl,
          } : undefined,
        },
        similarBirds: Array.isArray(parsedResponse.similarBirds) 
          ? parsedResponse.similarBirds.map((bird: any) => ({
              name: bird.name || "Unknown Similar Bird",
              scientificName: bird.scientificName || "Unknown Species",
              confidence: Math.min(Math.max(1, Math.round(bird.confidence || 0)), 100),
            }))
          : [],
        originalImage: isImageIdentification && base64Image 
          ? `data:${mimeType};base64,${base64Image}`
          : "",
      };

      // Validate with zod schema
      return identificationResultSchema.parse(validatedResult);
    } catch (jsonError) {
      console.error("Error parsing Gemini response:", jsonError);
      console.error("Raw response:", responseText);
      throw new Error("Failed to parse identification result from Gemini API");
    }
  } catch (error) {
    console.error("Error identifying bird with Gemini:", error);
    throw error;
  }
}
