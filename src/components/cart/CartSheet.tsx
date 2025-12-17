import { ShoppingBag } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import CartItem from "./CartItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "react-router-dom";
import { useCurrency } from "@/contexts/CurrencyContext";

const CartSheet = () => {
    const { items, cartTotal, isCartOpen, setIsCartOpen } = useCart();
    const { formatPrice } = useCurrency();

    return (
        <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
            <SheetContent className="flex flex-col w-full sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle>Shopping Cart ({items.length})</SheetTitle>
                    <SheetDescription>
                        Review your items before checkout.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-hidden mt-4">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-4 text-center">
                            <div className="h-16 w-16 rounded-full bg-secondary/50 flex items-center justify-center">
                                <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-semibold text-lg">Your cart is empty</h3>
                                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                                    Looks like you haven't added anything to your cart yet.
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => setIsCartOpen(false)}
                                className="mt-4"
                            >
                                Continue Shopping
                            </Button>
                        </div>
                    ) : (
                        <ScrollArea className="h-[calc(100vh-12rem)] pr-4">
                            <div className="divide-y">
                                {items.map((item) => (
                                    <CartItem key={item.id} item={item} />
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>

                {items.length > 0 && (
                    <div className="space-y-4 pt-4 border-t mt-auto">
                        <div className="flex justify-between items-center font-medium">
                            <span>Subtotal</span>
                            <span className="text-lg">
                                {formatPrice(cartTotal)}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                            Tax included and shipping calculated at checkout
                        </p>
                        <Button className="w-full" size="lg" asChild>
                            <Link to="/checkout" onClick={() => setIsCartOpen(false)}>
                                Checkout
                            </Link>
                        </Button>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
};

export default CartSheet;
