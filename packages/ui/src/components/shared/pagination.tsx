"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Button } from "../ui/button";

interface Props {
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  page: number;
  pageSize: number;
  total: number;
}

const PAGE_SIZES = Array.from({ length: 6 }, (_, index) => ({
  label: `${(index + 1) * 10}`,
  value: (index + 1) * 10,
}));

export const Pagination = ({ onPageChange, onPageSizeChange, page, pageSize, total }: Props) => {
  const totalPages = Math.ceil(total / pageSize);

  const isFirstPage = page <= 1;
  const isLastPage = page >= totalPages;

  const handleNext = () => !isLastPage && onPageChange(page + 1);
  const handlePrevious = () => !isFirstPage && onPageChange(page - 1);
  const handleLast = () => !isLastPage && onPageChange(totalPages);
  const handleFirst = () => !isFirstPage && onPageChange(1);

  return (
    <div className="flex w-full items-center justify-between">
      <p className="text-muted-foreground text-sm">
        Page {totalPages === 0 ? 0 : page} of {totalPages}
      </p>
      <div className="flex items-center gap-x-4">
        <Select
          value={pageSize.toString()}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          <SelectTrigger className="h-8 w-15">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map((size) => (
              <SelectItem key={size.value} value={size.value.toString()}>
                {size.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-x-4">
          <Button
            aria-label="First page"
            disabled={isFirstPage}
            onClick={handleFirst}
            size="icon"
            variant="outline"
          >
            <ChevronsLeft className="size-4" />
          </Button>
          <Button
            aria-label="Previous page"
            disabled={isFirstPage}
            onClick={handlePrevious}
            size="icon"
            variant="outline"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            aria-label="Next page"
            disabled={isLastPage}
            onClick={handleNext}
            size="icon"
            variant="outline"
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            aria-label="Last page"
            disabled={isLastPage}
            onClick={handleLast}
            size="icon"
            variant="outline"
          >
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
