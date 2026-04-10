import Image, { type ImageProps } from "next/image";

/**
 * Optimised image wrapper — Session 6 §8.
 *
 * Defaults:
 *   - AVIF/WebP via `next.config.mjs` `images.formats`.
 *   - Blur placeholder when a `blurDataURL` is supplied, otherwise
 *     a subtle 1×1 base64 paper-coloured shimmer.
 *   - `priority` opt-in for known LCP candidates (hero images,
 *     above-the-fold OG art).
 *
 * Use this in place of `<img>` everywhere we ship raster art.
 */

// 1×1 base64 PNG of #fafaf9 (paper). Avoids a `data:` typo and is
// re-used across all images so the browser caches it once.
const PAPER_BLUR =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=";

export interface OptimizedImageProps extends Omit<ImageProps, "placeholder"> {
  /** Defaults to true. Set false to disable the shimmer. */
  blur?: boolean;
}

export function OptimizedImage({
  blur = true,
  blurDataURL,
  alt,
  ...rest
}: OptimizedImageProps): JSX.Element {
  if (!blur) {
    return <Image {...rest} alt={alt} placeholder="empty" />;
  }
  return (
    <Image
      {...rest}
      alt={alt}
      placeholder="blur"
      blurDataURL={blurDataURL ?? PAPER_BLUR}
    />
  );
}
