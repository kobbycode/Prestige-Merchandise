import { format } from "date-fns";
import { CheckCircle2, Package, Info, AlertTriangle } from "lucide-react";
import { Notification } from "@/types/notification";
import { cn } from "@/lib/utils";

interface NotificationItemProps {
    notification: Notification;
    onClick: (notification: Notification) => void;
}

const NotificationItem = ({ notification, onClick }: NotificationItemProps) => {
    const getIcon = () => {
        switch (notification.type) {
            case "order_status":
                return <Package className="h-4 w-4 text-blue-500" />;
            case "new_order":
                return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case "low_stock":
                return <AlertTriangle className="h-4 w-4 text-orange-500" />;
            case "info":
            default:
                return <Info className="h-4 w-4 text-gray-500" />;
        }
    };

    return (
        <div
            onClick={() => onClick(notification)}
            className={cn(
                "flex items-start gap-3 p-3 text-sm transition-colors hover:bg-muted/50 cursor-pointer border-b last:border-0",
                !notification.read && "bg-blue-50/50"
            )}
        >
            <div className="mt-1 flex-shrink-0">
                {getIcon()}
            </div>
            <div className="flex-1 space-y-1">
                <p className="font-medium leading-none">{notification.title}</p>
                <p className="text-muted-foreground text-xs line-clamp-2">{notification.message}</p>
                <p className="text-[10px] text-muted-foreground/80">
                    {notification.createdAt ? format(notification.createdAt.toDate(), "MMM d, h:mm a") : 'Just now'}
                </p>
            </div>
            {!notification.read && (
                <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
            )}
        </div>
    );
};

export default NotificationItem;
