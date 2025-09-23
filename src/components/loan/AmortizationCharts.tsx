'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '@/lib/amortization';
import type { AmortizationPeriod, LoanData } from '@/lib/types';
import { useMemo } from 'react';

type AmortizationChartsProps = {
  schedule: AmortizationPeriod[];
  loanData: LoanData;
};

const chartConfig = {
  balance: {
    label: 'Remaining Balance',
    color: 'hsl(var(--chart-1))',
  },
  principal: {
    label: 'Total Principal',
    color: 'hsl(var(--chart-1))',
  },
  interest: {
    label: 'Total Interest',
    color: 'hsl(var(--chart-2))',
  },
};

export default function AmortizationCharts({
  schedule,
  loanData,
}: AmortizationChartsProps) {
  const totalInterest = schedule[schedule.length - 1]?.totalInterest || 0;
  const totalPrincipal = loanData.principal;

  const pieData = [
    { name: 'Total Principal', value: totalPrincipal, fill: 'var(--color-principal)' },
    { name: 'Total Interest', value: totalInterest, fill: 'var(--color-interest)' },
  ];

  const yearlyData = useMemo(() => {
    const dataByYear: { year: number; balance: number }[] = [];
    schedule.forEach((period, index) => {
      if ((period.month % 12 === 0) || (index === schedule.length - 1)) {
        dataByYear.push({
          year: Math.ceil(period.month / 12),
          balance: period.remainingBalance,
        });
      }
    });
    return dataByYear;
  }, [schedule]);


  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Balance Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <AreaChart data={yearlyData} margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" unit=" yr" />
              <YAxis tickFormatter={(value) => formatCurrency(value as number)} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent 
                    formatter={(value) => formatCurrency(value as number)}
                />}
              />
              <Area
                dataKey="balance"
                type="monotone"
                fill="var(--color-balance)"
                stroke="var(--color-balance)"
                stackId="1"
                name="Remaining Balance"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Principal vs. Interest</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent 
                        formatter={(value) => formatCurrency(value as number)}
                        hideLabel
                    />}
                />
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
