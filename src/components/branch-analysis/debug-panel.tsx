"use client"

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DebugPanelProps {
  branchData: any[];
  branchRankings: any[];
  improvementCategories: any[];
  reasonsData: any[];
  branchImprovements: any[];
  recommendationMatrix: any[];
}

export default function DebugPanel({
  branchData,
  branchRankings,
  improvementCategories,
  reasonsData,
  branchImprovements,
  recommendationMatrix
}: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    if (activeSection === section) {
      setActiveSection(null);
    } else {
      setActiveSection(section);
    }
  };

  return (
    <Card className="mt-4 border-red-300">
      <CardHeader>
        <CardTitle className="flex justify-between">
          <span>Debug Information</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? 'Hide' : 'Show'}
          </Button>
        </CardTitle>
      </CardHeader>
      {isOpen && (
        <CardContent>
          <div className="space-y-4">
            <div className="border rounded overflow-hidden">
              <div
                className="flex justify-between items-center p-2 bg-gray-100 cursor-pointer"
                onClick={() => toggleSection('branchData')}
              >
                <span>Branch Data ({branchData.length} items)</span>
                <span>{activeSection === 'branchData' ? '▼' : '▶'}</span>
              </div>
              {activeSection === 'branchData' && (
                <div className="p-2 border-t max-h-60 overflow-auto">
                  <pre className="text-xs">{JSON.stringify(branchData.slice(0, 2), null, 2)}</pre>
                  {branchData.length > 2 && <p className="text-xs text-gray-500">...and {branchData.length - 2} more items</p>}
                </div>
              )}
            </div>

            <div className="border rounded overflow-hidden">
              <div
                className="flex justify-between items-center p-2 bg-gray-100 cursor-pointer"
                onClick={() => toggleSection('branchRankings')}
              >
                <span>Branch Rankings ({branchRankings.length} items)</span>
                <span>{activeSection === 'branchRankings' ? '▼' : '▶'}</span>
              </div>
              {activeSection === 'branchRankings' && (
                <div className="p-2 border-t max-h-60 overflow-auto">
                  <pre className="text-xs">{JSON.stringify(branchRankings, null, 2)}</pre>
                </div>
              )}
            </div>

            <div className="border rounded overflow-hidden">
              <div
                className="flex justify-between items-center p-2 bg-gray-100 cursor-pointer"
                onClick={() => toggleSection('improvementCategories')}
              >
                <span>Improvement Categories ({improvementCategories.length} items)</span>
                <span>{activeSection === 'improvementCategories' ? '▼' : '▶'}</span>
              </div>
              {activeSection === 'improvementCategories' && (
                <div className="p-2 border-t max-h-60 overflow-auto">
                  <pre className="text-xs">{JSON.stringify(improvementCategories, null, 2)}</pre>
                </div>
              )}
            </div>

            <div className="border rounded overflow-hidden">
              <div
                className="flex justify-between items-center p-2 bg-gray-100 cursor-pointer"
                onClick={() => toggleSection('reasonsData')}
              >
                <span>Reasons Data ({reasonsData.length} items)</span>
                <span>{activeSection === 'reasonsData' ? '▼' : '▶'}</span>
              </div>
              {activeSection === 'reasonsData' && (
                <div className="p-2 border-t max-h-60 overflow-auto">
                  <pre className="text-xs">{JSON.stringify(reasonsData.slice(0, 5), null, 2)}</pre>
                  {reasonsData.length > 5 && <p className="text-xs text-gray-500">...and {reasonsData.length - 5} more items</p>}
                </div>
              )}
            </div>

            <div className="border rounded overflow-hidden">
              <div
                className="flex justify-between items-center p-2 bg-gray-100 cursor-pointer"
                onClick={() => toggleSection('branchImprovements')}
              >
                <span>Branch Improvements ({branchImprovements.length} items)</span>
                <span>{activeSection === 'branchImprovements' ? '▼' : '▶'}</span>
              </div>
              {activeSection === 'branchImprovements' && (
                <div className="p-2 border-t max-h-60 overflow-auto">
                  <pre className="text-xs">{JSON.stringify(branchImprovements, null, 2)}</pre>
                </div>
              )}
            </div>

            <div className="border rounded overflow-hidden">
              <div
                className="flex justify-between items-center p-2 bg-gray-100 cursor-pointer"
                onClick={() => toggleSection('recommendationMatrix')}
              >
                <span>Recommendation Matrix ({recommendationMatrix.length} items)</span>
                <span>{activeSection === 'recommendationMatrix' ? '▼' : '▶'}</span>
              </div>
              {activeSection === 'recommendationMatrix' && (
                <div className="p-2 border-t max-h-60 overflow-auto">
                  <pre className="text-xs">{JSON.stringify(recommendationMatrix, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
