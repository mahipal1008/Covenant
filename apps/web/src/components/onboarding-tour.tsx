"use client";

import { useEffect, useState } from "react";
import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { track } from "@/components/analytics";

/**
 * Progressive-disclosure onboarding tour — Session 5 §8.
 *
 * Shows a small dismissible card pinned to the bottom-right that
 * walks a new user through 4 milestones. Each milestone fires the
 * `onboarding.step` analytics event. Time-to-first-value (TTFV)
 * is the timestamp of step 4 minus step 1, persisted in
 * localStorage so the admin dashboard can read it.
 */

export interface TourStep {
  key: string;
  title: string;
  body: string;
}

const DEFAULT_STEPS: TourStep[] = [
  { key: "connect-repo", title: "Connect a repo", body: "Use the sample repo to skip the GitHub auth dance and jump straight to a live scan." },
  { key: "first-scan", title: "Watch the scan", body: "20 agents run in parallel. Findings appear as they finish — no need to wait for the whole job." },
  { key: "first-finding", title: "Triage a finding", body: "Open any high-severity finding to see the diff, the agent's reasoning, and the suggested fix." },
  { key: "share-result", title: "Share the report", body: "One click for a signed PDF or a teammate-share link. That's your TTFV." }
];

const TTFV_KEY = "covenant.ttfv.v1";
const STEP_KEY = "covenant.tour.step.v1";

export function OnboardingTour({ steps = DEFAULT_STEPS }: { steps?: TourStep[] }): JSX.Element | null {
  const [index, setIndex] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STEP_KEY);
    const startedAt = localStorage.getItem(TTFV_KEY);
    if (!startedAt) localStorage.setItem(TTFV_KEY, String(Date.now()));
    setIndex(saved ? Math.min(Number(saved), steps.length - 1) : 0);
  }, [steps.length]);

  if (dismissed || index === null) return null;
  const step = steps[index];
  if (!step) return null;

  function next() {
    track("onboarding.step", { step: index! + 1, key: step!.key });
    if (index! + 1 >= steps.length) {
      const startedAt = Number(localStorage.getItem(TTFV_KEY) ?? Date.now());
      const ttfvSec = Math.round((Date.now() - startedAt) / 1000);
      track("onboarding.complete", { ttfvSec });
      localStorage.setItem("covenant.ttfv.complete", String(ttfvSec));
      setDismissed(true);
      return;
    }
    const ni = index! + 1;
    localStorage.setItem(STEP_KEY, String(ni));
    setIndex(ni);
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm" role="dialog" aria-label="Onboarding tour">
      <Panel className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-ink/60">
          Step {index + 1} of {steps.length}
        </p>
        <h3 className="text-sm font-semibold">{step.title}</h3>
        <p className="text-sm text-ink/80">{step.body}</p>
        <div className="flex justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-xs text-ink/60 underline"
          >
            Skip tour
          </button>
          <Button type="button" onClick={next}>
            {index + 1 === steps.length ? "Finish" : "Next"}
          </Button>
        </div>
      </Panel>
    </div>
  );
}
