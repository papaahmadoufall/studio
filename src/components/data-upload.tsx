"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button"
import { processSurveyData } from '@/services/data-upload';
import { detectKpis } from '@/ai/flows/kpi-detection';
import { analyzeSentiment } from '@/ai/flows/sentiment-analysis';
import { thematicAnalysis } from '@/ai/flows/thematic-analysis';
import { useToast } from "@/hooks/use-toast"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

const DataUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [surveyData, setSurveyData] = useState<any[]>([]);
  const [kpis, setKpis] = useState<string[]>([]);
  const [themes, setThemes] = useState<any[]>([]);
  const [sentimentScores, setSentimentScores] = useState<any[]>([]);
  const { toast } = useToast()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
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

    try {
      const data = await processSurveyData(file);
      setSurveyData(data);

      // KPI Detection
      // Wrap the data in an array to match the schema
      const kpiResult = await detectKpis({ surveyData: [data] });
      setKpis(kpiResult.kpis);

      // Thematic Analysis (example with first 5 responses)
      if (data.length > 0) {
        const textData = data.map(item => JSON.stringify(item));
        const analysisResult = await thematicAnalysis({ verbatimResponses: textData.slice(0,5) });
        setThemes(analysisResult.themes);
      }

      // Sentiment Analysis (example with first 5 responses)
      if (data.length > 0) {
        const sentimentResults = await Promise.all(data.slice(0, 5).map(async (item) => {
          const text = JSON.stringify(item);
          return await analyzeSentiment({ verbatimResponse: text });
        }));
        setSentimentScores(sentimentResults);
      }
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
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <input type="file" onChange={handleFileChange} className="mb-4" />
      <Button onClick={handleUpload} disabled={!file}>Upload and Analyze</Button>

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
