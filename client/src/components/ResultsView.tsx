import { useState } from "react";
import { IdentificationResult } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

interface ResultsViewProps {
  result: IdentificationResult;
  onBackToCamera: () => void;
}

const ResultsView: React.FC<ResultsViewProps> = ({ result, onBackToCamera }) => {
  const [activeTab, setActiveTab] = useState<string>("about");
  
  const handleShareResult = () => {
    // Implement share functionality (could use Web Share API if available)
    if (navigator.share) {
      navigator.share({
        title: `BirdLens - ${result.mainBird.name}`,
        text: `I identified a ${result.mainBird.name} (${result.mainBird.scientificName}) using BirdLens!`,
      }).catch(err => {
        console.log('Error sharing', err);
      });
    } else {
      alert("Sharing is not available on your device");
    }
  };

  const handleSaveToCollection = () => {
    // Placeholder for saving functionality
    alert("Save to collection feature coming soon!");
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-4">
        <button 
          className="flex items-center text-secondary font-medium"
          onClick={onBackToCamera}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6"></path>
          </svg>
          Back to Camera
        </button>
      </div>
      
      {/* Main identified bird */}
      <div className="bird-card bg-white mb-8 overflow-hidden">
        {/* Bird image */}
        <div className="relative">
          <img 
            src={result.originalImage} 
            alt={result.mainBird.name} 
            className="w-full h-64 md:h-80 object-cover" 
          />
          
          {/* Top identification badge */}
          <div className="absolute top-4 left-4 bg-primary text-white px-3 py-1 rounded-full text-sm font-medium shadow-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 inline-block mr-1"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            Top Match
          </div>
        </div>
        
        {/* Bird info */}
        <div className="p-6">
          <div className="flex flex-wrap justify-between items-start mb-4">
            <div>
              <h2 className="font-montserrat text-2xl font-bold text-neutral-800">{result.mainBird.name}</h2>
              <p className="text-neutral-500 italic mb-1">{result.mainBird.scientificName}</p>
            </div>
            
            {/* Confidence score */}
            <div className="bg-neutral-100 px-3 py-2 rounded-lg">
              <p className="text-sm text-neutral-700 font-semibold">Confidence</p>
              <div className="flex items-center">
                <div className="confidence-bar w-24 mr-2 bg-neutral-200">
                  <div 
                    className="h-full bg-success" 
                    style={{ width: `${result.mainBird.confidence}%` }}
                  ></div>
                </div>
                <span className="font-bold text-success">{result.mainBird.confidence}%</span>
              </div>
            </div>
          </div>
          
          {/* Enhanced tabs for bird details */}
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="grid grid-cols-7 mb-6">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="physical">Physical</TabsTrigger>
              <TabsTrigger value="habitat">Habitat</TabsTrigger>
              <TabsTrigger value="migration">Migration</TabsTrigger>
              <TabsTrigger value="seasonal">Seasonal</TabsTrigger>
              <TabsTrigger value="sounds">Sounds</TabsTrigger>
              <TabsTrigger value="similar">Similar</TabsTrigger>
            </TabsList>

            {/* About tab */}
            <TabsContent value="about" className="mt-0">
              <div className="space-y-4">
                <p className="text-neutral-700">{result.mainBird.description}</p>
                
                <h3 className="font-montserrat font-semibold text-lg">Key Features</h3>
                <ul className="space-y-2 mb-4">
                  {result.mainBird.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-primary mt-1 mr-2 flex-shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m12 19-2 3-6-2 2-2.5"></path>
                        <path d="m5 13 1 1.5L2.5 18 3 21l3.5-1.5 3 1.5"></path>
                        <path d="M15 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"></path>
                        <path d="M15 4v8"></path>
                        <path d="M11 8h8"></path>
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="flex justify-center mt-4">
                  <Button
                    className="bg-secondary hover:bg-secondary-dark" 
                    onClick={() => window.open(`https://en.wikipedia.org/wiki/${result.mainBird.name.replace(/ /g, '_')}`, '_blank')}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                    </svg>
                    Learn More
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            {/* Physical characteristics tab */}
            <TabsContent value="physical" className="mt-0">
              {result.mainBird.physicalCharacteristics ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.mainBird.physicalCharacteristics.size && (
                      <div className="bg-neutral-50 p-3 rounded-md">
                        <h4 className="font-medium text-primary mb-1">Size</h4>
                        <p>{result.mainBird.physicalCharacteristics.size}</p>
                      </div>
                    )}
                    
                    {result.mainBird.physicalCharacteristics.weight && (
                      <div className="bg-neutral-50 p-3 rounded-md">
                        <h4 className="font-medium text-primary mb-1">Weight</h4>
                        <p>{result.mainBird.physicalCharacteristics.weight}</p>
                      </div>
                    )}
                    
                    {result.mainBird.physicalCharacteristics.wingspan && (
                      <div className="bg-neutral-50 p-3 rounded-md">
                        <h4 className="font-medium text-primary mb-1">Wingspan</h4>
                        <p>{result.mainBird.physicalCharacteristics.wingspan}</p>
                      </div>
                    )}
                    
                    {result.mainBird.physicalCharacteristics.eyeColor && (
                      <div className="bg-neutral-50 p-3 rounded-md">
                        <h4 className="font-medium text-primary mb-1">Eye Color</h4>
                        <p>{result.mainBird.physicalCharacteristics.eyeColor}</p>
                      </div>
                    )}
                  </div>
                  
                  <Separator className="my-3" />
                  
                  {result.mainBird.physicalCharacteristics.plumage && (
                    <div>
                      <h4 className="font-medium text-secondary mb-1">Plumage</h4>
                      <p className="text-neutral-700">{result.mainBird.physicalCharacteristics.plumage}</p>
                    </div>
                  )}
                  
                  {result.mainBird.physicalCharacteristics.bill && (
                    <div>
                      <h4 className="font-medium text-secondary mb-1">Bill</h4>
                      <p className="text-neutral-700">{result.mainBird.physicalCharacteristics.bill}</p>
                    </div>
                  )}
                  
                  {result.mainBird.physicalCharacteristics.legs && (
                    <div>
                      <h4 className="font-medium text-secondary mb-1">Legs</h4>
                      <p className="text-neutral-700">{result.mainBird.physicalCharacteristics.legs}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16 mx-auto text-neutral-300 mb-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="8" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="8" y1="18" x2="21" y2="18"></line>
                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                  </svg>
                  <p className="text-neutral-500">Physical characteristics information not available.</p>
                </div>
              )}
            </TabsContent>
            
            {/* Habitat tab */}
            <TabsContent value="habitat" className="mt-0">
              {(result.mainBird.habitat || result.mainBird.habitatAndRange) ? (
                <div className="space-y-4">
                  {result.mainBird.habitat && (
                    <div>
                      <h4 className="font-medium text-secondary mb-1">General Habitat</h4>
                      <p className="text-neutral-700">{result.mainBird.habitat}</p>
                    </div>
                  )}
                  
                  {result.mainBird.habitatAndRange?.preferredHabitat && (
                    <div>
                      <h4 className="font-medium text-secondary mb-1">Preferred Habitat</h4>
                      <p className="text-neutral-700">{result.mainBird.habitatAndRange.preferredHabitat}</p>
                    </div>
                  )}
                  
                  {result.mainBird.habitatAndRange?.geographicRange && (
                    <div>
                      <h4 className="font-medium text-secondary mb-1">Geographic Range</h4>
                      <p className="text-neutral-700">{result.mainBird.habitatAndRange.geographicRange}</p>
                    </div>
                  )}
                  
                  {result.mainBird.habitatAndRange?.rangeMapUrl && (
                    <div className="mt-4">
                      <h4 className="font-medium text-secondary mb-2">Range Map</h4>
                      <img 
                        src={result.mainBird.habitatAndRange.rangeMapUrl} 
                        alt={`Range map for ${result.mainBird.name}`} 
                        className="max-w-full rounded-md border border-neutral-200"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16 mx-auto text-neutral-300 mb-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path>
                  </svg>
                  <p className="text-neutral-500">Habitat information not available for this bird.</p>
                </div>
              )}
            </TabsContent>
            
            {/* Migration tab */}
            <TabsContent value="migration" className="mt-0">
              {result.mainBird.migrationPatterns ? (
                <div className="space-y-4">
                  <div className="bg-neutral-50 p-4 rounded-lg flex items-center mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-8 w-8 mr-3 ${result.mainBird.migrationPatterns.migratory ? 'text-success' : 'text-neutral-500'}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {result.mainBird.migrationPatterns.migratory ? (
                        <>
                          <path d="M5 9l14 9"></path>
                          <path d="M5 15l14-9"></path>
                        </>
                      ) : (
                        <circle cx="12" cy="12" r="10"></circle>
                      )}
                    </svg>
                    <div>
                      <h4 className="font-medium text-secondary">Migration Status</h4>
                      <p className="text-neutral-700">
                        {result.mainBird.migrationPatterns.migratory ? 
                          'This is a migratory species.' : 
                          'This is a non-migratory (resident) species.'}
                      </p>
                    </div>
                  </div>
                  
                  {result.mainBird.migrationPatterns.migrationSeason && (
                    <div>
                      <h4 className="font-medium text-secondary mb-1">Migration Season</h4>
                      <p className="text-neutral-700">{result.mainBird.migrationPatterns.migrationSeason}</p>
                    </div>
                  )}
                  
                  {result.mainBird.migrationPatterns.migrationRoute && (
                    <div>
                      <h4 className="font-medium text-secondary mb-1">Migration Route</h4>
                      <p className="text-neutral-700">{result.mainBird.migrationPatterns.migrationRoute}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {result.mainBird.migrationPatterns.breedingGrounds && (
                      <div className="bg-neutral-50 p-3 rounded-md">
                        <h4 className="font-medium text-primary mb-1">Breeding Grounds</h4>
                        <p>{result.mainBird.migrationPatterns.breedingGrounds}</p>
                      </div>
                    )}
                    
                    {result.mainBird.migrationPatterns.winteringGrounds && (
                      <div className="bg-neutral-50 p-3 rounded-md">
                        <h4 className="font-medium text-primary mb-1">Wintering Grounds</h4>
                        <p>{result.mainBird.migrationPatterns.winteringGrounds}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16 mx-auto text-neutral-300 mb-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 10h4V2H1v8h4"></path>
                    <path d="M17 22H7V10h10Z"></path>
                    <path d="M22 22H2"></path>
                  </svg>
                  <p className="text-neutral-500">Migration information not available for this bird.</p>
                </div>
              )}
            </TabsContent>
            
            {/* Seasonal variations tab */}
            <TabsContent value="seasonal" className="mt-0">
              {result.mainBird.seasonalVariations ? (
                <div className="space-y-4">
                  {result.mainBird.seasonalVariations.breedingPlumage && (
                    <div>
                      <h4 className="font-medium text-secondary mb-1">Breeding Plumage</h4>
                      <p className="text-neutral-700">{result.mainBird.seasonalVariations.breedingPlumage}</p>
                    </div>
                  )}
                  
                  {result.mainBird.seasonalVariations.winterPlumage && (
                    <div>
                      <h4 className="font-medium text-secondary mb-1">Winter Plumage</h4>
                      <p className="text-neutral-700">{result.mainBird.seasonalVariations.winterPlumage}</p>
                    </div>
                  )}
                  
                  {result.mainBird.seasonalVariations.juvenilePlumage && (
                    <div>
                      <h4 className="font-medium text-secondary mb-1">Juvenile Plumage</h4>
                      <p className="text-neutral-700">{result.mainBird.seasonalVariations.juvenilePlumage}</p>
                    </div>
                  )}
                  
                  {result.mainBird.seasonalVariations.seasonalBehavior && (
                    <div>
                      <h4 className="font-medium text-secondary mb-1">Seasonal Behavior</h4>
                      <p className="text-neutral-700">{result.mainBird.seasonalVariations.seasonalBehavior}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16 mx-auto text-neutral-300 mb-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 6v6l4 2"></path>
                  </svg>
                  <p className="text-neutral-500">Seasonal variation information not available for this bird.</p>
                </div>
              )}
            </TabsContent>
            
            {/* Sounds tab */}
            <TabsContent value="sounds" className="mt-0">
              {(result.mainBird.sound || result.mainBird.sounds) ? (
                <div className="space-y-4">
                  {result.mainBird.sound && (
                    <div>
                      <h4 className="font-medium text-secondary mb-1">General Sound Information</h4>
                      <p className="text-neutral-700">{result.mainBird.sound}</p>
                    </div>
                  )}
                  
                  {result.mainBird.sounds?.calls && (
                    <div>
                      <h4 className="font-medium text-secondary mb-1">Calls</h4>
                      <p className="text-neutral-700">{result.mainBird.sounds.calls}</p>
                    </div>
                  )}
                  
                  {result.mainBird.sounds?.songs && (
                    <div>
                      <h4 className="font-medium text-secondary mb-1">Songs</h4>
                      <p className="text-neutral-700">{result.mainBird.sounds.songs}</p>
                    </div>
                  )}
                  
                  {result.mainBird.sounds?.audioUrl && (
                    <div className="mt-4">
                      <h4 className="font-medium text-secondary mb-2">Listen to Audio</h4>
                      <audio controls className="w-full">
                        <source src={result.mainBird.sounds.audioUrl} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16 mx-auto text-neutral-300 mb-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <path d="m15.54 8.46 5 5"></path>
                    <path d="m20.54 8.46-5 5"></path>
                  </svg>
                  <p className="text-neutral-500">Sound information not available for this bird.</p>
                </div>
              )}
            </TabsContent>
            
            {/* Similar birds tab */}
            <TabsContent value="similar" className="mt-0">
              {result.similarBirds && result.similarBirds.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {result.similarBirds.map((bird, index) => (
                    <div key={index} className="bird-card bg-neutral-50 rounded-lg overflow-hidden">
                      <div className="relative">
                        <img 
                          src={bird.imageUrl || 'https://placehold.co/400x300/e2e8f0/cccccc?text=No+Image'} 
                          alt={bird.name} 
                          className="w-full h-40 object-cover" 
                        />
                      </div>
                      <div className="p-4">
                        <h4 className="font-montserrat font-semibold text-neutral-800">{bird.name}</h4>
                        <p className="text-neutral-500 text-sm italic mb-2">{bird.scientificName}</p>
                        
                        <div className="flex items-center mb-2">
                          <div className="confidence-bar h-2 w-full mr-2 bg-neutral-200 rounded-full">
                            <div 
                              className="h-full bg-secondary rounded-full" 
                              style={{ width: `${bird.confidence}%` }}
                            ></div>
                          </div>
                          <span className="font-bold text-secondary ml-2 text-sm">{bird.confidence}%</span>
                        </div>
                        
                        <Button 
                          variant="outline"
                          className="w-full mt-2 text-sm border border-secondary text-secondary hover:bg-secondary hover:text-white"
                          onClick={() => window.open(`https://en.wikipedia.org/wiki/${bird.name.replace(/ /g, '_')}`, '_blank')}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16 mx-auto text-neutral-300 mb-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                  </svg>
                  <p className="text-neutral-500">No similar birds information available.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Actions section */}
      <div className="flex flex-wrap justify-center gap-4 mb-12">
        <Button 
          className="bg-primary hover:bg-primary-dark"
          onClick={handleShareResult}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
            <polyline points="16 6 12 2 8 6"></polyline>
            <line x1="12" y1="2" x2="12" y2="15"></line>
          </svg>
          Share
        </Button>
        
        <Button 
          variant="outline"
          className="border border-primary text-primary hover:bg-primary-light hover:text-white"
          onClick={handleSaveToCollection}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path>
          </svg>
          Save
        </Button>
        
        <Button 
          variant="outline"
          className="border border-neutral-300 text-neutral-700 hover:bg-neutral-100"
          onClick={onBackToCamera}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
            <circle cx="12" cy="13" r="4"></circle>
          </svg>
          New Identification
        </Button>
      </div>
    </div>
  );
};

export default ResultsView;
