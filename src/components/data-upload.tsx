"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button"
import { processSurveyData } from '@/services/data-upload';
import { detectKpis } from '@/ai/flows/kpi-detection';
import { analyzeSentiment } from '@/ai/flows/sentiment-analysis';
import { thematicAnalysis } from '@/ai/flows/thematic-analysis';

const DataUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [surveyData, setSurveyData] = useState<any[]>([]);
  const [kpis, setKpis] = useState<string[]>([]);
  const [themes, setThemes] = useState<any[]>([]);
  const [sentimentScores, setSentimentScores] = useState<any[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    try {
      const data = await processSurveyData(file);
      setSurveyData(data);

      // KPI Detection
      const kpiResult = await detectKpis({ surveyData: data });
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

    } catch (error: any) {
      console.error("Error processing data:", error);
      alert(`Error processing data: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <input type="file" onChange={handleFileChange} className="mb-4" />
      <Button onClick={handleUpload} disabled={!file}>Upload and Analyze</Button>

      {surveyData.length > 0 && (
        <div className="mt-8 w-full">
          <h2 className="text-xl font-semibold mb-2">Analysis Results</h2>

          <div className="mb-4">
            <h3 className="text-lg font-semibold">Key Performance Indicators</h3>
            {kpis.length > 0 ? (
              <ul>
                {kpis.map((kpi, index) => (
                  <li key={index}>{kpi}</li>
                ))}
              </ul>
            ) : (
              <p>No KPIs detected.</p>
            )}
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-semibold">Thematic Analysis</h3>
            {themes.length > 0 ? (
              <ul>
                {themes.map((theme, index) => (
                  <li key={index}>
                    <strong>Theme:</strong> {theme.theme}
                    <ul>
                      {theme.responses.map((response, rIndex) => (
                        <li key={rIndex}>{response}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No themes analyzed.</p>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold">Sentiment Analysis</h3>
            {sentimentScores.length > 0 ? (
              <ul>
                {sentimentScores.map((sentiment, index) => (
                  <li key={index}>
                    <strong>Sentiment:</strong> {sentiment.sentimentLabel} (Score: {sentiment.sentimentScore})
                  </li>
                ))}
              </ul>
            ) : (
              <p>No sentiments analyzed.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataUpload;
