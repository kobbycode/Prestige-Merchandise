import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export const BlogCardSkeleton = () => {
    return (
        <Card className="h-full overflow-hidden">
            <CardContent className="p-0">
                {/* Image skeleton */}
                <Skeleton className="w-full h-48" />

                {/* Content skeleton */}
                <div className="p-6 space-y-4">
                    {/* Date */}
                    <Skeleton className="h-4 w-32" />

                    {/* Title */}
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-4/5" />

                    {/* Excerpt */}
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>

                    {/* Read more button */}
                    <Skeleton className="h-10 w-32" />
                </div>
            </CardContent>
        </Card>
    );
};

export const BlogGridSkeleton = ({ count = 6 }: { count?: number }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, index) => (
                <BlogCardSkeleton key={index} />
            ))}
        </div>
    );
};
