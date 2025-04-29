"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface SimpleBranchMatrixProps {
  data: {
    branch: string;
    [category: string]: number | string;
  }[];
  categories: string[];
}

export default function SimpleBranchMatrix({ data, categories }: SimpleBranchMatrixProps) {
  console.log("SimpleBranchMatrix - Input data:", data);
  console.log("SimpleBranchMatrix - Categories:", categories);
  
  // Ensure we have valid data
  if (!data || data.length === 0) {
    return <div>No data available</div>;
  }

  // Get category colors
  const getCategoryColor = (category: string, value: number) => {
    if (value === 0) return "bg-gray-100 text-gray-800";
    
    const categoryColors: Record<string, string> = {
      "Quality service and friendliness displayed by Ecobank staff": "bg-green-100 text-green-800",
      "Knowledge of the Bank's products and services displayed by Ecobank staff": "bg-blue-100 text-blue-800",
      "Any enquiries complaints or issues were resolved quickly and effectively": "bg-yellow-100 text-yellow-800",
      "The ambience of the branch": "bg-purple-100 text-purple-800",
      "Any enquiries": "bg-indigo-100 text-indigo-800",
      "None of the above": "bg-red-100 text-red-800",
      "Unclassified": "bg-gray-100 text-gray-800",
      "Waiting Time": "bg-red-100 text-red-800",
      "Staff Attitude": "bg-blue-100 text-blue-800",
      "Service Speed": "bg-yellow-100 text-yellow-800",
      "ATM Services": "bg-purple-100 text-purple-800",
      "Digital Banking": "bg-indigo-100 text-indigo-800",
      "Branch Environment": "bg-green-100 text-green-800",
      "Fees and Charges": "bg-orange-100 text-orange-800",
      "Communication": "bg-pink-100 text-pink-800",
      "Process Efficiency": "bg-teal-100 text-teal-800"
    };
    
    return categoryColors[category] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Branch</TableHead>
            <TableHead>Improvement Categories</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{item.branch}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => {
                    const value = typeof item[category] === 'number' ? item[category] as number : 0;
                    if (value === 0) return null; // Don't show categories with 0 count
                    
                    return (
                      <Badge 
                        key={category} 
                        variant="outline" 
                        className={getCategoryColor(category, value)}
                      >
                        {category.length > 30 ? `${category.substring(0, 30)}...` : category} ({value})
                      </Badge>
                    );
                  })}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
