"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useAIModeStore } from '@/stores/aiModeStore';
import { localAIService } from '@/services/localAIService';
import { comprehensiveAnalysis } from '@/ai/flows/comprehensive-analysis';
import { sampleDisplayData, sampleAnalysisData } from '@/utils/sample-survey-data';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SUPPORTED_LANGUAGES, SupportedLanguage, getLanguageName } from '@/types/language';
import { AI_MODELS, type AIModel } from '@/types/ai';

// Define types for theme and sentiment data
interface Theme {
  theme: string;
  responses: string[];
  sentiment?: number;
}

interface KPI {
  name: string;
  importance: number;
  correlation: number;
}

interface SentimentScore {
  sentimentScore: number;
  sentimentLabel: string;
  reason?: string;
}

interface CategorizedComments {
  positive: string[];
  neutral: string[];
  negative: string[];
}

interface SentimentDistribution {
  positive: number;
  neutral: number;
  negative: number;
}

interface OverallSentiment {
  score: number;
  distribution: SentimentDistribution;
  commentCount: number;
  categorizedComments: CategorizedComments;
}

interface NPS {
  score: number;
  promoters: number;
  passives: number;
  detractors: number;
}

interface AnalysisResult {
  kpis: KPI[];
  themes: Theme[];
  overallSentiment: OverallSentiment;
  nps?: NPS;
}

export default function AISurveyDemoPage() {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const [language, setLanguage] = useState<SupportedLanguage>("en");
  const [error, setError] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const { isLocalAI, selectedModel, setModel } = useAIModeStore();

  // Check Ollama status when component mounts or AI mode changes
  useEffect(() => {
    if (isLocalAI) {
      checkOllamaStatus();
    }
  }, [isLocalAI]);

  // Function to check if Ollama is running and get available models
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

  // Function to handle model selection
  const handleModelSelect = (modelId: string) => {
    const model = AI_MODELS.find(m => m.id === modelId) || {
      id: modelId,
      name: modelId.split(':')[0].charAt(0).toUpperCase() + modelId.split(':')[0].slice(1),
      type: 'local' as const
    };
    setModel(model);
  };

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  const SENTIMENT_COLORS = {
    positive: '#4ade80',
    neutral: '#a1a1aa',
    negative: '#f87171'
  };

  // Function to run the AI analysis
  const runAnalysis = async () => {
    // The AI model selection is handled through the useAIModeStore
    // When a user selects a model in the UI, it updates the global store
    // The localAIService and cloud AI services then use the selected model from the store

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setError(null);
    setProcessingTime(null);

    const startTime = Date.now();

    try {
      // Extract verbatim responses from the data
      const verbatimResponses = sampleAnalysisData
        .map(item => item.Feedback)
        .filter(feedback => typeof feedback === 'string' && feedback.trim().length > 0) as string[];

      setAnalysisProgress(25);

      // Call the comprehensive analysis
      let analysisResult;
      if (isLocalAI) {
        // Check if Ollama is running
        if (ollamaStatus === 'offline') {
          setError("Ollama is not running. Please start Ollama to use local AI models.");
          setIsAnalyzing(false);
          return;
        }

        // Check if there are available models
        if (availableModels.length === 0) {
          setError("No models available. Please pull a model using Ollama CLI.");
          setIsAnalyzing(false);
          return;
        }

        // Use local AI for comprehensive analysis
        try {
          // The localAIService already uses the selectedModel from the store
          analysisResult = await localAIService.comprehensiveAnalysis(
            sampleAnalysisData,
            verbatimResponses,
            language
          );
        } catch (localError: any) {
          console.error("Local AI error:", localError);
          setError(`Local AI error: ${localError.message || 'Unknown error'}. Make sure Ollama is running.`);
          setIsAnalyzing(false);
          return;
        }
      } else {
        // Use cloud AI for comprehensive analysis
        try {
          // The cloud AI service doesn't accept a model parameter directly
          analysisResult = await comprehensiveAnalysis({
            surveyData: sampleAnalysisData,
            verbatimResponses: verbatimResponses,
            language: language
          });
        } catch (cloudError: any) {
          console.error("Cloud AI error:", cloudError);
          setError(`Cloud AI error: ${cloudError.message || 'Unknown error'}`);
          setIsAnalyzing(false);
          return;
        }
      }

      setAnalysisProgress(75);

      // Set the analysis result
      setAnalysisResult(analysisResult);

      // Calculate processing time
      const endTime = Date.now();
      const totalTime = (endTime - startTime) / 1000; // Convert to seconds
      setProcessingTime(totalTime);

      setAnalysisProgress(100);

      toast({
        title: "Analysis complete",
        description: `Analysis completed in ${totalTime.toFixed(1)} seconds.`
      });
    } catch (error: any) {
      console.error("Error during analysis:", error);
      setError(`Error during analysis: ${error.message || 'Unknown error'}`);
      toast({
        variant: "destructive",
        title: "Analysis failed",
        description: `Error: ${error.message || 'Unknown error'}`
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Function to render the KPI chart
  const renderKPIChart = () => {
    if (!analysisResult?.kpis || analysisResult.kpis.length === 0) return null;

    const data = analysisResult.kpis.map((kpi, index) => ({
      name: kpi.name,
      importance: kpi.importance,
      correlation: kpi.correlation,
      color: COLORS[index % COLORS.length]
    }));

    return (
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="importance" name="Importance" fill="#8884d8" />
            <Bar dataKey="correlation" name="Correlation" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Function to render the sentiment distribution chart
  const renderSentimentChart = () => {
    if (!analysisResult?.overallSentiment?.distribution) return null;

    const { distribution } = analysisResult.overallSentiment;

    const data = [
      { name: 'Positive', value: distribution.positive },
      { name: 'Neutral', value: distribution.neutral },
      { name: 'Negative', value: distribution.negative }
    ];

    return (
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.name === 'Positive' ? SENTIMENT_COLORS.positive :
                    entry.name === 'Neutral' ? SENTIMENT_COLORS.neutral :
                    SENTIMENT_COLORS.negative
                  }
                />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value}%`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Function to render the NPS chart
  const renderNPSChart = () => {
    if (!analysisResult?.nps) return null;

    const { nps } = analysisResult;

    const data = [
      { name: 'Promoters', value: nps.promoters },
      { name: 'Passives', value: nps.passives },
      { name: 'Detractors', value: nps.detractors }
    ];

    return (
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              <Cell key="cell-0" fill="#4ade80" />
              <Cell key="cell-1" fill="#a1a1aa" />
              <Cell key="cell-2" fill="#f87171" />
            </Pie>
            <Tooltip formatter={(value) => `${value}%`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-2">AI Survey Analyzer Demo</h1>
      <p className="text-gray-600 mb-8">
        Test the AI survey analyzer with sample data to see how it works.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Sample Data</CardTitle>
            <CardDescription>
              Preview of the sample survey data that will be analyzed
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64 overflow-auto">
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left font-medium p-2 border-b">ID</th>
                    <th className="text-left font-medium p-2 border-b">Satisfaction</th>
                    <th className="text-left font-medium p-2 border-b">Recommendation</th>
                    <th className="text-left font-medium p-2 border-b">Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleDisplayData.map((item, index) => (
                    <tr key={index} className="hover:bg-muted/50 border-b">
                      <td className="p-2">{item.ResponseID}</td>
                      <td className="p-2">{item.Satisfaction}/5</td>
                      <td className="p-2">{item.Recommendation}/10</td>
                      <td className="p-2 truncate max-w-[200px]">{item.Feedback}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Note: This is a preview of 5 responses. The analysis will use a larger dataset of 50 responses.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Configuration</CardTitle>
            <CardDescription>
              Configure the AI settings for the analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Badge variant={isLocalAI ? "secondary" : "default"} className="mb-2">
                  {isLocalAI ? 'Using Local AI (Ollama)' : 'Using Cloud AI'}
                </Badge>
                <p className="text-sm text-gray-500">
                  {isLocalAI
                    ? 'Analysis will be performed using your local Ollama instance.'
                    : 'Analysis will be performed using cloud AI services.'}
                </p>
              </div>

              {/* AI Model Selection */}
              <div>
                <Label htmlFor="ai-model" className="mb-2 block">AI Model</Label>
                {isLocalAI ? (
                  ollamaStatus === 'checking' ? (
                    <div className="text-sm text-gray-500">Checking available models...</div>
                  ) : ollamaStatus === 'offline' ? (
                    <div className="text-sm text-red-500">
                      Ollama is not running. Please start Ollama to use local AI models.
                    </div>
                  ) : availableModels.length === 0 ? (
                    <div className="text-sm text-amber-500">
                      No models available. Please pull a model using Ollama CLI.
                    </div>
                  ) : (
                    <Select
                      value={selectedModel.id}
                      onValueChange={handleModelSelect}
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
                  )
                ) : (
                  <Select
                    value={selectedModel.id}
                    onValueChange={(value) => {
                      const model = AI_MODELS.find(m => m.id === value && m.type === 'cloud');
                      if (model) setModel(model);
                    }}
                  >
                    <SelectTrigger id="ai-model" className="w-full">
                      <SelectValue placeholder="Select Model" />
                    </SelectTrigger>
                    <SelectContent>
                      {AI_MODELS.filter(model => model.type === 'cloud').map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  Currently using: <span className="font-semibold">{selectedModel.name}</span>
                </div>
              </div>

              {/* Language Selection */}
              <div>
                <Label htmlFor="language-select" className="mb-2 block">Survey Language</Label>
                <Select
                  value={language}
                  onValueChange={(value) => setLanguage(value as SupportedLanguage)}
                >
                  <SelectTrigger id="language-select" className="w-full">
                    <SelectValue placeholder="Select Language" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <SelectItem key={lang.id} value={lang.id}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={runAnalysis}
              disabled={isAnalyzing}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Run AI Analysis'
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
            <CardDescription>
              Understanding the AI survey analysis process
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64 overflow-auto">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">1. Data Processing</h3>
                <p className="text-sm text-gray-600">
                  The AI processes both numerical ratings and open-ended text responses from the survey data.
                </p>
              </div>

              <div>
                <h3 className="font-semibold">2. KPI Detection</h3>
                <p className="text-sm text-gray-600">
                  The AI identifies the most important metrics (KPIs) by analyzing correlations between different numerical ratings.
                </p>
              </div>

              <div>
                <h3 className="font-semibold">3. Thematic Analysis</h3>
                <p className="text-sm text-gray-600">
                  Open-ended responses are categorized into themes using natural language processing.
                </p>
              </div>

              <div>
                <h3 className="font-semibold">4. Sentiment Analysis</h3>
                <p className="text-sm text-gray-600">
                  The AI evaluates the sentiment of each response and calculates overall sentiment distribution.
                </p>
              </div>

              <div>
                <h3 className="font-semibold">5. NPS Calculation</h3>
                <p className="text-sm text-gray-600">
                  Net Promoter Score is calculated based on recommendation ratings (0-10).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isAnalyzing && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Analysis in Progress</CardTitle>
            <CardDescription>
              Please wait while the AI analyzes the survey data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={analysisProgress} className="mb-2" />
            <p className="text-sm text-gray-500">
              {analysisProgress < 25 && "Preparing data..."}
              {analysisProgress >= 25 && analysisProgress < 75 && "AI analyzing survey responses..."}
              {analysisProgress >= 75 && "Finalizing results..."}
            </p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive" className="mb-8">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {analysisResult && (
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle2 className="h-5 w-5 mr-2 text-green-600" />
                Analysis Complete
              </CardTitle>
              <CardDescription>
                {processingTime && `Analysis completed in ${processingTime.toFixed(1)} seconds`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="kpis">KPI Analysis</TabsTrigger>
                  <TabsTrigger value="themes">Thematic Analysis</TabsTrigger>
                  <TabsTrigger value="sentiment">Sentiment Analysis</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Survey Overview</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Total Responses:</span>
                            <span className="font-bold">{sampleAnalysisData.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Comments Analyzed:</span>
                            <span className="font-bold">{analysisResult.overallSentiment.commentCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Overall Sentiment:</span>
                            <span className="font-bold">
                              {analysisResult.overallSentiment.score > 0.2 ? 'Positive' :
                               analysisResult.overallSentiment.score < -0.2 ? 'Negative' : 'Neutral'}
                            </span>
                          </div>
                          {analysisResult.nps && (
                            <div className="flex justify-between">
                              <span>Net Promoter Score:</span>
                              <span className="font-bold">{analysisResult.nps.score}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Sentiment Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {renderSentimentChart()}
                      </CardContent>
                    </Card>

                    {analysisResult.nps && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">NPS Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {renderNPSChart()}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="kpis" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Key Performance Indicators</CardTitle>
                      <CardDescription>
                        The most important metrics identified by the AI
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {renderKPIChart()}

                      <div className="mt-6 space-y-4">
                        <h3 className="font-semibold">KPI Details</h3>
                        <div className="space-y-4">
                          {analysisResult.kpis.map((kpi, index) => (
                            <div key={index} className="border rounded-md p-4">
                              <div className="font-medium">{kpi.name}</div>
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                <div>
                                  <div className="text-sm text-gray-500">Importance</div>
                                  <div className="font-semibold">{(kpi.importance * 100).toFixed(1)}%</div>
                                </div>
                                <div>
                                  <div className="text-sm text-gray-500">Correlation</div>
                                  <div className="font-semibold">{kpi.correlation.toFixed(2)}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="themes" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Thematic Analysis</CardTitle>
                      <CardDescription>
                        Key themes identified in the open-ended responses
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {analysisResult.themes.map((theme, index) => (
                          <div key={index} className="border rounded-md p-4">
                            <div className="flex justify-between items-center mb-2">
                              <div className="font-medium text-lg">{theme.theme}</div>
                              {theme.sentiment !== undefined && (
                                <Badge
                                  variant="outline"
                                  className={
                                    theme.sentiment > 0.2 ? 'bg-green-50 text-green-700 border-green-200' :
                                    theme.sentiment < -0.2 ? 'bg-red-50 text-red-700 border-red-200' :
                                    'bg-gray-50 text-gray-700 border-gray-200'
                                  }
                                >
                                  Sentiment: {theme.sentiment.toFixed(2)}
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 mb-2">
                              {theme.responses.length} responses
                            </div>
                            <div className="space-y-2 mt-4">
                              <h4 className="font-medium">Sample Responses:</h4>
                              <ul className="space-y-2">
                                {theme.responses.slice(0, 3).map((response, responseIndex) => (
                                  <li key={responseIndex} className="text-sm bg-gray-50 p-2 rounded">
                                    "{response}"
                                  </li>
                                ))}
                              </ul>
                              {theme.responses.length > 3 && (
                                <div className="text-xs text-gray-500">
                                  + {theme.responses.length - 3} more responses
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="sentiment" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Sentiment Analysis</CardTitle>
                      <CardDescription>
                        Analysis of sentiment in survey responses
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="border rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold mb-1">
                            {analysisResult.overallSentiment.distribution.positive.toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-500 mb-3">
                            Positive Sentiment
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200 px-3 py-1"
                          >
                            Positive
                          </Badge>
                        </div>
                        <div className="border rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold mb-1">
                            {analysisResult.overallSentiment.distribution.neutral.toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-500 mb-3">
                            Neutral Sentiment
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-gray-50 text-gray-700 border-gray-200 px-3 py-1"
                          >
                            Neutral
                          </Badge>
                        </div>
                        <div className="border rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold mb-1">
                            {analysisResult.overallSentiment.distribution.negative.toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-500 mb-3">
                            Negative Sentiment
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-red-50 text-red-700 border-red-200 px-3 py-1"
                          >
                            Negative
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="font-semibold">Sample Comments by Sentiment</h3>

                        <div className="space-y-6">
                          {/* Positive Comments */}
                          <div>
                            <h4 className="font-medium text-green-700 mb-2">Positive Comments</h4>
                            <div className="space-y-2">
                              {analysisResult.overallSentiment.categorizedComments.positive.slice(0, 3).map((comment, index) => (
                                <div key={index} className="bg-green-50 p-3 rounded-md text-sm">
                                  "{comment}"
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Neutral Comments */}
                          <div>
                            <h4 className="font-medium text-gray-700 mb-2">Neutral Comments</h4>
                            <div className="space-y-2">
                              {analysisResult.overallSentiment.categorizedComments.neutral.slice(0, 3).map((comment, index) => (
                                <div key={index} className="bg-gray-50 p-3 rounded-md text-sm">
                                  "{comment}"
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Negative Comments */}
                          <div>
                            <h4 className="font-medium text-red-700 mb-2">Negative Comments</h4>
                            <div className="space-y-2">
                              {analysisResult.overallSentiment.categorizedComments.negative.slice(0, 3).map((comment, index) => (
                                <div key={index} className="bg-red-50 p-3 rounded-md text-sm">
                                  "{comment}"
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
