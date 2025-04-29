"use client"

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { generateSampleBranchData } from '@/utils/sample-branch-data';
import { generateSampleVerbatimData } from '@/utils/sample-verbatim-data';
import { generateSampleKpiData } from '@/utils/sample-kpi-data';

export default function DemoPage() {
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [demoLoaded, setDemoLoaded] = useState(false);

  // Function to load branch survey demo data
  const loadBranchDemo = () => {
    try {
      // Generate sample data
      const sampleData = generateSampleBranchData(50);
      
      // Store in localStorage for the branch analysis page to use
      localStorage.setItem('demo_branch_data', JSON.stringify(sampleData));
      
      setActiveDemo('branch');
      setDemoLoaded(true);
      
      toast({
        title: "Branch Survey Demo Data Loaded",
        description: "Sample data has been generated. Click 'Go to Branch Analysis' to view the results."
      });
    } catch (error: any) {
      console.error("Error loading branch demo:", error);
      toast({
        variant: "destructive",
        title: "Error Loading Demo",
        description: error.message || "An error occurred while loading the demo."
      });
    }
  };

  // Function to load verbatim analysis demo data
  const loadVerbatimDemo = () => {
    try {
      // Generate sample data
      const sampleData = generateSampleVerbatimData(100);
      
      // Store in localStorage for the verbatim analysis page to use
      localStorage.setItem('demo_verbatim_data', JSON.stringify(sampleData));
      
      setActiveDemo('verbatim');
      setDemoLoaded(true);
      
      toast({
        title: "Verbatim Analysis Demo Data Loaded",
        description: "Sample data has been generated. Click 'Go to Verbatim Analysis' to view the results."
      });
    } catch (error: any) {
      console.error("Error loading verbatim demo:", error);
      toast({
        variant: "destructive",
        title: "Error Loading Demo",
        description: error.message || "An error occurred while loading the demo."
      });
    }
  };

  // Function to load KPI analysis demo data
  const loadKpiDemo = () => {
    try {
      // Generate sample data
      const sampleData = generateSampleKpiData(75);
      
      // Store in localStorage for the KPI analysis page to use
      localStorage.setItem('demo_kpi_data', JSON.stringify(sampleData));
      
      setActiveDemo('kpi');
      setDemoLoaded(true);
      
      toast({
        title: "KPI Analysis Demo Data Loaded",
        description: "Sample data has been generated. Click 'Go to KPI Analysis' to view the results."
      });
    } catch (error: any) {
      console.error("Error loading KPI demo:", error);
      toast({
        variant: "destructive",
        title: "Error Loading Demo",
        description: error.message || "An error occurred while loading the demo."
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-2">AI Survey Analyzer Demo</h1>
      <p className="text-gray-600 mb-8">
        Choose a demo to explore the capabilities of the AI Survey Analyzer.
      </p>

      <Tabs defaultValue="branch" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="branch">Branch Analysis</TabsTrigger>
          <TabsTrigger value="verbatim">Verbatim Analysis</TabsTrigger>
          <TabsTrigger value="kpi">KPI Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="branch" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Branch Survey Analysis Demo</CardTitle>
              <CardDescription>
                Analyze branch performance based on customer feedback and satisfaction scores.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose max-w-none">
                <h3>What You'll See:</h3>
                <ul>
                  <li>Branch rankings based on customer satisfaction</li>
                  <li>Improvement categories identified from customer feedback</li>
                  <li>Detailed reasons for scores with sentiment analysis</li>
                  <li>Branch recommendation matrix showing areas for improvement by branch</li>
                </ul>
                
                <h3>How It Works:</h3>
                <p>
                  The AI analyzes survey responses to identify patterns, categorize feedback, and 
                  rank branches based on customer satisfaction. It also identifies areas for improvement
                  and provides actionable insights.
                </p>
              </div>
              
              <div className="flex gap-4 pt-4">
                <button
                  onClick={loadBranchDemo}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Load Branch Demo Data
                </button>
                
                {activeDemo === 'branch' && demoLoaded && (
                  <Link href="/branch-analysis" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                    Go to Branch Analysis
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verbatim" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Verbatim Analysis Demo</CardTitle>
              <CardDescription>
                Analyze open-ended responses to identify themes, sentiment, and key insights.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose max-w-none">
                <h3>What You'll See:</h3>
                <ul>
                  <li>Thematic analysis of open-ended responses</li>
                  <li>Sentiment analysis showing positive, negative, and neutral feedback</li>
                  <li>Key topics and trends identified from customer comments</li>
                  <li>Word clouds and frequency analysis</li>
                </ul>
                
                <h3>How It Works:</h3>
                <p>
                  The AI processes open-ended responses using natural language processing to identify 
                  common themes, sentiment, and key topics. It categorizes feedback and provides 
                  visualizations to help understand customer opinions.
                </p>
              </div>
              
              <div className="flex gap-4 pt-4">
                <button
                  onClick={loadVerbatimDemo}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Load Verbatim Demo Data
                </button>
                
                {activeDemo === 'verbatim' && demoLoaded && (
                  <Link href="/verbatim-analysis" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                    Go to Verbatim Analysis
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kpi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>KPI Analysis Demo</CardTitle>
              <CardDescription>
                Analyze key performance indicators and metrics from survey data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose max-w-none">
                <h3>What You'll See:</h3>
                <ul>
                  <li>KPI dashboards showing performance metrics</li>
                  <li>Trend analysis over time</li>
                  <li>Comparative analysis between different segments</li>
                  <li>Correlation analysis between different KPIs</li>
                </ul>
                
                <h3>How It Works:</h3>
                <p>
                  The AI analyzes numerical data and metrics from surveys to identify trends, 
                  correlations, and insights. It provides visualizations and dashboards to help 
                  understand performance across different dimensions.
                </p>
              </div>
              
              <div className="flex gap-4 pt-4">
                <button
                  onClick={loadKpiDemo}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Load KPI Demo Data
                </button>
                
                {activeDemo === 'kpi' && demoLoaded && (
                  <Link href="/kpi-analysis" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                    Go to KPI Analysis
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
