"use client";

import { useState, useEffect } from 'react';
import { useAIModeStore } from '@/stores/aiModeStore';
import { localAIService } from '@/services/localAIService';
import { Button } from "@/components/ui/button"
import { processSurveyData } from '@/services/data-upload';
import { comprehensiveAnalysis } from '@/ai/flows/comprehensive-analysis';
import { useToast } from "@/hooks/use-toast"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { SUPPORTED_LANGUAGES, SupportedLanguage, getLanguageName } from '@/types/language';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";

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

interface CommentItem {
  comment: string;
  sentiment: string;
  color: string;
}

// Paginated comments table component
const CommentsTable = ({ comments }: { comments: CommentItem[] }) => {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Ensure comments is always an array, even if empty
  const safeComments = Array.isArray(comments) ? comments : [];
  const totalPages = Math.max(1, Math.ceil(safeComments.length / pageSize));

  // Reset to page 1 when comments change
  useEffect(() => {
    setPage(1);
  }, [safeComments.length, safeComments[0]?.sentiment]);

  // Ensure page is within valid range
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  // Get current page of comments with safety checks
  const currentComments = safeComments.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if there are few
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate start and end of visible pages
      let start = Math.max(2, page - 1);
      let end = Math.min(totalPages - 1, page + 1);

      // Adjust if we're near the beginning or end
      if (page <= 3) {
        end = Math.min(totalPages - 1, 4);
      } else if (page >= totalPages - 2) {
        start = Math.max(2, totalPages - 3);
      }

      // Add ellipsis after first page if needed
      if (start > 2) {
        pages.push('ellipsis1');
      }

      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis before last page if needed
      if (end < totalPages - 1) {
        pages.push('ellipsis2');
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // Create a stable structure for the table
  const renderTable = () => {
    // Ensure we always have exactly 3 columns
    return (
      <div className="rounded-md border overflow-hidden">
        <table className="w-full table-fixed">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left font-medium p-2 border-b w-16">#</th>
              <th className="text-left font-medium p-2 border-b">Comment</th>
              <th className="text-left font-medium p-2 border-b w-28">Sentiment</th>
            </tr>
          </thead>
          <tbody>
            {currentComments.length > 0 ? (
              currentComments.map((item, index) => (
                <tr key={index} className="hover:bg-muted/50 border-b">
                  <td className="p-2 align-top">{(page - 1) * pageSize + index + 1}</td>
                  <td className="p-2 align-top break-words">{item.comment}</td>
                  <td className="p-2 align-top">
                    <div className="flex items-center">
                      <span
                        className="inline-block w-3 h-3 rounded-full mr-2 flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      ></span>
                      <span className="truncate">{item.sentiment}</span>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="p-4 text-center text-muted-foreground">
                  No comments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      {renderTable()}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Showing {currentComments.length} of {safeComments.length} comments
          </div>

          <Pagination>
            <PaginationContent>
              {page > 1 && (
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage(page - 1);
                    }}
                  />
                </PaginationItem>
              )}

              {getPageNumbers().map((pageNum, i) => (
                <PaginationItem key={i}>
                  {pageNum === 'ellipsis1' || pageNum === 'ellipsis2' ? (
                    <span className="flex h-9 w-9 items-center justify-center">...</span>
                  ) : (
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(Number(pageNum));
                      }}
                      isActive={page === pageNum}
                    >
                      {pageNum}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              {page < totalPages && (
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage(page + 1);
                    }}
                  />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

const DataUpload = () => {
  // We'll use getState() directly in the handleUpload function
  const [file, setFile] = useState<File | null>(null);
  const [surveyData, setSurveyData] = useState<any[]>([]);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [sentimentScores, setSentimentScores] = useState<SentimentScore[]>([]);
  const { toast } = useToast()
  const [uploadProgress, setUploadProgress] = useState(0);
  const [npsScore, setNpsScore] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  // Removed unused timer state
  const [language, setLanguage] = useState<SupportedLanguage>("en");
  const [detectedLanguage, setDetectedLanguage] = useState<SupportedLanguage | null>(null);

  // Comment analysis states
  const [totalComments, setTotalComments] = useState<number>(0);
  const [sentimentDistribution, setSentimentDistribution] = useState<
    { name: string; value: number; color: string }[]
  >([
    { name: 'Positive', value: 0, color: '#4ade80' },  // Green
    { name: 'Neutral', value: 0, color: '#facc15' },   // Yellow
    { name: 'Negative', value: 0, color: '#f87171' },  // Red
  ]);

  // Categorized comments state
  const [categorizedComments, setCategorizedComments] = useState<CategorizedComments>({
    positive: [],
    neutral: [],
    negative: []
  });

  // Selected category for filtering comments
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Simple language detection based on sample text
  const detectLanguage = (text: string): SupportedLanguage => {
    // This is a very basic detection - in a real app, you would use a proper language detection library
    const langPatterns: Record<SupportedLanguage, RegExp> = {
      fr: /\b(je|tu|nous|vous|ils|elles|le|la|les|un|une|des|du|au|aux|est|sont|ont|être|avoir)\b/i,
      es: /\b(yo|tu|el|ella|nosotros|vosotros|ellos|ellas|el|la|los|las|un|una|unos|unas|es|son|estar|ser|tener)\b/i,
      de: /\b(ich|du|er|sie|es|wir|ihr|sie|der|die|das|ein|eine|ist|sind|sein|haben)\b/i,
      it: /\b(io|tu|lui|lei|noi|voi|loro|il|la|i|le|un|una|è|sono|essere|avere)\b/i,
      pt: /\b(eu|tu|ele|ela|nós|vós|eles|elas|o|a|os|as|um|uma|uns|umas|é|são|ser|estar|ter)\b/i,
      zh: /[\u4e00-\u9fff]/,
      ja: /[\u3040-\u309f\u30a0-\u30ff]/,
      ko: /[\uac00-\ud7af\u1100-\u11ff]/,
      ar: /[\u0600-\u06ff]/,
      ru: /[\u0400-\u04ff]/,
      en: /^$/ // Default pattern that won't match anything
    };

    // Check for each language pattern
    for (const [lang, pattern] of Object.entries(langPatterns)) {
      if (pattern.test(text)) {
        return lang as SupportedLanguage;
      }
    }

    // Default to English if no pattern matches
    return "en";
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);
      resetAnalysis();

      // Try to detect language from file content
      try {
        // Read a sample of the file to detect language
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            const text = e.target.result.toString();
            const sample = text.slice(0, 1000); // Take first 1000 chars for detection
            const detected = detectLanguage(sample);
            setDetectedLanguage(detected);
            setLanguage(detected); // Set the detected language as current

            toast({
              title: "Language detected",
              description: `Detected language: ${getLanguageName(detected)}`,
            });
          }
        };
        reader.readAsText(selectedFile);
      } catch (error) {
        console.error("Error detecting language:", error);
        // Default to English if detection fails
        setDetectedLanguage("en");
        setLanguage("en");
      }
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
    setTotalComments(0);
    setSentimentDistribution([
      { name: 'Positive', value: 0, color: '#4ade80' },
      { name: 'Neutral', value: 0, color: '#facc15' },
      { name: 'Negative', value: 0, color: '#f87171' },
    ]);
    setCategorizedComments({
      positive: [],
      neutral: [],
      negative: []
    });
    setSelectedCategory(null);
  };

  // Function to analyze all comments and count sentiment distribution
  const analyzeAllComments = (data: any[]) => {
    if (!data || data.length === 0) return;

    console.log(`Analyzing sentiment for ${data.length} rows of data`);

    // Initialize counters
    let commentCount = 0;
    let positiveCount = 0;
    let neutralCount = 0;
    let negativeCount = 0;

    // For categorizing comments
    const positiveComments: string[] = [];
    const neutralComments: string[] = [];
    const negativeComments: string[] = [];

    // Check if we have a structured survey with customer_feedback array
    // This handles the case where the data is a single object with a customer_feedback array
    if (data.length === 1 && data[0].customer_feedback && Array.isArray(data[0].customer_feedback)) {
      const comments = data[0].customer_feedback;
      commentCount = comments.length;

      // Analyze each comment
      comments.forEach((comment: string) => {
        if (typeof comment === 'string' && comment.trim().length > 0) {
          // Simple sentiment analysis based on keywords
          const text = comment.toLowerCase();
          const positiveWords = ['good', 'great', 'excellent', 'happy', 'satisfied', 'like', 'love', 'best', 'awesome', 'j\'aime', 'bien', 'polis'];
          const negativeWords = ['bad', 'poor', 'terrible', 'unhappy', 'dissatisfied', 'dislike', 'hate', 'worst', 'awful', 'plante', 'trop', 'queue', 'heures'];

          const posMatches = positiveWords.filter(word => text.includes(word)).length;
          const negMatches = negativeWords.filter(word => text.includes(word)).length;

          if (posMatches > negMatches) {
            positiveCount++;
            positiveComments.push(comment);
          } else if (negMatches > posMatches) {
            negativeCount++;
            negativeComments.push(comment);
          } else {
            neutralCount++;
            neutralComments.push(comment);
          }
        }
      });
    } else {
      // Fallback for traditional survey data format (array of response objects)
      // Look for comment fields in each response
      data.forEach(item => {
        // First check if this item has a comments or feedback field
        const commentFields = ['comment', 'comments', 'feedback', 'suggestion', 'suggestions', 'review', 'reviews', 'opinion', 'opinions'];

        let foundComments = false;

        // Check for dedicated comment fields first
        for (const field of commentFields) {
          if (item[field] && typeof item[field] === 'string' && item[field].trim().length > 0) {
            commentCount++;
            foundComments = true;

            // Analyze sentiment
            const text = item[field].toLowerCase();
            const positiveWords = ['good', 'great', 'excellent', 'happy', 'satisfied', 'like', 'love', 'best', 'awesome'];
            const negativeWords = ['bad', 'poor', 'terrible', 'unhappy', 'dissatisfied', 'dislike', 'hate', 'worst', 'awful'];

            const posMatches = positiveWords.filter(word => text.includes(word)).length;
            const negMatches = negativeWords.filter(word => text.includes(word)).length;

            if (posMatches > negMatches) {
              positiveCount++;
              positiveComments.push(text);
            } else if (negMatches > posMatches) {
              negativeCount++;
              negativeComments.push(text);
            } else {
              neutralCount++;
              neutralComments.push(text);
            }
          }
        }

        // If no dedicated comment fields, look for any text fields that might be comments
        if (!foundComments) {
          Object.entries(item).forEach(([key, value]) => {
            if (typeof value === 'string' && value.trim().length > 20 && // Longer text is more likely to be a comment
                !['name', 'id', 'email', 'phone', 'address', 'title'].includes(key.toLowerCase())) {
              commentCount++;

              // Simple sentiment analysis based on keywords
              const text = value.toLowerCase();
              const positiveWords = ['good', 'great', 'excellent', 'happy', 'satisfied', 'like', 'love', 'best', 'awesome'];
              const negativeWords = ['bad', 'poor', 'terrible', 'unhappy', 'dissatisfied', 'dislike', 'hate', 'worst', 'awful'];

              const posMatches = positiveWords.filter(word => text.includes(word)).length;
              const negMatches = negativeWords.filter(word => text.includes(word)).length;

              if (posMatches > negMatches) {
                positiveCount++;
                positiveComments.push(value);
              } else if (negMatches > posMatches) {
                negativeCount++;
                negativeComments.push(value);
              } else {
                neutralCount++;
                neutralComments.push(value);
              }
            }
          });
        }
      });
    }

    // Update state with the counts
    setTotalComments(commentCount);
    setSentimentDistribution([
      { name: 'Positive', value: positiveCount, color: '#4ade80' },
      { name: 'Neutral', value: neutralCount, color: '#facc15' },
      { name: 'Negative', value: negativeCount, color: '#f87171' },
    ]);

    // Update categorized comments
    setCategorizedComments({
      positive: positiveComments,
      neutral: neutralComments,
      negative: negativeComments
    });
  };

  // Handle chart segment click to filter comments
  const handleChartClick = (data: any) => {
    if (data && data.name) {
      // If clicking the same category, toggle it off
      if (selectedCategory === data.name.toLowerCase()) {
        setSelectedCategory(null);
      } else {
        // Otherwise, set the new category
        setSelectedCategory(data.name.toLowerCase());
      }
    }
  };

  const calculateNPS = (data: any[]): number | null => {
    if (!data || data.length === 0) {
      return null;
    }

    try {
      // Check if this is a structured survey with metrics
      if (data.length === 1 && data[0].metrics && data[0].metrics.net_promoter_score !== undefined) {
        // Use the pre-calculated NPS from the metrics
        return data[0].metrics.net_promoter_score;
      }

      // Traditional survey data format
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

      // Comprehensive Analysis - use AI for all analysis in one call
      try {
        // Extract verbatim responses from the data
        let verbatimResponses: string[] = [];

        // Log the total number of rows for debugging
        console.log(`Processing ${data.length} total rows of survey data`);

        // Check if this is a structured survey with customer_feedback
        if (data.length === 1 && data[0].customer_feedback && Array.isArray(data[0].customer_feedback)) {
          verbatimResponses = data[0].customer_feedback.map(String);
          console.log(`Found ${verbatimResponses.length} comments in customer_feedback array`);
        } else {
          // Extract text fields from traditional survey data
          verbatimResponses = data.flatMap(item => {
            const responses: string[] = [];
            Object.entries(item).forEach(([key, value]) => {
              if (typeof value === 'string' &&
                  value.trim().length > 10 && // Longer text is more likely to be a comment
                  !['name', 'id', 'email', 'phone', 'address'].includes(key.toLowerCase())) {
                responses.push(value);
              }
            });
            return responses;
          });
          console.log(`Extracted ${verbatimResponses.length} comments from ${data.length} survey rows`);
        }

        // Set the total comments count immediately
        setTotalComments(verbatimResponses.length);

        setUploadProgress(25);

        // Set a timeout for the comprehensive analysis
        const analysisTimeout = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Comprehensive analysis timed out after 5 minutes')), 300000);
        });

        // Call the comprehensive analysis
        let analysisResult;
        if (isLocalAI) {
          // Use local AI for comprehensive analysis
          analysisResult = await Promise.race([
            localAIService.comprehensiveAnalysis(data, verbatimResponses, language),
            analysisTimeout
          ]);
        } else {
          // Use cloud AI for comprehensive analysis
          analysisResult = await comprehensiveAnalysis({
            surveyData: data,
            verbatimResponses: verbatimResponses,
            language: language
          });
        }

        // Update all states with the analysis results
        setUploadProgress(75);

        // Set KPIs
        if (analysisResult.kpis && Array.isArray(analysisResult.kpis)) {
          setKpis(analysisResult.kpis);
        }

        // Set themes
        if (analysisResult.themes && Array.isArray(analysisResult.themes)) {
          setThemes(analysisResult.themes);
        }

        // Set sentiment scores
        if (analysisResult.themes && Array.isArray(analysisResult.themes)) {
          // Create sentiment scores from theme sentiments
          const sentimentScores = analysisResult.themes.slice(0, 3).map((theme: { theme: string, sentiment: number }) => {
            return {
              sentimentScore: theme.sentiment,
              sentimentLabel: theme.sentiment > 0.2 ? 'Positive' : (theme.sentiment < -0.2 ? 'Negative' : 'Neutral'),
              reason: `Sentiment for theme: ${theme.theme}`
            };
          });
          setSentimentScores(sentimentScores);
        }

        // Set NPS if available
        if (analysisResult.nps) {
          setNpsScore(analysisResult.nps.score);
        } else {
          // If NPS not provided by AI, try to calculate it from the data
          const calculatedNPS = calculateNPS(data);
          setNpsScore(calculatedNPS);
        }

        // Set sentiment distribution and categorized comments
        if (analysisResult.overallSentiment && analysisResult.overallSentiment.distribution) {
          const distribution = analysisResult.overallSentiment.distribution;
          setSentimentDistribution([
            { name: 'Positive', value: Math.round(distribution.positive), color: '#4ade80' },
            { name: 'Neutral', value: Math.round(distribution.neutral), color: '#facc15' },
            { name: 'Negative', value: Math.round(distribution.negative), color: '#f87171' },
          ]);

          // Set total comments count
          if (analysisResult.overallSentiment.commentCount) {
            setTotalComments(analysisResult.overallSentiment.commentCount);
          } else {
            setTotalComments(verbatimResponses.length);
          }

          // Set categorized comments if available
          if (analysisResult.overallSentiment.categorizedComments) {
            setCategorizedComments(analysisResult.overallSentiment.categorizedComments);
          } else {
            // Create basic categorization based on themes
            const positive: string[] = [];
            const neutral: string[] = [];
            const negative: string[] = [];

            if (analysisResult.themes && Array.isArray(analysisResult.themes)) {
              analysisResult.themes.forEach((theme: { sentiment?: number, responses?: string[] }) => {
                if (theme.sentiment && theme.responses) {
                  if (theme.sentiment > 0.2) {
                    positive.push(...theme.responses);
                  } else if (theme.sentiment < -0.2) {
                    negative.push(...theme.responses);
                  } else {
                    neutral.push(...theme.responses);
                  }
                }
              });
            }

            setCategorizedComments({
              positive,
              neutral,
              negative
            });
          }
        } else {
          // Fallback to manual analysis
          analyzeAllComments(data);
        }

      } catch (analysisError: any) {
        console.error("Comprehensive analysis error:", analysisError);
        toast({
          variant: "destructive",
          title: "Analysis failed",
          description: `Error analyzing data: ${analysisError.message}`,
        });

        // Fallback to manual analysis
        try {
          // Set default KPIs based on numeric columns
          const numericColumns = Object.keys(data[0]).filter(key => {
            // Handle nested objects like metrics
            if (typeof data[0][key] === 'object' && data[0][key] !== null) {
              const obj = data[0][key] as Record<string, any>;
              return Object.keys(obj).some(subKey =>
                !isNaN(Number(obj[subKey])) && obj[subKey] !== ''
              );
            }
            return !isNaN(Number(data[0][key])) && data[0][key] !== '';
          });

          // Create KPI objects with default values
          const fallbackKpis = numericColumns.slice(0, 3).map(name => ({
            name,
            importance: 0.5, // Default importance
            correlation: 0.0 // Default correlation
          }));

          setKpis(fallbackKpis);

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

          // Calculate NPS
          const calculatedNPS = calculateNPS(data);
          setNpsScore(calculatedNPS);

          // Analyze comments for sentiment distribution
          analyzeAllComments(data);

        } catch (fallbackError) {
          console.error("Failed to set fallback analysis:", fallbackError);
        }
      }

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

      <div className="flex flex-col sm:flex-row gap-4 mb-4 w-full max-w-md">
        <div className="w-full">
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
                  {lang.name} {detectedLanguage === lang.id && "(Detected)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {detectedLanguage && detectedLanguage !== language && (
            <p className="text-xs text-amber-600 mt-1">
              Detected language: {getLanguageName(detectedLanguage)}.
              Results may be more accurate if you select the detected language.
            </p>
          )}
        </div>
      </div>

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
              <p className="text-xs text-gray-500">
                Language: {getLanguageName(language)}
              </p>
            </div>
            {processingTime !== null && (
              <p className="text-green-600">Completed in {processingTime.toFixed(1)} s {processingTime/60 > 1 ? `(${(processingTime/60).toFixed(1)} m)` : ''} m</p>
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

      {totalComments > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Comment Sentiment Analysis</h2>

          {/* First row: Charts side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Pie Chart Card */}
            <Card>
              <CardHeader>
                <CardTitle>Sentiment Distribution</CardTitle>
                <div className="text-sm text-muted-foreground">
                  <p>Total Comments: <span className="font-bold">{totalComments}</span></p>
                  <ul className="mt-2 space-y-1">
                    {sentimentDistribution.map((item) => {
                      // Calculate the correct percentage based on the total of all values
                      const totalValues = sentimentDistribution.reduce((sum, i) => sum + i.value, 0);
                      const percentage = totalValues > 0 ? ((item.value / totalValues) * 100).toFixed(1) : '0.0';

                      return (
                        <li key={item.name} className="flex items-center">
                          <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
                          <span>{item.name}: {item.value} ({percentage}%)</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sentimentDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => {
                          const totalValues = sentimentDistribution.reduce((sum, i) => sum + i.value, 0);
                          const percentage = totalValues > 0 ? ((value / totalValues) * 100).toFixed(0) : '0';
                          return `${name} ${percentage}%`;
                        }}
                        onClick={handleChartClick}
                        cursor="pointer"
                      >
                        {sentimentDistribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            opacity={selectedCategory === null || selectedCategory === entry.name.toLowerCase() ? 1 : 0.5}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} comments`, 'Count']} />
                      <Legend onClick={(data) => handleChartClick(data)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Bar Chart Card */}
            <Card>
              <CardHeader>
                <CardTitle>Sentiment Breakdown</CardTitle>
                <div className="text-sm text-muted-foreground">
                  Click on a segment to filter comments by sentiment
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={sentimentDistribution}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      onClick={handleChartClick}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} comments`, 'Count']} />
                      <Legend onClick={(data) => handleChartClick(data)} />
                      <Bar dataKey="value" name="Comments" radius={[4, 4, 0, 0]}>
                        {sentimentDistribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            opacity={selectedCategory === null || selectedCategory === entry.name.toLowerCase() ? 1 : 0.5}
                            cursor="pointer"
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Second row: Comments Table with Pagination */}
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedCategory
                  ? `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Comments`
                  : "All Comments"}
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                {selectedCategory
                  ? `Showing ${categorizedComments[selectedCategory as keyof CategorizedComments]?.length || 0} ${selectedCategory} comments`
                  : `Showing all ${totalComments} comments. Click on a chart segment to filter.`}
              </div>
            </CardHeader>
            <CardContent>
              <CommentsTable
                comments={(() => {
                  // Create a safe, properly formatted comments array
                  try {
                    if (selectedCategory) {
                      const categoryComments = categorizedComments[selectedCategory as keyof CategorizedComments] || [];
                      return categoryComments.map(comment => ({
                        comment: String(comment || ''),
                        sentiment: selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1),
                        color: selectedCategory === 'positive' ? '#4ade80' :
                               selectedCategory === 'negative' ? '#f87171' : '#facc15'
                      }));
                    } else {
                      // Combine all comments with their respective sentiments
                      return [
                        ...(Array.isArray(categorizedComments.positive) ? categorizedComments.positive : []).map(comment => ({
                          comment: String(comment || ''),
                          sentiment: 'Positive',
                          color: '#4ade80'
                        })),
                        ...(Array.isArray(categorizedComments.neutral) ? categorizedComments.neutral : []).map(comment => ({
                          comment: String(comment || ''),
                          sentiment: 'Neutral',
                          color: '#facc15'
                        })),
                        ...(Array.isArray(categorizedComments.negative) ? categorizedComments.negative : []).map(comment => ({
                          comment: String(comment || ''),
                          sentiment: 'Negative',
                          color: '#f87171'
                        }))
                      ];
                    }
                  } catch (error) {
                    console.error('Error formatting comments:', error);
                    return []; // Return empty array if there's an error
                  }
                })()}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {surveyData.length > 0 && (
        <div className="mt-8 w-full">
          <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>

          {/* First row: KPIs and Sentiment Analysis */}
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Key Performance Indicators</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[250px] w-full">
                  {kpis.length > 0 ? (
                    <ul className="space-y-2">
                      {kpis.map((kpi, index) => (
                        <li key={index} className="text-sm border-b pb-2">
                          <div className="font-medium">{typeof kpi === 'object' && kpi.name ? kpi.name : String(kpi)}</div>
                          {typeof kpi === 'object' && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              {kpi.importance !== undefined && (
                                <div className="flex items-center mt-1">
                                  <span className="w-24">Importance:</span>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-blue-600 h-2 rounded-full"
                                      style={{ width: `${Math.round(kpi.importance * 100)}%` }}
                                    ></div>
                                  </div>
                                  <span className="ml-2">{(kpi.importance * 100).toFixed(0)}%</span>
                                </div>
                              )}
                              {kpi.correlation !== undefined && (
                                <div className="flex items-center mt-1">
                                  <span className="w-24">Correlation:</span>
                                  <div className="w-full bg-gray-200 rounded-full h-2 relative">
                                    <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-gray-400"></div>
                                    <div
                                      className={`h-2 rounded-full ${kpi.correlation >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                                      style={{
                                        width: `${Math.abs(Math.round(kpi.correlation * 100))}%`,
                                        marginLeft: kpi.correlation >= 0 ? '50%' : undefined,
                                        marginRight: kpi.correlation < 0 ? '50%' : undefined
                                      }}
                                    ></div>
                                  </div>
                                  <span className="ml-2">{kpi.correlation.toFixed(2)}</span>
                                </div>
                              )}
                            </div>
                          )}
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
                <CardTitle>Sentiment Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[250px] w-full">
                  {sentimentScores.length > 0 ? (
                    <ul className="space-y-3">
                      {sentimentScores.map((sentiment, index) => (
                        <li key={index} className="text-sm border-b pb-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{String(sentiment.sentimentLabel)}</span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              sentiment.sentimentLabel === 'Positive' ? 'bg-green-100 text-green-800' :
                              sentiment.sentimentLabel === 'Negative' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              Score: {typeof sentiment.sentimentScore === 'number' ? sentiment.sentimentScore.toFixed(2) : String(sentiment.sentimentScore)}
                            </span>
                          </div>

                          {/* Sentiment score visualization */}
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2 relative">
                              <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-gray-400"></div>
                              <div
                                className={`h-2 rounded-full ${sentiment.sentimentScore >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                                style={{
                                  width: `${Math.abs(sentiment.sentimentScore * 50)}%`,
                                  marginLeft: sentiment.sentimentScore >= 0 ? '50%' : undefined,
                                  marginRight: sentiment.sentimentScore < 0 ? '50%' : undefined
                                }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>-1.0</span>
                              <span>0.0</span>
                              <span>+1.0</span>
                            </div>
                          </div>

                          {sentiment.reason && (
                            <div className="mt-2 text-xs text-gray-600">
                              {sentiment.reason}
                            </div>
                          )}
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

          {/* Second row: Thematic Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Thematic Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] w-full">
                {themes.length > 0 ? (
                  <ul className="space-y-6">
                    {themes.map((theme, index) => (
                      <li key={index} className="border-b pb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-base">{theme.theme}</h3>
                          {theme.sentiment !== undefined && (
                            <span className={`px-2 py-1 rounded text-xs ${
                              theme.sentiment > 0.2 ? 'bg-green-100 text-green-800' :
                              theme.sentiment < -0.2 ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              Sentiment: {theme.sentiment.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <ul className="space-y-1 pl-4">
                          {theme.responses.map((response: any, rIndex: number) => (
                            <li key={rIndex} className="text-sm text-gray-700 list-disc">
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
        </div>
      )}
    </div>
  );
};

export default DataUpload;
