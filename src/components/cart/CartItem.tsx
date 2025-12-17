import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartItem as CartItemType, useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";

interface CartItemProps {
    item: CartItemType;
}

const CartItem = ({ item }: CartItemProps) => {
    const { updateQuantity, removeFromCart } = useCart();
    const { formatPrice } = useCurrency();

    return (
        <div className="flex gap-4 py-4">
            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border bg-secondary/20">
                <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="h-full w-full object-cover"
                />
            </div>

            <div className="flex flex-1 flex-col justify-between">
                <div>
                    <h3 className="font-medium text-sm line-clamp-1">
                        {item.product.name}
                    </h3>
                    {item.variant && (
                        <p className="text-xs text-muted-foreground mt-1">
                            Variant: {item.variant}
                        </p>
                    )}
                    <p className="text-sm font-medium mt-1">
                        {formatPrice(item.product.price)}
                    </p>
                </div>

                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 border rounded-md p-1">
                        <button
                            className="p-1 hover:bg-secondary rounded-sm disabled:opacity-50"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                        >
                            <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs w-4 text-center">{item.quantity}</span>
                        <button
                            className="p-1 hover:bg-secondary rounded-sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                            <Plus className="h-3 w-3" />
                        </button>
                    </div>

                    <button
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                        onClick={() => removeFromCart(item.id)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CartItem;
