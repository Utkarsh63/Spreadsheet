'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/hooks/useTheme';
import { Button } from './Button';
import { Tooltip } from './Tooltip';

interface ThemeToggleProps {
  className?: string;
  tooltip?: boolean;
}

export function ThemeToggle({ className, tooltip = true }: ThemeToggleProps) {
  const { theme, toggleTheme, mounted } = useTheme();

  // Avoid SSR mismatch — render a placeholder until client hydration is complete
  if (!mounted) return <div className="h-7 w-7 shrink-0" />;

  const button = (
    <Button variant="ghost" size="sm" onClick={toggleTheme} aria-label="Toggle theme" className={className}>
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );

  if (!tooltip) return button;

  return (
    <Tooltip content={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
      {button}
    </Tooltip>
  );
}
ThemeToggle.displayName = 'ThemeToggle';
