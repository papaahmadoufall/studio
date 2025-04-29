"use client"

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface SimpleBranchCommentsProps {
  data: {
    branch: string;
    satisfaction: number;
    responseCount: number;
    advocateScore: number;
    comment?: string;
  }[];
  onCommentUpdate?: (branch: string, comment: string) => void;
}

export default function SimpleBranchComments({ data, onCommentUpdate }: SimpleBranchCommentsProps) {
  // Sort data by satisfaction score (descending)
  const sortedData = [...data].sort((a, b) => b.satisfaction - a.satisfaction);
  
  // State for editing comments
  const [editingBranch, setEditingBranch] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<string>('');
  
  // Get satisfaction color
  const getSatisfactionColor = (score: number) => {
    if (score >= 4.5) return 'bg-green-100 text-green-800';
    if (score >= 4.0) return 'bg-green-50 text-green-600';
    if (score >= 3.5) return 'bg-yellow-100 text-yellow-800';
    if (score >= 3.0) return 'bg-yellow-50 text-yellow-600';
    return 'bg-red-100 text-red-800';
  };
  
  // Handle edit button click
  const handleEditClick = (branch: string, currentComment: string = '') => {
    setEditingBranch(branch);
    setCommentText(currentComment);
  };
  
  // Handle save button click
  const handleSaveClick = (branch: string) => {
    if (onCommentUpdate) {
      onCommentUpdate(branch, commentText);
    }
    setEditingBranch(null);
  };
  
  // Handle cancel button click
  const handleCancelClick = () => {
    setEditingBranch(null);
  };
  
  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Branch</TableHead>
            <TableHead className="w-[120px] text-center">Satisfaction</TableHead>
            <TableHead>Comment</TableHead>
            <TableHead className="w-[120px] text-center">Actions</TableHead>
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
                {editingBranch === item.branch ? (
                  <Input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Enter comment for this branch..."
                    className="w-full"
                  />
                ) : (
                  <span className="text-sm">{item.comment || 'No comment available'}</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                {editingBranch === item.branch ? (
                  <div className="flex space-x-2 justify-center">
                    <button 
                      className="px-3 py-1 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100"
                      onClick={() => handleSaveClick(item.branch)}
                    >
                      Save
                    </button>
                    <button 
                      className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                      onClick={handleCancelClick}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button 
                    className="px-3 py-1 text-sm border border-gray-200 rounded hover:bg-gray-50"
                    onClick={() => handleEditClick(item.branch, item.comment)}
                  >
                    Edit
                  </button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
