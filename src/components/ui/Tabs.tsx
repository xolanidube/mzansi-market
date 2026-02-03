"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within a Tabs provider");
  }
  return context;
}

export interface TabsProps {
  defaultTab?: string;
  value?: string;
  children: ReactNode;
  className?: string;
  onChange?: (tab: string) => void;
  onValueChange?: (tab: string) => void;
}

export function Tabs({ defaultTab, value, children, className, onChange, onValueChange }: TabsProps) {
  const [internalTab, setInternalTab] = useState(defaultTab || value || "");
  const activeTab = value !== undefined ? value : internalTab;

  const handleSetActiveTab = (tab: string) => {
    if (value === undefined) {
      setInternalTab(tab);
    }
    onChange?.(tab);
    onValueChange?.(tab);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleSetActiveTab }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export interface TabsListProps {
  children: ReactNode;
  className?: string;
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 p-1 bg-secondary rounded-lg",
        className
      )}
      role="tablist"
    >
      {children}
    </div>
  );
}

export interface TabProps {
  value: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function Tab({ value, children, className, disabled }: TabProps) {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`panel-${value}`}
      disabled={disabled}
      className={cn(
        "px-4 py-2 text-sm font-medium rounded-md transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        isActive
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={() => !disabled && setActiveTab(value)}
    >
      {children}
    </button>
  );
}

export interface TabsPanelProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabsPanel({ value, children, className }: TabsPanelProps) {
  const { activeTab } = useTabsContext();

  if (activeTab !== value) return null;

  return (
    <div
      role="tabpanel"
      id={`panel-${value}`}
      className={cn("mt-4 animate-fade-in", className)}
    >
      {children}
    </div>
  );
}

// Aliases for API compatibility
export const TabsTrigger = Tab;
export const TabsContent = TabsPanel;
