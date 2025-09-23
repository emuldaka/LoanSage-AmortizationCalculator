'use client';
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { formatCurrency } from '@/lib/amortization';
import type { AmortizationPeriod } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ROWS_PER_PAGE = 12;

type AmortizationTableProps = {
  schedule: AmortizationPeriod[];
};

export default function AmortizationTable({ schedule }: AmortizationTableProps) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(schedule.length / ROWS_PER_PAGE);
  const paginatedSchedule = schedule.slice(
    page * ROWS_PER_PAGE,
    (page + 1) * ROWS_PER_PAGE
  );

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px] text-center">Month</TableHead>
              <TableHead className="text-right">Payment</TableHead>
              <TableHead className="text-right">Principal</TableHead>
              <TableHead className="text-right">Interest</TableHead>
              <TableHead className="text-right">Extra</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSchedule.map((period) => (
              <TableRow key={period.month}>
                <TableCell className="text-center font-medium">
                  {period.month}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(period.payment)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(period.principal)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(period.interest)}
                </TableCell>
                <TableCell className="text-right text-primary">
                  {formatCurrency(period.extraPayment)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(period.remainingBalance)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="mt-4 flex items-center justify-between no-print">
        <div className="text-sm text-muted-foreground">
          Page {page + 1} of {totalPages}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage(0)}
            disabled={page === 0}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage(page - 1)}
            disabled={page === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage(totalPages - 1)}
            disabled={page === totalPages - 1}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
