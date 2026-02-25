'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import * as z from 'zod';
import {
  Calculator,
  Plus,
  Trash2,
  RefreshCw,
  Calendar as CalendarIcon,
  Upload,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import { differenceInCalendarMonths, format, isValid } from 'date-fns';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { calculateAmortizationSchedule } from '@/lib/amortization';
import type { AmortizationPeriod, LoanData } from '@/lib/types';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';

const modificationPeriodSchema = z.object({
  paymentDate: z.date({
    required_error: 'A date is required.',
  }),
  amount: z.coerce
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Amount cannot be negative'),
});

const formSchema = z
  .object({
    principal: z.coerce
      .number({ invalid_type_error: 'Please enter a valid amount' })
      .positive('Principal must be a positive number'),
    interestRate: z.coerce
      .number({ invalid_type_error: 'Please enter a valid rate' })
      .min(0, 'Interest rate cannot be negative'),
    termInYears: z.coerce
      .number({ invalid_type_error: 'Please enter a valid term' })
      .positive('Term must be a positive number'),
    startDate: z.date().optional(),
    extraPayment: z.coerce
      .number({ invalid_type_error: 'Please enter a valid amount' })
      .min(0, 'Extra payment cannot be negative')
      .optional(),
    modificationPeriods: z.array(modificationPeriodSchema).optional(),
  });

type LoanFormProps = {
  onCalculate: (
    data: LoanData,
    schedule: AmortizationPeriod[]
  ) => void;
  onReset: () => void;
  hasResults: boolean;
  initialData: LoanData | null;
  isClient: boolean;
};

const defaultValues = {
  principal: 100000,
  interestRate: 5,
  termInYears: 30,
  extraPayment: 0,
  modificationPeriods: [],
  startDate: new Date(),
};

export default function LoanForm({
  onCalculate,
  onReset,
  hasResults,
  initialData,
  isClient,
}: LoanFormProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
  });

  useEffect(() => {
    if (isClient) {
      if (initialData) {
        const dataForForm: any = {
          ...initialData,
          startDate: initialData.startDate ? new Date(initialData.startDate) : new Date(),
           modificationPeriods: (initialData.modificationPeriods || []).map(mod => ({
            ...mod,
            paymentDate: mod.paymentDate ? new Date(mod.paymentDate) : new Date(),
          })),
        };
        form.reset(dataForForm);
      } else {
        form.reset(defaultValues);
      }
    }
  }, [initialData, form, isClient]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'modificationPeriods',
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const loanStartDate = values.startDate || new Date();
    
    const loanDataForStorage: LoanData = {
        ...values,
        modificationPeriods: (values.modificationPeriods || []).map(p => ({
            ...p,
            startMonth: differenceInCalendarMonths(new Date(p.paymentDate), loanStartDate) + 1,
            endMonth: differenceInCalendarMonths(new Date(p.paymentDate), loanStartDate) + 1
        }))
    };
    
    const schedule = calculateAmortizationSchedule(loanDataForStorage);

    if (schedule.length > 0) {
      onCalculate(loanDataForStorage, schedule);
      toast({
        title: 'Calculation Complete',
        description: 'Your amortization schedule has been generated.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Calculation Error',
        description: 'Could not generate schedule. Please check your inputs.',
      });
    }
  }

  const handleResetForm = () => {
    form.reset(defaultValues);
    onReset();
  };

  const handleImportCsv = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lines = content.split('\n');
      const firstLine = lines[0];

      if (firstLine.startsWith('LOANSAGE_CONFIG,')) {
        try {
          const jsonString = firstLine.substring('LOANSAGE_CONFIG,'.length);
          const importedData = JSON.parse(jsonString) as LoanData;
          
          // Re-hydrate the data
          const startDate = importedData.startDate ? new Date(importedData.startDate) : new Date();
          const modificationPeriods = (importedData.modificationPeriods || []).map(mod => ({
            ...mod,
            paymentDate: mod.paymentDate ? new Date(mod.paymentDate) : new Date(),
          }));

          const valuesToSet = {
            ...importedData,
            startDate,
            modificationPeriods
          };

          form.reset(valuesToSet);
          // Trigger calculation immediately
          onSubmit(valuesToSet as any);

          toast({
            title: 'Report Imported',
            description: 'Your loan data has been successfully restored.',
          });
        } catch (error) {
          toast({
            variant: 'destructive',
            title: 'Import Failed',
            description: 'Could not parse the loan data from this CSV.',
          });
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Invalid File',
          description: 'This CSV does not appear to be a LoanSage export.',
        });
      }
    };
    reader.readAsText(file);
    // Clear the input so the same file can be uploaded again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!isClient) {
    return (
       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-6 w-6" />
            Amortization Calculator
          </CardTitle>
          <CardDescription>
            Enter your loan details or upload a previous report.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
             <Separator />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
               <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-4">
               <Skeleton className="h-8 w-48" />
               <Skeleton className="h-8 w-64" />
            </div>
             <div className="flex justify-end">
                <Skeleton className="h-10 w-40" />
            </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-6 w-6" />
                Amortization Calculator
              </CardTitle>
              <CardDescription>
                Enter details manually or import a previous session.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".csv"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImportCsv}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Import CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8"
            >
               <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <FormField
                  control={form.control}
                  name="principal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loan Principal ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 300000"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="interestRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interest Rate (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="e.g., 5.25"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="termInYears"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loan Term (Years)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 30"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col pt-2">
                      <FormLabel>Loan Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-full justify-start text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value && isValid(new Date(field.value)) ? (
                                format(new Date(field.value), 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date('2100-01-01') || date < new Date('1900-01-01')
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                 <FormField
                  control={form.control}
                  name="extraPayment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recurring Extra Monthly Payment ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="50"
                          placeholder="e.g., 200"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : +e.target.value)}
                        />
                      </FormControl>
                      <FormDescription>
                        This amount will be added to every monthly payment.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <FormLabel>One-Time Extra Payments</FormLabel>
                 <FormDescription>
                  Specify additional one-time payments.
                </FormDescription>
                {fields.map((field, index) => {
                  const dateValue = form.watch(`modificationPeriods.${index}.paymentDate`);
                  return (
                  <div
                    key={field.id}
                    className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-end"
                  >
                    <FormField
                      control={form.control}
                      name={`modificationPeriods.${index}.paymentDate`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Payment Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={'outline'}
                                  className={cn(
                                    'w-full justify-start text-left font-normal',
                                    !dateValue && 'text-muted-foreground'
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {dateValue && isValid(new Date(dateValue)) ? (
                                    format(new Date(dateValue), 'PPP')
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value ? new Date(field.value) : undefined}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`modificationPeriods.${index}.amount`}
                      render={({ field }) => (
                        <FormItem className='flex-1'>
                          <FormLabel>Additional Amount ($)</FormLabel>
                          <FormControl>
                            <Input type="number" step="50" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => remove(index)}
                      className="shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )})}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({ paymentDate: new Date(), amount: 1000 })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add One-Time Payment
                </Button>
              </div>

              <div className="flex flex-col gap-2 md:flex-row md:justify-end">
                {hasResults && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResetForm}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                )}
                <Button type="submit">
                  <Calculator className="mr-2 h-4 w-4" />
                  Calculate Schedule
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
