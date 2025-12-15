import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/contexts/NotificationContext";
import NotificationBadge from "./NotificationBadge";
import NotificationItem from "./NotificationItem";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function NotificationDropdown({ className }: { className?: string }) {
    const { notifications, markAllAsRead, markAsRead } = useNotifications();
    const navigate = useNavigate();

    const handleNotificationClick = async (notification: any) => {
        if (!notification.read) {
            await markAsRead(notification.id);
        }

        // Handle navigation based on notification type/data
        if (notification.type === 'order_status' && notification.data?.orderId) {
            // If user is admin, go to admin order detail? Or customer order detail? 
            // We need to know context. Assuming customer for status updates mostly, but admin also.
            // Best to just link to generic order page if unsure, or specific route.
            // For now, let's assume it's for the recipient. 
            // If it involves admin side, we might need logic.
            // But customer side: /account/orders
            // Admin side: /admin/orders/...
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className={cn("relative rounded-full", className)}>
                    <NotificationBadge />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between px-4 py-2 border-b">
                    <span className="font-semibold text-sm">Notifications</span>
                    {notifications.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-primary"
                            onClick={() => markAllAsRead()}
                        >
                            <Check className="h-3 w-3 mr-1" />
                            Mark all read
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No notifications yet.
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onClick={handleNotificationClick}
                            />
                        ))
                    )}
                </ScrollArea>
                {notifications.length > 0 && (
                    <div className="p-2 border-t text-center">
                        <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => navigate('/account/orders')}>
                            View all orders
                        </Button>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
