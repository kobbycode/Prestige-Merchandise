import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export const ProductCardSkeleton = () => {
    return (
        <Card className="overflow-hidden">
            <CardContent className="p-0">
                {/* Image skeleton */}
                <Skeleton className="w-full h-64" />

                {/* Content skeleton */}
                <div className="p-4 space-y-3">
                    {/* Category badge */}
                    <Skeleton className="h-5 w-20 rounded-full" />

                    {/* Title */}
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-3/4" />

                    {/* Price and discount */}
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-7 w-24" />
                        <Skeleton className="h-5 w-16" />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2 pt-2">
                        <Skeleton className="h-10 flex-1" />
                        <Skeleton className="h-10 w-10" />
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
