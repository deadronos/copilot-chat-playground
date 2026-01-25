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
      <div className={cn(
          "rounded-3xl p-6 transition-colors duration-200",
          isOpen
            ? "border border-slate-700 bg-slate-800/80 shadow-[0_30px_80px_-60px_rgba(2,6,23,0.7)]"
            : "border border-slate-400 bg-white/85 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.08)] backdrop-blur-sm"
        )}>
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center justify-between gap-4 transition-opacity hover:opacity-80">
            <div className="flex-1 text-left">
              <h2 className={cn("font-display text-2xl", isOpen ? "text-white" : "text-slate-900")}>RedVsBlue Simulation</h2>
              <p className={cn("mt-2 text-sm", isOpen ? "text-slate-300" : "text-slate-500")}>
                {isOpen
                  ? "Toggle \'Ask Copilot\' button to let the AI direct and commentate the battle."
                  : "Load the RedVsBlue simulation to see AI in action directing a battle between red and blue ships."}
              </p>
            </div>
            <ChevronDownIcon
              className={cn(
                "size-5 transition-transform duration-200",
                isOpen ? "rotate-180 text-slate-300" : "text-slate-500"
              )}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className={cn("mt-6", isOpen ? "border-t border-slate-700/20 pt-6" : "")}>
          {isOpen ? (
            <div className="aspect-video overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-900">
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
                  className="rounded-2xl bg-slate-800 text-white shadow-lg hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300/20"
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
