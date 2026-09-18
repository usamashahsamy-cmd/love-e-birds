import { SearchX, Inbox } from "lucide-react";
import ProfileCard from "./ProfileCard";
import type { DiscoverProfile } from "@/lib/discover";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import EmptyState from "@/components/ui/EmptyState";

interface ProfileGridProps {
  profiles: DiscoverProfile[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  showSkeleton?: boolean;
}

export default function ProfileGrid({
  profiles,
  loading = false,
  emptyTitle = "No profiles found",
  emptyDescription = "Try a different location or check back later.",
  showSkeleton = true,
}: ProfileGridProps) {
  if (loading && profiles.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-3 p-4 pt-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-card border border-card-border rounded-xl overflow-hidden">
            <div className="aspect-[3/4]">
              <LoadingSkeleton className="w-full h-full rounded-none" />
            </div>
            <div className="p-2.5 space-y-2">
              <LoadingSkeleton className="h-3.5 w-2/3" />
              <LoadingSkeleton className="h-2.5 w-1/2" />
              <LoadingSkeleton className="h-8 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <EmptyState
        icon={showSkeleton ? SearchX : Inbox}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 p-4 pt-3">
        {profiles.map((profile) => (
          <ProfileCard key={profile.id} {...profile} />
        ))}
      </div>
      {loading && (
        <div className="grid grid-cols-2 gap-3 px-4 pb-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-card border border-card-border rounded-xl overflow-hidden">
              <LoadingSkeleton className="aspect-[3/4] w-full rounded-none" />
            </div>
          ))}
        </div>
      )}
    </>
  );
}