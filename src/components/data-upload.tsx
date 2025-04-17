"use client";

import { useState } from 'react';
import { useAIModeStore } from '@/stores/aiModeStore';
import { ollamaService } from '@/services/ollamaService';
import { ai } from '@/ai/ai-instance';
import { Button } from "@/components/ui/button"
import { processSurveyData } from '@/services/data-upload';
import { detectKpis } from '@/ai/flows/kpi-detection';
import { analyzeSentiment } from '@/ai/flows/sentiment-analysis';
import { thematicAnalysis } from '@/ai/flows/thematic-analysis';
import { useToast } from "@/hooks/use-toast"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"

const DataUpload = () => {
  const { isLocalAI } = useAIModeStore();
  const [file, setFile] = useState<File | null>(null);
  const [surveyData, setSurveyData] = useState<any[]>([]);
  const [kpis, setKpis] = useState<string[]>([]);
  const [themes, setThemes] = useState<any[]>([]);
  const [sentimentScores, setSentimentScores] = useState<any[]>([]);
  const { toast } = useToast()
  const [uploadProgress, setUploadProgress] = useState(0);
  const [npsScore, setNpsScore] = useState<number | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
      setUploadProgress(0); // Reset progress on new file selection
      setNpsScore(null); // Reset NPS on new file selection
    }
  };

  const calculateNPS = (data: any[]): number | null => {
    if (!data || data.length === 0) {
      return null;
    }

    // Assuming 'Q4' or a similar field represents satisfaction (e.g., Net Promoter Score question).
    const totalResponses = data.length;
    const detractors = data.filter(item => item['Q4'] === 'Dissatisfied' || item['Q4'] === 'Neutral').length;
    const promoters = data.filter(item => item['Q4'] === 'Very Satisfied').length;

    const calculatedNPS = Math.round(((promoters - detractors) / totalResponses) * 100);
    return calculatedNPS;
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file first!",
      })
      return;
    }

    try {
      const data = await processSurveyData(file);
      setSurveyData(data);
      setUploadProgress(25);

      // KPI Detection
      // Ensure that surveyData is an array before passing it to detectKpis
      if (Array.isArray(data)) {
        const kpiResult = await detectKpis({ surveyData: data });
        setKpis(kpiResult.kpis);
        setUploadProgress(50);
      } else {
        console.error("Survey data is not an array:", data);
        toast({
          variant: "destructive",
          title: "Analysis failed",
          description: "Uploaded data is not in the correct format.",
        });
        setUploadProgress(0);
        return;
      }


      // Thematic Analysis (example with first 5 responses)
      if (data.length > 0) {
        const textData = data.map(item => JSON.stringify(item));
        const analysisResult = await thematicAnalysis({ verbatimResponses: textData.slice(0,5) });
        setThemes(analysisResult.themes);
        setUploadProgress(75);
      }

      // Sentiment Analysis (example with first 5 responses)
      if (data.length > 0) {
        const sentimentResults = await Promise.all(data.slice(0, 5).map(async (item) => {
          const text = JSON.stringify(item);
          return await analyzeSentiment({ verbatimResponse: text });
        }));
        setSentimentScores(sentimentResults);
      }

      // Calculate NPS
      const calculatedNPS = calculateNPS(data);
      setNpsScore(calculatedNPS);

      setUploadProgress(100);
      toast({
        title: "Upload successful",
        description: "Data has been processed and analyzed.",
      })

    } catch (error: any) {
      console.error("Error processing data:", error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: `Error processing data: ${error.message}`,
      })
      setUploadProgress(0);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <input type="file" onChange={handleFileChange} className="mb-4" />
      <Button onClick={handleUpload} disabled={file === null}>Upload and Analyze</Button>

      {uploadProgress > 0 && (
        <div className="w-full mt-4">
          <Progress value={uploadProgress} />
          <p className="text-sm mt-1">Processing data: {uploadProgress}%</p>
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
                        <li key={index} className="text-sm">{kpi}</li>
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
                <ScrollArea className="h-[200px] w-full">
                  {themes.length > 0 ? (
                    <ul>
                      {themes.map((theme, index) => (
                        <li key={index} className="mb-4">
                          <strong className="block font-medium">{theme.theme}</strong>
                          <ul>
                            {theme.responses.map((response, rIndex) => (
                              <li key={rIndex} className="text-sm">{response}</li>
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
                          <strong>Sentiment:</strong> {sentiment.sentimentLabel} (Score: {sentiment.sentimentScore})
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
