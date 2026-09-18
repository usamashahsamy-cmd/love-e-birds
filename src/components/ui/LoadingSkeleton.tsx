export default function LoadingSkeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded-lg ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-card-border overflow-hidden">
      <div className="aspect-[3/4] bg-muted animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
        <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
        <div className="h-3 bg-muted rounded w-full animate-pulse" />
      </div>
    </div>
  );
}

export function ProfileGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}