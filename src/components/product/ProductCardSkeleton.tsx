import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export const ProductCardSkeleton = () => {
    return (
        <Card className="overflow-hidden border-none shadow-sm bg-card/50">
            <CardContent className="p-0">
                {/* Image skeleton with a subtle background */}
                <div className="bg-muted aspect-[4/5] relative overflow-hidden">
                    <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
                </div>

                {/* Content skeleton */}
                <div className="p-5 space-y-4">
                    {/* Category badge */}
                    <Skeleton className="h-5 w-24 rounded-full bg-primary/10" />

                    {/* Title */}
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-2/3" />
                    </div>

                    {/* Price and discount */}
                    <div className="flex items-center justify-between pt-2">
                        <Skeleton className="h-8 w-28" />
                        <Skeleton className="h-10 w-10 rounded-full" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export const ProductGridSkeleton = ({ count = 8 }: { count?: number }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: count }).map((_, index) => (
                <ProductCardSkeleton key={index} />
            ))}
        </div>
    );
};
