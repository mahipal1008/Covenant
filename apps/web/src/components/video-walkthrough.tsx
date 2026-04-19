"use client";

import { useState } from "react";

/**
 * Video walkthrough embed — Session 6 §2.
 *
 * Lazy-loads a third-party iframe (Loom / Screen Studio / YouTube)
 * only after the user clicks the poster, so we don't tank LCP on
 * marketing pages. The poster is a normal image; pass an
 * AVIF/WebP/JPEG path.
 */

export interface VideoWalkthroughProps {
  src: string;
  title: string;
  poster?: string;
  /** Provider hint controls the iframe permissions sandbox. */
  provider?: "loom" | "screenstudio" | "youtube";
}

const sandboxByProvider: Record<NonNullable<VideoWalkthroughProps["provider"]>, string> = {
  loom: "allow-scripts allow-same-origin allow-presentation",
  screenstudio: "allow-scripts allow-same-origin allow-presentation",
  youtube: "allow-scripts allow-same-origin allow-presentation allow-popups"
};

export function VideoWalkthrough({
  src,
  title,
  poster,
  provider = "loom"
}: VideoWalkthroughProps): JSX.Element {
  const [playing, setPlaying] = useState(false);
  if (playing) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded border border-line bg-ink">
        <iframe
          src={src}
          title={title}
          className="h-full w-full"
          sandbox={sandboxByProvider[provider]}
          allow="autoplay; fullscreen; picture-in-picture"
          loading="lazy"
        />
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="group relative aspect-video w-full overflow-hidden rounded border border-line bg-ink"
      aria-label={`Play video: ${title}`}
    >
      {poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt="" className="h-full w-full object-cover opacity-90" />
      ) : (
        <span className="grid h-full w-full place-items-center text-white/60">{title}</span>
      )}
      <span className="absolute inset-0 grid place-items-center">
        <span className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-ink shadow group-hover:bg-white">
          ▶ Play walkthrough
        </span>
      </span>
    </button>
  );
}
