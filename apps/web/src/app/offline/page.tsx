export const metadata = {
  title: "Offline | Covenant",
  description: "You appear to be offline. Some Covenant features may be unavailable until you reconnect."
};

export default function OfflinePage(): JSX.Element {
  return (
    <main className="mx-auto grid min-h-screen max-w-lg place-items-center px-4 py-16 text-center">
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-widest text-ink/50">Offline</p>
        <h1 className="text-3xl font-semibold">You&rsquo;re offline</h1>
        <p className="text-ink/70">
          Covenant needs an internet connection to scan repositories. The
          dashboard will resume the moment you&rsquo;re back online.
        </p>
        <p className="text-xs text-ink/60">
          Tip: cached help articles you visited earlier may still load.
        </p>
      </div>
    </main>
  );
}
