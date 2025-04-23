import React, { useState } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from '@tanstack/react-query';
import { BirdIdentification } from '@shared/schema';
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Dashboard() {
  const { data: identifications, isLoading, isError } = useQuery<BirdIdentification[]>({
    queryKey: ['/api/identifications'],
    refetchOnWindowFocus: false,
  });

  const latestIdentifications = identifications?.slice(0, 10) || [];
  
  // Calculate stats
  const totalIdentifications = identifications?.length || 0;
  const uniqueBirds = new Set(identifications?.map(id => 
    (id.result as any)?.mainBird?.name
  )).size;

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Header />
      
      <main className="flex-1 container mx-auto p-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-400">Bird Identification Dashboard</h1>
          <Button asChild className="bg-gradient-to-r from-green-500 to-emerald-400 hover:from-green-600 hover:to-emerald-500">
            <Link href="/">Identify New Bird</Link>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Total Identifications</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-green-600">{totalIdentifications}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Unique Bird Species</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-green-600">{uniqueBirds}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Most Recent</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-medium text-green-600">
                {latestIdentifications[0] ? (
                  (latestIdentifications[0].result as any)?.mainBird?.name || "None yet"
                ) : "None yet"}
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="recent" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="recent">Recent Identifications</TabsTrigger>
            <TabsTrigger value="gallery">Bird Gallery</TabsTrigger>
          </TabsList>
          
          <TabsContent value="recent" className="space-y-4">
            {isLoading ? (
              <p>Loading recent identifications...</p>
            ) : isError ? (
              <p className="text-red-500">Error loading identification history</p>
            ) : latestIdentifications.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-xl font-medium mb-2">No identifications yet</h3>
                <p className="text-gray-500 mb-4">Start identifying birds to see your history here</p>
                <Button asChild className="bg-gradient-to-r from-green-500 to-emerald-400 hover:from-green-600 hover:to-emerald-500">
                  <Link href="/">Identify Your First Bird</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {latestIdentifications.map((item, index) => {
                  const birdData = (item.result as any)?.mainBird;
                  const imageUrl = (item.result as any)?.originalImage;
                  
                  return (
                    <Card key={index} className="overflow-hidden">
                      {imageUrl && (
                        <div className="h-48 overflow-hidden">
                          <img 
                            src={imageUrl} 
                            alt={birdData?.name || "Identified bird"} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardHeader className="pb-2">
                        <CardTitle>{birdData?.name || "Unknown Bird"}</CardTitle>
                        <CardDescription className="italic">
                          {birdData?.scientificName || ""}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                            {birdData?.confidence || 0}% Match
                          </Badge>
                        </div>
                        <p className="text-sm line-clamp-3">{birdData?.description || ""}</p>
                      </CardContent>
                      <CardFooter className="text-xs text-gray-500">
                        Identified on {new Date(item.identifiedAt).toLocaleDateString()}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="gallery" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {isLoading ? (
                <p>Loading gallery...</p>
              ) : isError ? (
                <p className="text-red-500">Error loading gallery</p>
              ) : latestIdentifications.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <h3 className="text-xl font-medium mb-2">Your bird gallery is empty</h3>
                  <p className="text-gray-500 mb-4">Start identifying birds to build your collection</p>
                </div>
              ) : (
                latestIdentifications.map((item, index) => {
                  const birdData = (item.result as any)?.mainBird;
                  const imageUrl = (item.result as any)?.originalImage;
                  
                  return (
                    <div key={index} className="aspect-square overflow-hidden rounded-md group relative">
                      {imageUrl && (
                        <img 
                          src={imageUrl} 
                          alt={birdData?.name || "Identified bird"} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all flex items-end">
                        <div className="p-2 w-full text-white translate-y-full group-hover:translate-y-0 transition-transform">
                          <p className="font-medium text-sm">{birdData?.name || "Unknown Bird"}</p>
                          <p className="text-xs">{birdData?.confidence || 0}% confidence</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
}