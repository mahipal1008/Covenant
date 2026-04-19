"use client";

import { useState } from "react";
import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { track } from "@/components/analytics";

/**
 * In-product NPS — Session 5 §7.
 *
 * Posts to `/v1/nps`. Display logic (cooldown, eligibility) is the
 * caller's responsibility — this component is a dumb form.
 */

export interface NpsSurveyProps {
  surface?: string;
  onSubmitted?: () => void;
}

export function NpsSurvey({ surface = "dashboard", onSubmitted }: NpsSurveyProps): JSX.Element {
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);

  async function submit() {
    if (score === null) return;
    track("nps.submit", { score, surface });
    const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
    await fetch(`${api}/v1/nps`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ score, comment, surface })
    }).catch(() => undefined);
    setDone(true);
    onSubmitted?.();
  }

  return (
    <Panel className="space-y-3">
      <div role="region" aria-label="NPS survey" className="contents">
      {done ? (
        <p className="text-sm" role="status">
          Thanks — your feedback was recorded.
        </p>
      ) : (
        <>
          <p className="text-sm font-medium">
            How likely are you to recommend Covenant to a peer?
          </p>
          <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="NPS score 0 to 10">
            {Array.from({ length: 11 }, (_, i) => (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={score === i}
                onClick={() => setScore(i)}
                className={`h-9 w-9 rounded border text-sm ${
                  score === i ? "border-cobalt bg-cobalt text-white" : "border-line bg-paper"
                }`}
              >
                {i}
              </button>
            ))}
          </div>
          {score !== null && (
            <>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                placeholder="What's the main reason for your score?"
                className="w-full rounded border border-line bg-paper px-3 py-2 text-sm"
                aria-label="NPS comment"
              />
              <Button type="button" onClick={submit}>Submit</Button>
            </>
          )}
        </>
      )}
      </div>
    </Panel>
  );
}
