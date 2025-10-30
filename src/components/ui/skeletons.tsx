import { memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

// Optimized loading skeleton
export const TableSkeleton = memo(({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) => (
  <Card className="p-6">
    <Skeleton className="h-8 w-48 mb-4" />
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  </Card>
));

export const DashboardSkeleton = memo(() => (
  <div className="space-y-6">
    {/* Header skeleton */}
    <div className="flex justify-between items-center">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-32" />
    </div>
    
    {/* Stats cards skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-6">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-16" />
        </Card>
      ))}
    </div>
    
    {/* Table skeleton */}
    <TableSkeleton rows={8} columns={5} />
  </div>
));

export const MenuSkeleton = memo(() => (
  <div className="space-y-4">
    {[1, 2, 3, 4].map((i) => (
      <Card key={i} className="p-4">
        <div className="flex space-x-4">
          <Skeleton className="h-16 w-16 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
      </Card>
    ))}
  </div>
));

export const RestaurantCardSkeleton = memo(() => (
  <Card className="p-6">
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-6 w-16" />
    </div>
  </Card>
));