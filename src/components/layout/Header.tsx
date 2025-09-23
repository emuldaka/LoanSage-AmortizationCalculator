'use client';

import { Landmark } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex items-center">
          <Landmark className="h-6 w-6 text-primary" />
          <span className="ml-2 text-lg font-bold">LoanSage</span>
        </div>
        <div className="flex flex-1 items-center justify-end">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
