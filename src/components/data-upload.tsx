"use client";

import { useState } from 'react';
import { useAIModeStore } from '@/stores/aiModeStore';
import { localAIService } from '@/services/localAIService';
import { Button } from "@/components/ui/button"
import { processSurveyData } from '@/services/data-upload';
import { detectKpis } from '@/ai/flows/kpi-detection';
import { analyzeSentiment } from '@/ai/flows/sentiment-analysis';
import { thematicAnalysis } from '@/ai/flows/thematic-analysis';
import { useToast } from "@/hooks/use-toast"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"

// Define types for theme and sentiment data
interface Theme {
  theme: string;
  responses: string[];
}

interface SentimentScore {
  sentimentScore: number;
  sentimentLabel: string;
  reason?: string;
}

const DataUpload = () => {
  // We'll use getState() directly in the handleUpload function
  const [file, setFile] = useState<File | null>(null);
  const [surveyData, setSurveyData] = useState<any[]>([]);
  const [kpis, setKpis] = useState<string[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [sentimentScores, setSentimentScores] = useState<SentimentScore[]>([]);
  const { toast } = useToast()
  const [uploadProgress, setUploadProgress] = useState(0);
  const [npsScore, setNpsScore] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [processingTime, setProcessingTime] = useState<number | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
      resetAnalysis();
    }
  };

  const resetAnalysis = () => {
    setUploadProgress(0);
    setNpsScore(null);
    setSurveyData([]);
    setKpis([]);
    setThemes([]);
    setSentimentScores([]);
    setProcessingTime(null);
  };

  const calculateNPS = (data: any[]): number | null => {
    if (!data || data.length === 0) {
      return null;
    }

    try {
      // Assuming 'Q4' or a similar field represents satisfaction (e.g., Net Promoter Score question).
      const totalResponses = data.length;

      // Check if Q4 exists in the data
      const hasQ4 = data[0] && 'Q4' in data[0];

      if (!hasQ4) {
        console.warn('Q4 field not found in data for NPS calculation');
        return 0; // Default value
      }

      // Make sure we're handling string values safely
      const detractors = data.filter(item => {
        const q4Value = String(item['Q4'] || '');
        return q4Value === 'Dissatisfied' || q4Value === 'Neutral';
      }).length;

      const promoters = data.filter(item => {
        const q4Value = String(item['Q4'] || '');
        return q4Value === 'Very Satisfied';
      }).length;

      const calculatedNPS = Math.round(((promoters - detractors) / totalResponses) * 100);
      return calculatedNPS;
    } catch (error) {
      console.error('Error calculating NPS:', error);
      return 0; // Default value
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file first!",
      })
      return;
    }

    // Reset states
    setIsLoading(true);
    setUploadProgress(0);
    setProcessingTime(null);

    // Start timing the process
    const startTime = Date.now();

    // Check if local AI is selected and available
    const { isLocalAI, selectedModel, setModel } = useAIModeStore.getState();

    if (isLocalAI) {
      try {
        // Check if Ollama is running
        const checkResponse = await fetch('/api/check-local-ai');
        const checkData = await checkResponse.json();

        if (checkData.status === 'offline') {
          toast({
            variant: "destructive",
            title: "Local AI unavailable",
            description: checkData.error || "Ollama is not running. Please start Ollama or switch to Cloud AI.",
          });
          return;
        }

        // Check if the selected model is available
        if (checkData.models && !checkData.models.includes(selectedModel.id)) {
          // If the selected model is not available but we have other models
          if (checkData.availableRequiredModels && checkData.availableRequiredModels.length > 0) {
            const defaultModel = checkData.availableRequiredModels[0];
            const newModel = {
              id: defaultModel,
              name: defaultModel.split(':')[0].charAt(0).toUpperCase() + defaultModel.split(':')[0].slice(1),
              type: 'local' as const
            };

            // Update the model
            setModel(newModel);

            toast({
              title: "Model changed",
              description: `Model ${selectedModel.id} not available. Using ${defaultModel} instead.`,
            });
          } else if (checkData.missingModels && checkData.missingModels.length > 0) {
            // If no required models are available, suggest installing one
            toast({
              variant: "destructive",
              title: "No models available",
              description: `Please install a model with: ${checkData.installCommand}`,
            });
            return;
          }
        }
      } catch (checkError) {
        console.error("Error checking local AI status:", checkError);
        toast({
          variant: "destructive",
          title: "Local AI check failed",
          description: "Could not verify if Ollama is running. Proceeding anyway.",
        });
      }
    }

    try {
      const data = await processSurveyData(file);
      setSurveyData(data);
      setUploadProgress(25);

      // Ensure that surveyData is an array before proceeding
      if (!Array.isArray(data)) {
        console.error("Survey data is not an array:", data);
        toast({
          variant: "destructive",
          title: "Analysis failed",
          description: "Uploaded data is not in the correct format.",
        });
        setUploadProgress(0);
        return;
      }

      const { isLocalAI } = useAIModeStore.getState();

      // KPI Detection
      try {
        let kpiResult: { kpis: string[], explanation?: string };
        const kpiTimeout = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('KPI detection timed out after 5 minutes')), 300000);
        });

        if (isLocalAI) {
          // Use local AI for KPI detection with timeout
          kpiResult = await Promise.race([
            localAIService.detectKpis(data),
            kpiTimeout
          ]);
        } else {
          // Use cloud AI for KPI detection
          kpiResult = await detectKpis({ surveyData: data });
        }

        setKpis(kpiResult.kpis);
        setUploadProgress(50);
      } catch (kpiError: any) {
        console.error("KPI detection error:", kpiError);
        toast({
          variant: "destructive",
          title: "KPI Analysis failed",
          description: `Error analyzing KPIs: ${kpiError.message}`,
        });
        // Set default KPIs based on numeric columns
        try {
          // Find numeric columns in the data
          const numericColumns = Object.keys(data[0]).filter(key => {
            return !isNaN(Number(data[0][key])) && data[0][key] !== '';
          });
          setKpis(numericColumns.slice(0, 3)); // Use up to 3 numeric columns as KPIs
        } catch (fallbackError) {
          console.error("Failed to set fallback KPIs:", fallbackError);
        }
        setUploadProgress(50);
        // Continue with other analyses
      }

      // Thematic Analysis (example with first 5 responses)
      if (data.length > 0) {
        try {
          // Use more items for better thematic analysis
          const textData = data.slice(0, Math.min(8, data.length)).map(item => {
            // Create a more meaningful representation of the data
            const formattedItem: Record<string, any> = {};

            // Include all fields that might be relevant for thematic analysis
            Object.entries(item).forEach(([key, value]) => {
              // Skip numeric fields that are likely ratings
              if (typeof value === 'number' && value >= 0 && value <= 10) {
                return;
              }

              // Include text fields and categorical data
              if (typeof value === 'string' && value.trim().length > 0) {
                formattedItem[key] = value;
              }
            });

            return JSON.stringify(formattedItem);
          });

          let analysisResult: { themes: Theme[] };

          const themeTimeout = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Thematic analysis timed out after 5 minutes')), 300000);
          });

          if (isLocalAI) {
            // Use local AI for thematic analysis with timeout
            analysisResult = await Promise.race([
              localAIService.analyzeThemes(textData),
              themeTimeout
            ]);
          } else {
            // Use cloud AI for thematic analysis
            analysisResult = await thematicAnalysis({ verbatimResponses: textData });
          }

          setThemes(analysisResult.themes);
          setUploadProgress(75);
        } catch (themeError: any) {
          console.error("Thematic analysis error:", themeError);
          toast({
            variant: "destructive",
            title: "Thematic Analysis failed",
            description: `Error analyzing themes: ${themeError.message}`,
          });

          // Set a default theme
          setThemes([
            {
              theme: "General Feedback",
              responses: data.slice(0, 5).map(item => {
                // Ensure we're not passing objects directly
                try {
                  return JSON.stringify(item);
                } catch (e) {
                  return String(item);
                }
              })
            }
          ]);
          setUploadProgress(75);
          // Continue with other analyses
        }
      }

      // Sentiment Analysis (example with first 5 responses)
      if (data.length > 0) {
        try {
          const sentimentTimeout = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Sentiment analysis timed out after 5 minutes')), 300000);
          });

          // Use the first 3 items for sentiment analysis
          const sentimentPromises = data.slice(0, Math.min(3, data.length)).map(async (item, index) => {
            try {
              // Create a more meaningful representation for sentiment analysis
              const sentimentItem: Record<string, any> = {};

              // Include ratings and text feedback which are most relevant for sentiment
              Object.entries(item).forEach(([key, value]) => {
                // Include all numeric ratings
                if (typeof value === 'number') {
                  sentimentItem[key] = value;
                }

                // Include text fields that might contain sentiment
                if (typeof value === 'string' && value.trim().length > 0 &&
                    !['name', 'id', 'email', 'phone', 'address'].includes(key.toLowerCase())) {
                  sentimentItem[key] = value;
                }
              });

              const text = JSON.stringify(sentimentItem);

              if (isLocalAI) {
                // Use local AI for sentiment analysis with individual timeout
                return await Promise.race([
                  localAIService.analyzeSentiment(text),
                  new Promise<never>((_, reject) => {
                    setTimeout(() => reject(new Error(`Sentiment analysis for item ${index + 1} timed out`)), 60000);
                  })
                ]);
              } else {
                // Use cloud AI for sentiment analysis
                return await analyzeSentiment({ verbatimResponse: text });
              }
            } catch (itemError) {
              console.warn(`Error analyzing sentiment for item ${index + 1}:`, itemError);
              // Return a default sentiment score for this item
              return {
                sentimentScore: 0,
                sentimentLabel: 'Neutral',
                reason: 'Analysis failed or timed out'
              };
            }
          });

          // Use Promise.allSettled to handle individual failures
          const sentimentResults = await Promise.race([
            Promise.all(sentimentPromises),
            sentimentTimeout
          ]);

          setSentimentScores(sentimentResults);
        } catch (sentimentError: any) {
          console.error("Sentiment analysis error:", sentimentError);
          toast({
            variant: "destructive",
            title: "Sentiment Analysis failed",
            description: `Error analyzing sentiment: ${sentimentError.message}`,
          });

          // Set default sentiment scores
          setSentimentScores(data.slice(0, 3).map(item => {
            // Try to infer sentiment from text if possible
            const text = JSON.stringify(item).toLowerCase();
            let score = 0;
            let label = 'Neutral';

            // Simple keyword-based sentiment detection as fallback
            const positiveWords = ['good', 'great', 'excellent', 'happy', 'satisfied', 'like', 'love'];
            const negativeWords = ['bad', 'poor', 'terrible', 'unhappy', 'dissatisfied', 'dislike', 'hate'];

            const posMatches = positiveWords.filter(word => text.includes(word)).length;
            const negMatches = negativeWords.filter(word => text.includes(word)).length;

            if (posMatches > negMatches) {
              score = 0.5;
              label = 'Positive';
            } else if (negMatches > posMatches) {
              score = -0.5;
              label = 'Negative';
            }

            return {
              sentimentScore: score,
              sentimentLabel: label,
              reason: 'Fallback analysis based on keywords'
            };
          }));
        }
      }

      // Calculate NPS
      const calculatedNPS = calculateNPS(data);
      setNpsScore(calculatedNPS);

      // Calculate processing time
      const endTime = Date.now();
      const totalTime = (endTime - startTime) / 1000; // Convert to seconds
      setProcessingTime(totalTime);

      setUploadProgress(100);
      toast({
        title: "Upload successful",
        description: `Data processed in ${totalTime.toFixed(1)} seconds.`
      })

    } catch (error: any) {
      console.error("Error processing data:", error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: `Error processing data: ${error.message}`,
      })
      setUploadProgress(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if local AI is selected
  const { isLocalAI } = useAIModeStore();

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {isLocalAI && (
        <div className="bg-blue-50 p-4 rounded-md mb-4 text-sm text-blue-800 w-full max-w-2xl">
          <p className="font-semibold">Using Local AI (Ollama)</p>
          <p>Make sure Ollama is running on your machine. If you don't have it installed, <a href="https://ollama.com" target="_blank" rel="noopener noreferrer" className="underline">download it here</a>.</p>
          <p className="mt-1">After installing, run one of these commands in your terminal:</p>
          <pre className="bg-blue-100 p-2 rounded mt-1 overflow-x-auto">
            <code>ollama pull gemma3</code>
          </pre>
          <pre className="bg-blue-100 p-2 rounded mt-1 overflow-x-auto">
            <code>ollama pull mistral</code>
          </pre>
        </div>
      )}
      <input type="file" onChange={handleFileChange} className="mb-4" />
      <div className="flex gap-2">
        <Button
          onClick={handleUpload}
          disabled={file === null || isLoading}
          className="relative"
        >
          {isLoading ? (
            <>
              <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></span>
              Processing...
            </>
          ) : (
            'Upload and Analyze'
          )}
        </Button>

        {surveyData.length > 0 && (
          <Button
            variant="outline"
            onClick={resetAnalysis}
            disabled={isLoading}
          >
            Reset
          </Button>
        )}
      </div>

      {(uploadProgress > 0 || isLoading) && (
        <div className="w-full mt-4">
          <Progress value={uploadProgress} className={isLoading ? "animate-pulse" : ""} />
          <div className="flex justify-between text-sm mt-1">
            <div>
              <p>Processing data: {uploadProgress}%</p>
              <p className="text-xs text-gray-500 mt-1">
                Using {useAIModeStore.getState().selectedModel.name} ({useAIModeStore.getState().isLocalAI ? 'Local' : 'Cloud'} AI)
              </p>
            </div>
            {processingTime !== null && (
              <p className="text-green-600">Completed in {processingTime.toFixed(1)} seconds</p>
            )}
          </div>
        </div>
      )}

      {npsScore !== null && (
        <div className="mt-4">
          <h3 className="text-xl font-semibold mb-2">Net Promoter Score (NPS)</h3>
          <p className="text-2xl font-bold">{npsScore}</p>
          {npsScore >= 70 && <p className="text-green-500">Excellent!</p>}
          {npsScore >= 50 && npsScore < 70 && <p className="text-yellow-500">Good</p>}
          {npsScore >= 0 && npsScore < 50 && <p className="text-orange-500">Okay</p>}
          {npsScore < 0 && <p className="text-red-500">Needs Improvement</p>}
        </div>
      )}

      {surveyData.length > 0 && (
        <div className="mt-8 w-full">
          <h2 className="text-xl font-semibold mb-2">Analysis Results</h2>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Key Performance Indicators</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px] w-full">
                  {kpis.length > 0 ? (
                    <ul>
                      {kpis.map((kpi, index) => (
                        <li key={index} className="text-sm">
                          {typeof kpi === 'object' ? JSON.stringify(kpi) : String(kpi)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm">No KPIs detected.</p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Thematic Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-auto w-full">
                  {themes.length > 0 ? (
                    <ul>
                      {themes.map((theme, index) => (
                        <li key={index} className="mb-4">
                          <strong className="block font-medium">{theme.theme}</strong>
                          <ul>
                            {theme.responses.map((response: any, rIndex: number) => (
                              <li key={rIndex} className="text-sm">
                                {typeof response === 'object' ? JSON.stringify(response) : String(response)}
                              </li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm">No themes analyzed.</p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sentiment Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px] w-full">
                  {sentimentScores.length > 0 ? (
                    <ul>
                      {sentimentScores.map((sentiment, index) => (
                        <li key={index} className="text-sm">
                          <strong>Sentiment:</strong> {String(sentiment.sentimentLabel)} (Score: {typeof sentiment.sentimentScore === 'number' ? sentiment.sentimentScore.toFixed(2) : String(sentiment.sentimentScore)})
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm">No sentiments analyzed.</p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataUpload;
