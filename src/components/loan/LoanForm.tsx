'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import * as z from 'zod';
import {
  Calculator,
  Lightbulb,
  Plus,
  Trash2,
  RefreshCw,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { useState } from 'react';
import { differenceInCalendarMonths, format } from 'date-fns';

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
import type { AmortizationPeriod, LoanData, ModificationPeriod } from '@/lib/types';
import { suggestOptimalPaymentSchedule } from '@/ai/flows/suggest-optimal-payment-schedule';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

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
};

export default function LoanForm({
  onCalculate,
  onReset,
  hasResults,
}: LoanFormProps) {
  const { toast } = useToast();
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      principal: 100000,
      interestRate: 5,
      termInYears: 30,
      extraPayment: 0,
      modificationPeriods: [],
      startDate: new Date(),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'modificationPeriods',
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const loanStartDate = values.startDate || new Date();
    
    const modificationPeriods: ModificationPeriod[] = (values.modificationPeriods || []).map(p => {
        const month = differenceInCalendarMonths(p.paymentDate, loanStartDate) + 1;
        return { startMonth: month, endMonth: month, amount: p.amount };
    }).filter(p => p.startMonth > 0);

    const loanData: LoanData = {
      ...values,
      modificationPeriods,
    };

    const schedule = calculateAmortizationSchedule(loanData);
    if (schedule.length > 0) {
      onCalculate(values, schedule);
      toast({
        title: 'Calculation Complete',
        description: 'Your amortization schedule has been generated.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Calculation Error',
        description:
          'Could not generate schedule. Please check your inputs.',
      });
    }
  }

  const handleAiSuggest = async () => {
    const values = form.getValues();
    const validation = formSchema.safeParse(values);
    if (!validation.success) {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'Please fix the errors in the form before suggesting a schedule.',
      });
      // Trigger validation display
      form.trigger();
      return;
    }

    setIsAiLoading(true);
    try {
      const loanStartDate = values.startDate || new Date();
      const modificationPeriods: ModificationPeriod[] = (values.modificationPeriods || []).map(p => {
        const month = differenceInCalendarMonths(p.paymentDate, loanStartDate) + 1;
        return { startMonth: month, endMonth: month, amount: p.amount };
      }).filter(p => p.startMonth > 0);

      const result = await suggestOptimalPaymentSchedule({
        principal: values.principal,
        interestRate: values.interestRate / 100,
        loanTermMonths: values.termInYears * 12,
        extraPaymentAmount: values.extraPayment,
        paymentModificationPeriods: modificationPeriods,
      });
      setAiSuggestion(result.suggestedPaymentSchedule);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'AI Suggestion Failed',
        description:
          'There was an error getting a suggestion. Please try again.',
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleResetForm = () => {
    form.reset();
    onReset();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-6 w-6" />
            Amortization Calculator
          </CardTitle>
          <CardDescription>
            Enter your loan details to generate an amortization schedule.
          </CardDescription>
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
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date('1900-01-01')
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

              <div>
                <h3 className="text-lg font-medium">Extra Payments</h3>
                <p className="text-sm text-muted-foreground">
                  Adding extra payments can help you pay off your loan faster and save on interest.
                </p>
              </div>

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
                {fields.map((field, index) => (
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
                                    !field.value && 'text-muted-foreground'
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? (
                                    format(field.value, 'PPP')
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
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
                ))}

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
                    <RefreshCw />
                    Reset
                  </Button>
                )}
                <Button type="button" variant="secondary" onClick={handleAiSuggest} disabled={isAiLoading}>
                  <Lightbulb />
                  {isAiLoading ? 'Thinking...' : 'AI Suggest Optimal Schedule'}
                </Button>
                <Button type="submit">
                  <Calculator />
                  Calculate Schedule
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      <Dialog open={!!aiSuggestion} onOpenChange={() => setAiSuggestion(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Lightbulb />
              AI-Suggested Payment Schedule
            </DialogTitle>
            <DialogDescription>
              Here is an optimized payment strategy to reduce your loan term and interest paid.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto rounded-md bg-muted p-4">
            <pre className="whitespace-pre-wrap text-sm text-muted-foreground">
              {aiSuggestion}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
