import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function SimuladosLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <Skeleton className="h-8 md:h-10 w-48" />
        <Skeleton className="h-4 md:h-6 w-96" />
      </div>

      {/* Search and Filter Skeletons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-1">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-full sm:w-[180px]" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Cards Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-2">
                <Skeleton className="h-4 w-4 md:h-5 md:w-5 mt-0.5 flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 md:h-5 w-full" />
                  <Skeleton className="h-4 md:h-5 w-3/4" />
                </div>
              </div>
              <Skeleton className="h-3 md:h-4 w-full" />
            </CardHeader>
            <CardContent className="pb-3 flex-1">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-3 md:h-4 w-16" />
                  <Skeleton className="h-3 md:h-4 w-8" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-3 md:h-4 w-12" />
                  <Skeleton className="h-3 md:h-4 w-12" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-3 md:h-4 w-20" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </div>
            </CardContent>
            <div className="p-6 pt-0">
              <Skeleton className="h-10 w-full" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
