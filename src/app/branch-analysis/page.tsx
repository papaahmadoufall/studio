"use client"

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { processBranchSurveyData, getBranchRecommendationMatrix } from '@/services/branchSurveyService';
import BranchRankingChart from '@/components/branch-analysis/branch-ranking';
import SimpleBranchComments from '@/components/branch-analysis/simple-branch-comments';
import ImprovementCategoriesChart from '@/components/branch-analysis/improvement-categories';
import ReasonsTable from '@/components/branch-analysis/reasons-table';
import BranchImprovementMatrix from '@/components/branch-analysis/branch-improvement-matrix';
import BranchRecommendationMatrixChart from '@/components/branch-analysis/branch-recommendation-matrix';
import SimpleBranchMatrix from '@/components/branch-analysis/simple-branch-matrix';
import DebugPanel from '@/components/branch-analysis/debug-panel';
import { generateSampleBranchData } from '@/utils/sample-branch-data';

export default function BranchAnalysisPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingTime, setProcessingTime] = useState<number | null>(null);

  // Analysis results
  const [branchData, setBranchData] = useState<any[]>([]);
  const [branchRankings, setBranchRankings] = useState<any[]>([]);
  const [improvementCategories, setImprovementCategories] = useState<any[]>([]);
  const [reasonsData, setReasonsData] = useState<any[]>([]);
  const [branchImprovements, setBranchImprovements] = useState<any[]>([]);

  // Function to handle branch comment updates
  const handleCommentUpdate = (branch: string, comment: string) => {
    // Update the branch rankings with the new comment
    const updatedRankings = branchRankings.map(item => {
      if (item.branch === branch) {
        return { ...item, comment };
      }
      return item;
    });

    setBranchRankings(updatedRankings);

    toast({
      title: "Comment Updated",
      description: `Comment for ${branch} has been updated.`,
    });
  };

  // Main recommendation fields for classification
  const mainFields = [
    "Quality service and friendliness displayed by Ecobank staff",
    "Knowledge of the Bank’s products and services displayed by Ecobank staff",
    "Any enquiries complaints or issues were resolved quickly and effectively",
    "The ambience of the branch",
    "Any enquiries",
    "None of the above",
    "Unclassified"
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file first!",
      });
      return;
    }

    // Reset states
    setIsLoading(true);
    setUploadProgress(0);
    setProcessingTime(null);
    setBranchData([]);
    setBranchRankings([]);
    setImprovementCategories([]);
    setReasonsData([]);
    setBranchImprovements([]);

    // Start timing the process
    const startTime = Date.now();

    try {
      // Process the survey data
      setUploadProgress(25);
      const results = await processBranchSurveyData(file);
      setUploadProgress(75);

      // Update state with results
      setBranchData(results.branchData);
      setBranchRankings(results.branchRankings);
      setImprovementCategories(results.improvementCategories);
      setReasonsData(results.reasonsData);
      setBranchImprovements(results.branchImprovements);

      // Calculate processing time
      const endTime = Date.now();
      const totalTime = (endTime - startTime) / 1000; // Convert to seconds
      setProcessingTime(totalTime);

      setUploadProgress(100);
      toast({
        title: "Upload successful",
        description: `Data processed in ${totalTime.toFixed(1)} seconds.`
      });

    } catch (error: any) {
      console.error("Error processing branch survey data:", error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: `Error processing data: ${error.message}`,
      });
      setUploadProgress(0);
    } finally {
      setIsLoading(false);
    }
  };

  const resetAnalysis = () => {
    setFile(null);
    setUploadProgress(0);
    setProcessingTime(null);
    setBranchData([]);
    setBranchRankings([]);
    setImprovementCategories([]);
    setReasonsData([]);
    setBranchImprovements([]);
  };

  // Function to load sample data for testing
  const loadSampleData = () => {
    // Generate sample data
    const sampleData = generateSampleBranchData(50);
    console.log("Generated sample data:", sampleData);

    // Set loading state
    setIsLoading(true);
    setUploadProgress(25);

    // Process the data
    setTimeout(() => {
      try {
        // Calculate branch rankings
        const branchRankings = sampleData.reduce((acc, item) => {
          const branch = item['Branch'];
          const satisfaction = item['How would you rate your overall satisfaction with your branch visit'];
          const advocateScore = item['AS'];

          // Find existing branch or create new one
          const existingBranch = acc.find(b => b.branch === branch);
          if (existingBranch) {
            existingBranch.satisfaction = (existingBranch.satisfaction * existingBranch.responseCount + satisfaction) / (existingBranch.responseCount + 1);
            existingBranch.advocateScore = (existingBranch.advocateScore * existingBranch.responseCount + advocateScore) / (existingBranch.responseCount + 1);
            existingBranch.responseCount += 1;

            // Update comment if this is a high satisfaction score and we don't have a comment yet
            if (satisfaction > 4 && (!existingBranch.comment || existingBranch.comment.length === 0)) {
              existingBranch.comment = item['Reasons Of Score'] || '';
            }
          } else {
            // Get a random comment from the reasons data
            const comment = item['Reasons Of Score'] || '';

            acc.push({
              branch,
              satisfaction,
              advocateScore,
              responseCount: 1,
              comment
            });
          }

          return acc;
        }, [] as any[]).sort((a, b) => b.satisfaction - a.satisfaction);

        // Calculate improvement categories
        const allImprovements = sampleData.map(item => item['What needs to be improved based on your experience']).filter(Boolean);
        const improvementCounts: Record<string, number> = {};

        allImprovements.forEach(improvement => {
          if (!improvementCounts[improvement]) {
            improvementCounts[improvement] = 0;
          }
          improvementCounts[improvement]++;
        });

        const improvementCategories = Object.entries(improvementCounts).map(([category, count]) => ({
          category,
          count,
          percentage: (count / allImprovements.length) * 100
        })).sort((a, b) => b.count - a.count);

        // Extract reasons data
        const reasonsData = sampleData.map(item => ({
          branch: item['Branch'],
          reason: item['Reasons Of Score'],
          score: item['How would you rate your overall satisfaction with your branch visit'],
          date: item['Date'],
          needCallback: item['Need Callback'],
          // Include the detailed comment if available
          detailedComment: item['Comments'] || ''
        }));

        // Calculate branch improvements
        const branchGroups: Record<string, any[]> = {};
        sampleData.forEach(item => {
          const branch = item['Branch'];
          if (!branchGroups[branch]) {
            branchGroups[branch] = [];
          }
          branchGroups[branch].push(item);
        });

        const branchImprovements = Object.entries(branchGroups).map(([branch, items]) => {
          // Count improvements for this branch
          const branchImprovementCounts: Record<string, number> = {};
          items.forEach(item => {
            const improvement = item['What needs to be improved based on your experience'];
            if (improvement) {
              if (!branchImprovementCounts[improvement]) {
                branchImprovementCounts[improvement] = 0;
              }
              branchImprovementCounts[improvement]++;
            }
          });

          // Calculate average satisfaction
          const totalSatisfaction = items.reduce((sum, item) => sum + item['How would you rate your overall satisfaction with your branch visit'], 0);
          const avgSatisfaction = totalSatisfaction / items.length;

          // Get top improvements
          const topImprovements = Object.entries(branchImprovementCounts)
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);

          return {
            branch,
            topImprovements,
            satisfaction: avgSatisfaction
          };
        });

        // Update state with sample data
        setBranchData(sampleData);
        setBranchRankings(branchRankings);
        setImprovementCategories(improvementCategories);
        setReasonsData(reasonsData);
        setBranchImprovements(branchImprovements);

        setUploadProgress(100);
        setProcessingTime(0.5); // Fake processing time

        toast({
          title: "Sample data loaded",
          description: "Sample branch data has been loaded for testing."
        });
      } catch (error: any) {
        console.error("Error processing sample data:", error);
        toast({
          variant: "destructive",
          title: "Error loading sample data",
          description: error.message
        });
        setUploadProgress(0);
      } finally {
        setIsLoading(false);
      }
    }, 500); // Simulate processing delay
  };

  // Compute recommendation matrix for the chart
  const recommendationMatrix = getBranchRecommendationMatrix(branchData, mainFields);

  return (
    <div className="container mx-auto py-8"><script src="http://localhost:8097"></script>
      <h1 className="text-3xl font-bold mb-6">Branch Survey Analysis</h1>
      <p className="text-gray-600 mb-8">
        Upload your branch survey data to analyze branch performance, improvement areas, and customer feedback.
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

            <button
              className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 disabled:opacity-50"
              onClick={loadSampleData}
              disabled={isLoading}
            >
              Load Sample Data
            </button>

            {branchData.length > 0 && (
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

      {branchData.length > 0 && (
        <div className="space-y-8">
          {/* Debug Panel */}
          <DebugPanel
            branchData={branchData}
            branchRankings={branchRankings}
            improvementCategories={improvementCategories}
            reasonsData={reasonsData}
            branchImprovements={branchImprovements}
            recommendationMatrix={recommendationMatrix}
          />

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="branches">Branch Rankings</TabsTrigger>
              <TabsTrigger value="improvements">Improvement Areas</TabsTrigger>
              <TabsTrigger value="reasons">Reasons for Scores</TabsTrigger>
              <TabsTrigger value="recommendations">Branch Recommendations</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Survey Overview</CardTitle>
                    <CardDescription>Summary of survey responses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Responses:</span>
                        <span className="font-bold">{branchData.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Branches:</span>
                        <span className="font-bold">{branchRankings.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Average Satisfaction:</span>
                        <span className="font-bold">
                          {(() => {
                            // Count valid ratings
                            let validCount = 0;
                            const sum = branchData.reduce((total, item) => {
                              const ratingField = item['How would you rate your overall satisfaction with your branch visit'];
                              if (ratingField !== undefined && ratingField !== null) {
                                // Try to parse as number
                                let rating = 0;
                                if (typeof ratingField === 'number') {
                                  rating = ratingField;
                                } else {
                                  // Try to extract numeric value
                                  const numericStr = String(ratingField).replace(/[^0-9.]/g, '');
                                  if (numericStr) {
                                    const parsed = parseFloat(numericStr);
                                    if (!isNaN(parsed)) {
                                      rating = parsed;
                                    }
                                  }
                                }

                                if (rating > 0) {
                                  validCount++;
                                  return total + rating;
                                }
                              }
                              return total;
                            }, 0);

                            return validCount > 0 ? (sum / validCount).toFixed(1) : 'N/A';
                          })()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Need Callback:</span>
                        <span className="font-bold">
                          {branchData.filter(item => {
                            const callback = item['Need Callback'];
                            if (callback === null || callback === undefined) return false;
                            const callbackStr = String(callback).toLowerCase();
                            return callbackStr === 'yes' || callbackStr === 'true' || callbackStr === '1' || callbackStr === 'oui';
                          }).length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Improvement Areas</CardTitle>
                    <CardDescription>Most common areas needing improvement</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ImprovementCategoriesChart data={improvementCategories.slice(0, 5)} />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Branch Performance Matrix</CardTitle>
                  <CardDescription>Branches and their top improvement areas</CardDescription>
                </CardHeader>
                <CardContent>
                  <BranchImprovementMatrix data={branchImprovements} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="branches">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Branch Rankings</CardTitle>
                    <CardDescription>Branches ranked by customer satisfaction</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <BranchRankingChart data={branchRankings} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Branch Comments</CardTitle>
                    <CardDescription>Add or edit comments for each branch</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SimpleBranchComments
                      data={branchRankings}
                      onCommentUpdate={handleCommentUpdate}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="improvements">
              <Card>
                <CardHeader>
                  <CardTitle>Improvement Categories</CardTitle>
                  <CardDescription>Areas that need improvement based on customer feedback</CardDescription>
                </CardHeader>
                <CardContent>
                  <ImprovementCategoriesChart data={improvementCategories} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reasons">
              <Card>
                <CardHeader>
                  <CardTitle>Reasons for Scores</CardTitle>
                  <CardDescription>Customer feedback on why they gave their scores</CardDescription>
                </CardHeader>
                <CardContent>
                  <ReasonsTable data={reasonsData} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recommendations">
              <Card>
                <CardHeader>
                  <CardTitle>Branch Recommendation Matrix</CardTitle>
                  <CardDescription>
                    Visualize the most common recommendations per branch based on the field "What needs to be improved based on your experience".
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recommendationMatrix.length > 0 ? (
                    <>
                      <div className="mb-4">
                        <h3 className="text-lg font-medium mb-2">Chart View</h3>
                        <BranchRecommendationMatrixChart data={recommendationMatrix} categories={mainFields} />
                      </div>
                      <div className="mt-8">
                        <h3 className="text-lg font-medium mb-2">Table View</h3>
                        <SimpleBranchMatrix data={recommendationMatrix} categories={mainFields} />
                      </div>
                    </>
                  ) : (
                    <div className="p-4 border rounded bg-yellow-50 text-yellow-800">
                      <p className="font-medium">No recommendation data available</p>
                      <p className="text-sm mt-2">
                        This could be because the uploaded data doesn't contain the field "What needs to be improved based on your experience"
                        or the field is empty in all records.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
