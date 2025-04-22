"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Loader2, Send, AlertCircle, CheckCircle2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAIModeStore } from '@/stores/aiModeStore';
import { AI_MODELS } from '@/types/ai';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

export default function AITester() {
  const { selectedModel, setModel } = useAIModeStore();
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const { isLocalAI } = useAIModeStore();

  useEffect(() => {
    // Check if Ollama is running when in local AI mode
    if (isLocalAI) {
      checkOllamaStatus();
    }
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

  const testAI = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError('');
    setResponse('');
    setSuccess(false);

    try {
      if (selectedModel.type === 'local') {
        const res = await fetch('/api/local-ai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            model: selectedModel.id
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to get response');
        }

        setResponse(data.response);
        setSuccess(true);
      } else {
        // Cloud AI implementation
        const res = await fetch('/api/cloud-ai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to get response from cloud AI');
        }

        setResponse(data.response);
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>AI Model Tester</span>
          <Badge variant={selectedModel.type === 'local' ? "secondary" : "default"}>
            {selectedModel.type === 'local' ? 'Local AI' : 'Cloud AI'}
          </Badge>
        </CardTitle>
        <CardDescription>
          Test AI responses with different models and prompts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ai-model">Select Model</Label>
          <Select
            value={selectedModel.id}
            onValueChange={(value) => {
              const model = AI_MODELS.find(m => m.id === value)!;
              setModel(model);
            }}
          >
            <SelectTrigger id="ai-model" className="w-full">
              <SelectValue placeholder="Select Model" />
            </SelectTrigger>
            <SelectContent>
              {availableModels.map((model) => (
                <SelectItem key={model} value={model}>
                  {model} 
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="prompt">Your Prompt</Label>
          <Textarea
            id="prompt"
            placeholder="Enter your prompt here..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="w-full resize-none"
          />
        </div>

        <Button
          onClick={testAI}
          disabled={isLoading || !prompt.trim()}
          className="w-full"
          variant="default"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Test AI
            </>
          )}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && response && (
          <Card className="border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                AI Response
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded-md text-sm">{response}</div>
            </CardContent>
            <CardFooter className="pt-0">
              <div className="text-xs text-gray-500">Model: {selectedModel.name}</div>
            </CardFooter>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
