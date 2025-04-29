"use client"

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface ReasonsTableProps {
  data: {
    branch: string;
    reason: string;
    score: number;
    date: string;
    needCallback: string;
    detailedComment?: string;
  }[];
}

export default function ReasonsTable({ data }: ReasonsTableProps) {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBranch, setFilterBranch] = useState('all');
  const [filterScore, setFilterScore] = useState('all');
  const [filterCallback, setFilterCallback] = useState('all');

  const pageSize = 10;

  // Get unique branches for filter
  const branches = ['all', ...new Set(data.map(item => item.branch))];

  // Filter data based on search and filters
  const filteredData = data.filter(item => {
    // Search term filter
    const matchesSearch = searchTerm === '' ||
      item.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.branch.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.detailedComment && item.detailedComment.toLowerCase().includes(searchTerm.toLowerCase()));

    // Branch filter
    const matchesBranch = filterBranch === 'all' || item.branch === filterBranch;

    // Score filter
    const matchesScore = filterScore === 'all' ||
      (filterScore === 'high' && item.score >= 4) ||
      (filterScore === 'medium' && item.score >= 3 && item.score < 4) ||
      (filterScore === 'low' && item.score < 3);

    // Callback filter
    const matchesCallback = filterCallback === 'all' ||
      (filterCallback === 'yes' && item.needCallback.toLowerCase() === 'yes') ||
      (filterCallback === 'no' && item.needCallback.toLowerCase() !== 'yes');

    return matchesSearch && matchesBranch && matchesScore && matchesCallback;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const currentData = filteredData.slice((page - 1) * pageSize, page * pageSize);

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setPage(1);
  };

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 4) return 'bg-green-100 text-green-800';
    if (score >= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if there are few
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate start and end of visible pages
      let start = Math.max(2, page - 1);
      let end = Math.min(totalPages - 1, page + 1);

      // Adjust if we're near the beginning or end
      if (page <= 3) {
        end = Math.min(totalPages - 1, 4);
      } else if (page >= totalPages - 2) {
        start = Math.max(2, totalPages - 3);
      }

      // Add ellipsis after first page if needed
      if (start > 2) {
        pages.push('ellipsis1');
      }

      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis before last page if needed
      if (end < totalPages - 1) {
        pages.push('ellipsis2');
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-1">
          <Input
            placeholder="Search in feedback, comments, or branches..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              handleFilterChange();
            }}
          />
        </div>

        <div className="flex flex-1 gap-2">
          <Select
            value={filterBranch}
            onValueChange={(value) => {
              setFilterBranch(value);
              handleFilterChange();
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.filter(b => b !== 'all').map(branch => (
                <SelectItem key={branch} value={branch}>{branch}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filterScore}
            onValueChange={(value) => {
              setFilterScore(value);
              handleFilterChange();
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by score" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Scores</SelectItem>
              <SelectItem value="high">High (4-5)</SelectItem>
              <SelectItem value="medium">Medium (3-3.9)</SelectItem>
              <SelectItem value="low">Low (0-2.9)</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filterCallback}
            onValueChange={(value) => {
              setFilterCallback(value);
              handleFilterChange();
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by callback" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="yes">Needs Callback</SelectItem>
              <SelectItem value="no">No Callback</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Branch</TableHead>
              <TableHead>Feedback & Comments</TableHead>
              <TableHead className="w-[80px] text-center">Score</TableHead>
              <TableHead className="w-[100px]">Date</TableHead>
              <TableHead className="w-[100px] text-center">Callback</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.length > 0 ? (
              currentData.map((item, index) => (
                <TableRow key={index} className="group">
                  <TableCell className="font-medium">{item.branch}</TableCell>
                  <TableCell>
                    <div>
                      <p>{item.reason}</p>
                      {item.detailedComment && (
                        <div className="mt-2 text-sm text-gray-600 border-t pt-2 border-gray-100">
                          <p className="font-medium text-xs text-gray-500">Detailed Comment:</p>
                          <p className="italic">{item.detailedComment}</p>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={getScoreColor(item.score)}>
                      {item.score.toFixed(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.date}</TableCell>
                  <TableCell className="text-center">
                    {item.needCallback.toLowerCase() === 'yes' ? (
                      <Badge variant="outline" className="bg-red-100 text-red-800">Yes</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-100 text-gray-800">No</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Showing {currentData.length} of {filteredData.length} reasons
          </div>

          <Pagination>
            <PaginationContent>
              {page > 1 && (
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage(page - 1);
                    }}
                  />
                </PaginationItem>
              )}

              {getPageNumbers().map((pageNum, i) => (
                <PaginationItem key={i}>
                  {pageNum === 'ellipsis1' || pageNum === 'ellipsis2' ? (
                    <span className="flex h-9 w-9 items-center justify-center">...</span>
                  ) : (
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(Number(pageNum));
                      }}
                      isActive={page === pageNum}
                    >
                      {pageNum}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              {page < totalPages && (
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage(page + 1);
                    }}
                  />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
