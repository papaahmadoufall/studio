"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface BranchImprovementMatrixProps {
  data: {
    branch: string;
    topImprovements: {
      category: string;
      count: number;
    }[];
    satisfaction: number;
  }[];
}

export default function BranchImprovementMatrix({ data }: BranchImprovementMatrixProps) {
  // Sort data by satisfaction score (descending)
  const sortedData = [...data].sort((a, b) => b.satisfaction - a.satisfaction);
  
  // Get satisfaction color
  const getSatisfactionColor = (score: number) => {
    if (score >= 4.5) return 'bg-green-100 text-green-800';
    if (score >= 4.0) return 'bg-green-50 text-green-600';
    if (score >= 3.5) return 'bg-yellow-100 text-yellow-800';
    if (score >= 3.0) return 'bg-yellow-50 text-yellow-600';
    return 'bg-red-100 text-red-800';
  };
  
  // Get improvement category color
  const getImprovementColor = (category: string) => {
    const categoryColors: Record<string, string> = {
      'Waiting Time': 'bg-red-100 text-red-800',
      'Staff Attitude': 'bg-blue-100 text-blue-800',
      'Service Speed': 'bg-yellow-100 text-yellow-800',
      'ATM Services': 'bg-purple-100 text-purple-800',
      'Digital Banking': 'bg-indigo-100 text-indigo-800',
      'Branch Environment': 'bg-green-100 text-green-800',
      'Fees and Charges': 'bg-orange-100 text-orange-800',
      'Communication': 'bg-pink-100 text-pink-800',
      'Process Efficiency': 'bg-teal-100 text-teal-800'
    };
    
    return categoryColors[category] || 'bg-gray-100 text-gray-800';
  };
  
  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Branch</TableHead>
            <TableHead className="w-[120px] text-center">Satisfaction</TableHead>
            <TableHead>Top Improvement Areas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((item, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{item.branch}</TableCell>
              <TableCell className="text-center">
                <Badge variant="outline" className={getSatisfactionColor(item.satisfaction)}>
                  {item.satisfaction.toFixed(1)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-2">
                  {item.topImprovements.map((improvement, i) => (
                    <Badge 
                      key={i} 
                      variant="outline" 
                      className={getImprovementColor(improvement.category)}
                    >
                      {improvement.category} ({improvement.count})
                    </Badge>
                  ))}
                  {item.topImprovements.length === 0 && (
                    <span className="text-gray-500 italic">No improvement data</span>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
