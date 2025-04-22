"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AITester from '@/components/AITester';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAIModeStore } from '@/stores/aiModeStore';
import { ArrowLeft } from 'lucide-react';

export default function AITesterPage() {
  const router = useRouter();
  const { isLocalAI } = useAIModeStore();
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  useEffect(() => {
    // Check if Ollama is running when in local AI mode
  
      checkOllamaStatus();
   
  }, []);

  const checkOllamaStatus = async () => {
    try {
      const response = await fetch('/api/check-local-ai');
      const data = await response.json();

      setOllamaStatus(data.status);
      if (data.models) {
        setAvailableModels(data.models);
      }
    } catch (error) {
      console.error('Error checking Ollama status:', error);
      setOllamaStatus('offline');
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Button
        variant="outline"
        className="mb-6"
        onClick={() => router.push('/')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
      </Button>

      <div className="flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-8">AI Model Tester</h1>

        {isLocalAI && ollamaStatus === 'checking' && (
          <Card className="w-full max-w-2xl mb-6">
            <CardHeader>
              <CardTitle>Checking Ollama Status...</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Verifying if Ollama is running on your machine.</p>
            </CardContent>
          </Card>
        )}

        {isLocalAI && ollamaStatus === 'offline' && (
          <Card className="w-full max-w-2xl mb-6 border-red-300">
            <CardHeader className="bg-red-50 text-red-800">
              <CardTitle>Ollama Not Running</CardTitle>
              <CardDescription className="text-red-700">
                Local AI requires Ollama to be running
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="mb-2">Please start Ollama on your machine or switch to Cloud AI.</p>
              <p className="mb-2">If you don't have Ollama installed:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Download and install from <a href="https://ollama.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">ollama.com</a></li>
                <li>Start the Ollama application</li>
                <li>Pull a model using the command: <code className="bg-gray-100 px-2 py-1 rounded">ollama pull gemma3</code></li>
              </ol>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button onClick={checkOllamaStatus}>Check Again</Button>
            </CardFooter>
          </Card>
        )}

        {isLocalAI && ollamaStatus === 'online' && availableModels.length > 0 && (
          <Card className="w-full max-w-2xl mb-6 border-green-300">
            <CardHeader className="bg-green-50 text-green-800">
              <CardTitle>Ollama Running</CardTitle>
              <CardDescription className="text-green-700">
                {availableModels.length} model(s) available
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="mb-2">Available models:</p>
              <div className="grid grid-cols-2 gap-2">
                {availableModels.map(model => (
                  <div key={model} className="bg-gray-100 px-3 py-2 rounded text-sm">
                    {model}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="w-full max-w-2xl">
          <AITester />
        </div>
      </div>
    </div>
  );
}
