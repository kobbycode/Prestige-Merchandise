import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export const ProductDetailSkeleton = () => {
    return (
        <div className="container mx-auto px-4 py-6 md:py-10">
            {/* Breadcrumbs skeleton */}
            <div className="mb-6 flex gap-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-32" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
                {/* Left: Image Gallery Skeleton */}
                <div className="space-y-4">
                    <Card className="overflow-hidden border-none shadow-none bg-muted/30">
                        <Skeleton className="aspect-square w-full" />
                    </Card>

                    {/* Thumbnails */}
                    <div className="flex gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="w-20 h-20 rounded-md" />
                        ))}
                    </div>
                </div>

                {/* Right: Product Info Skeleton */}
                <div className="flex flex-col space-y-6">
                    {/* Title & Meta */}
                    <div className="border-b pb-6">
                        <Skeleton className="h-10 w-3/4 mb-3" />
                        <Skeleton className="h-4 w-1/3 mb-2" />
                        <Skeleton className="h-12 w-1/2 mt-4" />
                    </div>

                    {/* Variants */}
                    <div className="space-y-4">
                        <Skeleton className="h-4 w-24" />
                        <div className="flex gap-2">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-10 w-16" />
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-4">
                        <Skeleton className="h-14 w-full" />
                        <div className="flex gap-4">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <Skeleton className="h-10 w-10 rounded-full" />
                        </div>
                    </div>

                    {/* Trust Signals */}
                    <div className="grid grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-6 w-full" />
                        ))}
                    </div>
                </div>
            </div>

            {/* Tabs Skeleton */}
            <div className="mt-16">
                <div className="flex gap-6 border-b mb-8">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-10 w-32" />
                    ))}
                </div>
                <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </div>
            </div>
        </div>
    );
};
