"use client";

import { useState } from "react";
import { Lightbulb, ChevronDown, ChevronUp } from "lucide-react";

interface GuideStep {
  title: string;
  description: string;
}

interface UsageGuideProps {
  steps: GuideStep[];
  tip?: string;
}

export function UsageGuide({ steps, tip }: UsageGuideProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-300">
          <Lightbulb className="h-4 w-4" />
          내 영상에 이렇게 활용하세요
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-amber-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-amber-500" />
        )}
      </button>
      {open && (
        <div className="border-t border-amber-200 px-4 pb-4 pt-3 dark:border-amber-800">
          <ol className="space-y-3">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-800 dark:bg-amber-800 dark:text-amber-200">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    {step.title}
                  </p>
                  <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          {tip && (
            <div className="mt-3 rounded-lg bg-amber-100 p-3 text-xs text-amber-700 dark:bg-amber-900 dark:text-amber-300">
              <span className="font-bold">Pro Tip:</span> {tip}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
