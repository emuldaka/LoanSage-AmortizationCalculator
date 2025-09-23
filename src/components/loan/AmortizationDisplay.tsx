'use client';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AmortizationPeriod, LoanData } from '@/lib/types';
import AmortizationSummary from './AmortizationSummary';
import AmortizationTable from './AmortizationTable';
import AmortizationCharts from './AmortizationCharts';
import { Button } from '../ui/button';
import { FileDown } from 'lucide-react';

type AmortizationDisplayProps = {
  schedule: AmortizationPeriod[];
  loanData: LoanData;
};

export default function AmortizationDisplay({
  schedule,
  loanData,
}: AmortizationDisplayProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Card className="printable-area">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Loan Analysis</CardTitle>
        <Button onClick={handlePrint} variant="outline" size="sm" className="no-print">
          <FileDown className="mr-2 h-4 w-4" />
          Download Report
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary">
          <TabsList className="grid w-full grid-cols-3 no-print">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="charts">Charts</TabsTrigger>
          </TabsList>
          <TabsContent value="summary" className="mt-4">
            <AmortizationSummary schedule={schedule} loanData={loanData} />
          </TabsContent>
          <TabsContent value="schedule" className="mt-4">
            <AmortizationTable schedule={schedule} />
          </TabsContent>
          <TabsContent value="charts" className="mt-4">
            <AmortizationCharts schedule={schedule} loanData={loanData} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
