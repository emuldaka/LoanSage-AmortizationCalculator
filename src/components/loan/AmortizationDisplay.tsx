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
import Papa from 'papaparse';
import { formatCurrency } from '@/lib/amortization';

type AmortizationDisplayProps = {
  schedule: AmortizationPeriod[];
  loanData: LoanData;
};

export default function AmortizationDisplay({
  schedule,
  loanData,
}: AmortizationDisplayProps) {

  const handleDownloadCsv = () => {
    // We prepare the schedule data for the main part of the CSV
    const dataToExport = schedule.map(period => ({
      Month: period.month,
      Payment: formatCurrency(period.payment),
      Principal: formatCurrency(period.principal),
      Interest: formatCurrency(period.interest),
      'Extra Payment': formatCurrency(period.extraPayment),
      'Remaining Balance': formatCurrency(period.remainingBalance),
      'Total Interest': formatCurrency(period.totalInterest),
    }));

    // To allow importing back, we prepend a special metadata row containing the input parameters
    const configMetadata = JSON.stringify(loanData);
    const csvContent = Papa.unparse(dataToExport);
    const finalCsv = `LOANSAGE_CONFIG,${configMetadata}\n` + csvContent;

    const blob = new Blob([finalCsv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `loansage_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <Card className="printable-area">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Loan Analysis</CardTitle>
        <div className='flex gap-2 no-print'>
          <Button onClick={handleDownloadCsv} variant="outline" size="sm" >
            <FileDown className="mr-2 h-4 w-4" />
            Download Report
          </Button>
        </div>
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
