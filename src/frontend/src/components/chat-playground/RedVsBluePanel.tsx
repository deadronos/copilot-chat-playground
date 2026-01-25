import * as React from "react";
import { ChevronDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import RedVsBlue from "@/redvsblue/RedVsBlue";

type RedVsBluePanelProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RedVsBluePanel({ isOpen, onOpenChange }: RedVsBluePanelProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <div className="rounded-3xl border border-slate-900/10 bg-white/85 p-6 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.8)] backdrop-blur-sm">
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center justify-between gap-4 transition-opacity hover:opacity-80">
            <div className="flex-1 text-left">
              <h2 className="font-display text-2xl text-slate-900">RedVsBlue Simulation</h2>
              <p className="mt-2 text-sm text-slate-500">
                {isOpen
                  ? "Watch an interactive battle simulation between red and blue teams."
                  : "Load an interactive battle simulation."}
              </p>
            </div>
            <ChevronDownIcon
              className={cn(
                "size-5 text-slate-500 transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-6">
          {isOpen ? (
            <div className="aspect-video overflow-hidden rounded-2xl border border-slate-900/10 bg-slate-900">
              <ErrorBoundary name="RedVsBlue">
                <RedVsBlue />
              </ErrorBoundary>
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 px-6 py-12 text-center">
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-sm text-slate-600">No simulation loaded</p>
                  <p className="text-xs text-slate-500">
                    Click \"Load RedVsBlue simulation\" to start the battle.
                  </p>
                </div>
                <Button
                  onClick={() => onOpenChange(true)}
                  className="rounded-2xl bg-slate-900 text-white shadow-[0_16px_32px_-18px_rgba(15,23,42,0.7)] hover:bg-slate-800"
                >
                  Load RedVsBlue simulation
                </Button>
              </div>
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
