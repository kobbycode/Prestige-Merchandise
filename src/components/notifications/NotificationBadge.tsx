import { Bell } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationContext";
import { cn } from "@/lib/utils";

interface NotificationBadgeProps {
    className?: string;
    iconClassName?: string;
    showBadge?: boolean;
}

const NotificationBadge = ({ className, iconClassName, showBadge = true }: NotificationBadgeProps) => {
    const { unreadCount } = useNotifications();

    return (
        <div className={cn("relative", className)}>
            <Bell className={cn("h-5 w-5 text-secondary-foreground hover:text-primary transition-colors cursor-pointer", iconClassName)} />
            {showBadge && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                </span>
            )}
        </div>
    );
};

export default NotificationBadge;
