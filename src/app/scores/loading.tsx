export default function ScoresLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 animate-pulse">
        <div className="mb-2 h-9 w-48 rounded bg-muted" />
        <div className="h-4 w-full max-w-2xl rounded bg-muted" />
      </div>
      <div className="grid gap-8 lg:grid-cols-4">
        <div className="h-80 animate-pulse rounded-xl bg-muted lg:col-span-1" />
        <div className="space-y-4 lg:col-span-3">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-96 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    </div>
  );
}
