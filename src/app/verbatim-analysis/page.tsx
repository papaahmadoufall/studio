"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SampleVerbatimItem } from '@/utils/sample-verbatim-data';

export default function VerbatimAnalysisPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingTime, setProcessingTime] = useState<number | null>(null);

  // Analysis results
  const [verbatimData, setVerbatimData] = useState<SampleVerbatimItem[]>([]);
  const [themeData, setThemeData] = useState<any[]>([]);
  const [sentimentData, setSentimentData] = useState<any[]>([]);
  const [topKeywords, setTopKeywords] = useState<any[]>([]);

  // Check for demo data in localStorage on page load
  useEffect(() => {
    const demoData = localStorage.getItem('demo_verbatim_data');
    if (demoData) {
      try {
        const parsedData = JSON.parse(demoData);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          setIsLoading(true);
          setUploadProgress(25);
          
          // Simulate processing
          setTimeout(() => {
            processVerbatimData(parsedData);
            setUploadProgress(100);
            setProcessingTime(0.8);
            setIsLoading(false);
            
            // Clear the demo data from localStorage
            localStorage.removeItem('demo_verbatim_data');
            
            toast({
              title: "Demo Data Loaded",
              description: "Sample verbatim data has been loaded and analyzed."
            });
          }, 1000);
        }
      } catch (error) {
        console.error("Error parsing demo data:", error);
      }
    }
  }, []);

  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!file) return;
    
    setIsLoading(true);
    setUploadProgress(10);
    
    // Simulate file reading
    setTimeout(() => {
      setUploadProgress(30);
      
      // Simulate processing
      setTimeout(() => {
        setUploadProgress(70);
        
        // Simulate completion
        setTimeout(() => {
          setUploadProgress(100);
          setProcessingTime(1.2);
          setIsLoading(false);
          
          toast({
            title: "Upload not implemented",
            description: "This is a demo. Please use the demo data from the demo page."
          });
        }, 500);
      }, 800);
    }, 500);
  };

  // Process verbatim data
  const processVerbatimData = (data: SampleVerbatimItem[]) => {
    setVerbatimData(data);
    
    // Process themes
    const categoryCount: Record<string, number> = {};
    data.forEach(item => {
      if (!categoryCount[item.category]) {
        categoryCount[item.category] = 0;
      }
      categoryCount[item.category]++;
    });
    
    const themes = Object.entries(categoryCount).map(([category, count]) => ({
      theme: category,
      count,
      percentage: (count / data.length) * 100
    })).sort((a, b) => b.count - a.count);
    
    setThemeData(themes);
    
    // Process sentiment
    const sentimentCount = {
      positive: 0,
      negative: 0,
      neutral: 0
    };
    
    data.forEach(item => {
      sentimentCount[item.sentiment]++;
    });
    
    const sentiments = [
      {
        sentiment: 'Positive',
        count: sentimentCount.positive,
        percentage: (sentimentCount.positive / data.length) * 100
      },
      {
        sentiment: 'Negative',
        count: sentimentCount.negative,
        percentage: (sentimentCount.negative / data.length) * 100
      },
      {
        sentiment: 'Neutral',
        count: sentimentCount.neutral,
        percentage: (sentimentCount.neutral / data.length) * 100
      }
    ];
    
    setSentimentData(sentiments);
    
    // Extract keywords (simplified simulation)
    const words: Record<string, number> = {};
    const stopWords = ['the', 'and', 'a', 'to', 'of', 'in', 'is', 'it', 'that', 'was', 'for', 'on', 'with', 'as', 'are', 'at', 'be', 'this', 'by', 'an', 'not', 'but', 'or', 'from', 'they', 'you', 'have', 'had', 'has', 'was', 'were', 'would', 'could', 'should', 'will', 'can', 'do', 'does', 'did', 'i', 'my', 'me', 'we', 'our', 'us', 'your', 'yours', 'their', 'them', 'his', 'her', 'hers', 'its', 'their', 'theirs'];
    
    data.forEach(item => {
      const text = item.verbatim.toLowerCase();
      const textWords = text.split(/\W+/).filter(word => 
        word.length > 3 && !stopWords.includes(word)
      );
      
      textWords.forEach(word => {
        if (!words[word]) {
          words[word] = 0;
        }
        words[word]++;
      });
    });
    
    const keywords = Object.entries(words)
      .filter(([_, count]) => count > 1) // Only words that appear more than once
      .map(([word, count]) => ({
        word,
        count,
        percentage: (count / data.length) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // Top 20 keywords
    
    setTopKeywords(keywords);
  };

  // Reset analysis
  const resetAnalysis = () => {
    setFile(null);
    setUploadProgress(0);
    setProcessingTime(null);
    setVerbatimData([]);
    setThemeData([]);
    setSentimentData([]);
    setTopKeywords([]);
  };

  // Get sentiment color
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return 'bg-green-100 text-green-800';
      case 'negative':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Verbatim Analysis</h1>
      <p className="text-gray-600 mb-8">
        Upload your verbatim survey data to analyze themes, sentiment, and extract key insights.
      </p>

      <div className="mb-8">
        <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto">
          <input type="file" onChange={handleFileChange} className="mb-4" />

          <div className="flex gap-2">
            <button
              onClick={handleUpload}
              disabled={file === null || isLoading}
              className="relative px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></span>
                  Processing...
                </>
              ) : (
                'Upload and Analyze'
              )}
            </button>

            {verbatimData.length > 0 && (
              <button
                className="px-4 py-2 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
                onClick={resetAnalysis}
                disabled={isLoading}
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {(uploadProgress > 0 || isLoading) && (
          <div className="w-full mt-4 max-w-md mx-auto">
            <Progress value={uploadProgress} className={isLoading ? "animate-pulse" : ""} />
            <div className="flex justify-between text-sm mt-1">
              <div>
                <p>Processing data: {uploadProgress}%</p>
              </div>
              {processingTime !== null && (
                <p className="text-green-600">Completed in {processingTime.toFixed(1)} s</p>
              )}
            </div>
          </div>
        )}
      </div>

      {verbatimData.length > 0 && (
        <div className="space-y-8">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="themes">Thematic Analysis</TabsTrigger>
              <TabsTrigger value="sentiment">Sentiment Analysis</TabsTrigger>
              <TabsTrigger value="verbatims">Verbatim Responses</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Verbatim Overview</CardTitle>
                    <CardDescription>Summary of verbatim responses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Responses:</span>
                        <span className="font-bold">{verbatimData.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Themes:</span>
                        <span className="font-bold">{themeData.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Positive Sentiment:</span>
                        <span className="font-bold">
                          {sentimentData.find(s => s.sentiment === 'Positive')?.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Negative Sentiment:</span>
                        <span className="font-bold">
                          {sentimentData.find(s => s.sentiment === 'Negative')?.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Themes</CardTitle>
                    <CardDescription>Most common themes in verbatim responses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {themeData.slice(0, 5).map((theme, index) => (
                        <div key={index} className="flex items-center">
                          <div className="w-full">
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">{theme.theme}</span>
                              <span className="text-sm text-gray-500">{theme.count} ({theme.percentage.toFixed(1)}%)</span>
                            </div>
                            <Progress value={theme.percentage} className="h-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Top Keywords</CardTitle>
                  <CardDescription>Most frequently mentioned words in verbatim responses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {topKeywords.map((keyword, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="text-sm py-1 px-2"
                        style={{
                          fontSize: `${Math.max(0.8, Math.min(1.5, 0.8 + (keyword.count / 20)))}rem`,
                          opacity: Math.max(0.6, Math.min(1, 0.6 + (keyword.count / 30)))
                        }}
                      >
                        {keyword.word} ({keyword.count})
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="themes">
              <Card>
                <CardHeader>
                  <CardTitle>Thematic Analysis</CardTitle>
                  <CardDescription>Categorization of verbatim responses into themes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Theme</TableHead>
                            <TableHead className="text-right">Count</TableHead>
                            <TableHead className="text-right">Percentage</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {themeData.map((theme, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{theme.theme}</TableCell>
                              <TableCell className="text-right">{theme.count}</TableCell>
                              <TableCell className="text-right">{theme.percentage.toFixed(1)}%</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-3">Theme Distribution</h3>
                      <div className="h-8 w-full rounded-full overflow-hidden bg-gray-200">
                        {themeData.map((theme, index) => {
                          // Calculate width based on percentage
                          const width = `${theme.percentage}%`;
                          
                          // Generate a color based on index
                          const hue = (index * 137) % 360; // Golden angle approximation for good distribution
                          const color = `hsl(${hue}, 70%, 65%)`;
                          
                          return (
                            <div
                              key={index}
                              className="h-full float-left"
                              style={{ width, backgroundColor: color }}
                              title={`${theme.theme}: ${theme.percentage.toFixed(1)}%`}
                            />
                          );
                        })}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3">
                        {themeData.map((theme, index) => {
                          const hue = (index * 137) % 360;
                          const color = `hsl(${hue}, 70%, 65%)`;
                          
                          return (
                            <div key={index} className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                              <span className="text-sm">{theme.theme}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sentiment">
              <Card>
                <CardHeader>
                  <CardTitle>Sentiment Analysis</CardTitle>
                  <CardDescription>Analysis of sentiment in verbatim responses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {sentimentData.map((sentiment, index) => (
                        <div key={index} className="border rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold mb-1">
                            {sentiment.percentage.toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-500 mb-3">
                            {sentiment.count} responses
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`${getSentimentColor(sentiment.sentiment)} px-3 py-1`}
                          >
                            {sentiment.sentiment}
                          </Badge>
                        </div>
                      ))}
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-3">Sentiment by Theme</h3>
                      <div className="rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Theme</TableHead>
                              <TableHead className="text-right">Positive</TableHead>
                              <TableHead className="text-right">Neutral</TableHead>
                              <TableHead className="text-right">Negative</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {themeData.map((theme, index) => {
                              // Calculate sentiment distribution for each theme
                              const themeVerbatims = verbatimData.filter(item => item.category === theme.theme);
                              const positive = themeVerbatims.filter(item => item.sentiment === 'positive').length;
                              const neutral = themeVerbatims.filter(item => item.sentiment === 'neutral').length;
                              const negative = themeVerbatims.filter(item => item.sentiment === 'negative').length;
                              
                              const positivePerc = (positive / themeVerbatims.length) * 100;
                              const neutralPerc = (neutral / themeVerbatims.length) * 100;
                              const negativePerc = (negative / themeVerbatims.length) * 100;
                              
                              return (
                                <TableRow key={index}>
                                  <TableCell className="font-medium">{theme.theme}</TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <span>{positivePerc.toFixed(1)}%</span>
                                      <div className="w-16 bg-gray-200 rounded-full h-2">
                                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${positivePerc}%` }} />
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <span>{neutralPerc.toFixed(1)}%</span>
                                      <div className="w-16 bg-gray-200 rounded-full h-2">
                                        <div className="bg-gray-500 h-2 rounded-full" style={{ width: `${neutralPerc}%` }} />
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <span>{negativePerc.toFixed(1)}%</span>
                                      <div className="w-16 bg-gray-200 rounded-full h-2">
                                        <div className="bg-red-500 h-2 rounded-full" style={{ width: `${negativePerc}%` }} />
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="verbatims">
              <Card>
                <CardHeader>
                  <CardTitle>Verbatim Responses</CardTitle>
                  <CardDescription>Individual verbatim responses with analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Verbatim</TableHead>
                          <TableHead>Sentiment</TableHead>
                          <TableHead>Source</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {verbatimData.slice(0, 10).map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.date}</TableCell>
                            <TableCell>{item.category}</TableCell>
                            <TableCell className="max-w-md">
                              <div className="line-clamp-2">{item.verbatim}</div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={getSentimentColor(item.sentiment)}
                              >
                                {item.sentiment.charAt(0).toUpperCase() + item.sentiment.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>{item.source}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="mt-4 text-center text-sm text-gray-500">
                    Showing 10 of {verbatimData.length} verbatim responses
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
