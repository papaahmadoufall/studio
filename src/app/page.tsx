"use client";

import { useState, useEffect } from 'react';
import { useAIModeStore } from '@/stores/aiModeStore';
import DataUpload from '@/components/data-upload';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useRouter } from 'next/navigation';
import { AI_MODELS, type AIModel } from '@/types/ai';
import WordCloudComponent from '@/components/ui/word-cloud';

export default function Home() {
  const router = useRouter();
  const { isLocalAI, toggleAIMode, selectedModel, setModel } = useAIModeStore();
  const [localModels, setLocalModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  const sampleWords = [
    { text: 'Experience', weight: 10 },
    { text: 'User', weight: 8 },
    { text: 'Survey', weight: 7 },
    { text: 'Interview', weight: 6 },
    { text: 'Data', weight: 5 },
    { text: 'Satisfaction', weight: 4 },
    { text: 'Rate', weight: 3 },
    { text: 'Custumer', weight: 2 },
    { text: 'API', weight: 1 },
  ];

  useEffect(() => {
    // Check if Ollama is running when in local AI mode
    if (isLocalAI) {
      checkOllamaStatus();
    } else {
      setIsLoading(false);
    }
  }, [isLocalAI]);

  const checkOllamaStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/check-local-ai');
      const data = await response.json();

      setOllamaStatus(data.status);
      if (data.models) {
        setLocalModels(data.models);
      }
    } catch (error) {
      console.error('Error checking Ollama status:', error);
      setOllamaStatus('offline');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModelSelect = (modelId: string) => {
    const model = AI_MODELS.find(m => m.id === modelId) || {
      id: modelId,
      name: modelId.split(':')[0].charAt(0).toUpperCase() + modelId.split(':')[0].slice(1),
      type: 'local' as const
    };
    setModel(model);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <script src="http://localhost:8097"></script>
      <div className="fixed top-4 right-4 flex items-center space-x-2">
        <Switch
          id="ai-mode"
          checked={isLocalAI}
          onCheckedChange={toggleAIMode}
        />
        <Label htmlFor="ai-mode" className="text-sm font-medium">
          {isLocalAI ? 'Using Local AI' : 'Using Cloud AI'}
        </Label>
      </div>

      <main className="flex flex-col items-center justify-center w-full flex-1 px-4 md:px-20 text-center space-y-8">
        <h1 className="text-3xl font-bold mt-12">
          Survey Insights Analyzer
        </h1>

        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>AI Configuration</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/ai-tester')}
              >
                Open AI Tester
              </Button>
            </CardTitle>
            <CardDescription>
              Configure which AI model to use for analyzing survey data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={isLocalAI ? "local" : "cloud"} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger
                  value="local"
                  onClick={() => {
                    if (!isLocalAI) toggleAIMode();
                  }}
                >
                  Local AI
                </TabsTrigger>
                <TabsTrigger
                  value="cloud"
                  onClick={() => {
                    if (isLocalAI) toggleAIMode();
                  }}
                >
                  Cloud AI
                </TabsTrigger>
              </TabsList>
              <TabsContent value="local" className="space-y-4">
                {isLoading ? (
                  <div className="py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 mx-auto"></div>
                    <p className="mt-2">Checking Ollama status...</p>
                  </div>
                ) : ollamaStatus === 'offline' ? (
                  <Card className="border-red-200">
                    <CardHeader className="bg-red-50 text-red-800 pb-2">
                      <CardTitle className="text-lg">Ollama Not Running</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p>Please start Ollama on your machine to use local AI models.</p>
                      <p className="mt-2">If you don't have Ollama installed, <a href="https://ollama.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">download it here</a>.</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={checkOllamaStatus}
                      >
                        Check Again
                      </Button>
                    </CardContent>
                  </Card>
                ) : localModels.length === 0 ? (
                  <Card className="border-yellow-200">
                    <CardHeader className="bg-yellow-50 text-yellow-800 pb-2">
                      <CardTitle className="text-lg">No Models Available</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p>You need to pull at least one model to use local AI.</p>
                      <p className="mt-2">Run one of these commands in your terminal:</p>
                      <pre className="bg-gray-100 p-2 rounded mt-2 text-sm overflow-x-auto">
                        <code>ollama pull gemma3</code>
                      </pre>
                      <pre className="bg-gray-100 p-2 rounded mt-2 text-sm overflow-x-auto">
                        <code>ollama pull mistral</code>
                      </pre>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      {localModels.map(model => (
                        <Button
                          key={model}
                          variant={selectedModel.id === model ? "default" : "outline"}
                          className="justify-start overflow-hidden"
                          onClick={() => handleModelSelect(model)}
                        >
                          <span className="truncate">{model}</span>
                          {selectedModel.id === model && (
                            <Badge variant="secondary" className="ml-auto">Active</Badge>
                          )}
                        </Button>
                      ))}
                    </div>
                    <div className="text-sm text-left">
                      <p>Currently using: <span className="font-semibold">{selectedModel.name}</span></p>
                    </div>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="cloud">
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Google Gemini</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">Using Google's Gemini model for cloud-based AI processing.</p>
                      <p className="text-sm mt-2">Make sure you have set up your API key in the .env.local file.</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <DataUpload />

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Word Cloud Example</h2>
          <WordCloudComponent words={sampleWords} />
        </div>
      </main>
    </div>
  );
}

