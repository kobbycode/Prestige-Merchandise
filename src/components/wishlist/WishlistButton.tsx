import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/contexts/WishlistContext";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
    productId: string;
    className?: string;
    size?: "sm" | "default" | "lg" | "icon";
}

const WishlistButton = ({ productId, className, size = "icon" }: WishlistButtonProps) => {
    const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
    const isWishlisted = isInWishlist(productId);

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isWishlisted) {
            removeFromWishlist(productId);
        } else {
            addToWishlist(productId);
        }
    };

    return (
        <Button
            variant="ghost"
            size={size}
            className={cn(
                "hover:bg-white/80 transition-all",
                isWishlisted ? "text-red-500 hover:text-red-600" : "text-gray-500 hover:text-red-500",
                className
            )}
            onClick={handleClick}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
            <Heart
                className={cn("h-5 w-5 transition-all", isWishlisted && "fill-current")}
            />
        </Button>
    );
};

export default WishlistButton;
