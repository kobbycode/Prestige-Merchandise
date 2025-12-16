import { Order, StatusHistoryItem } from "@/types/order";
import { format } from "date-fns";
import { Check, Clock, Package, Truck, CheckCircle, XCircle } from "lucide-react";

interface OrderTimelineProps {
    order: Order;
}

const statusConfig = {
    pending: {
        label: "Order Placed",
        icon: Clock,
        color: "text-yellow-600",
        bgColor: "bg-yellow-100",
    },
    processing: {
        label: "Processing",
        icon: Package,
        color: "text-blue-600",
        bgColor: "bg-blue-100",
    },
    shipped: {
        label: "Shipped",
        icon: Truck,
        color: "text-purple-600",
        bgColor: "bg-purple-100",
    },
    delivered: {
        label: "Delivered",
        icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-100",
    },
    cancelled: {
        label: "Cancelled",
        icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-100",
    },
};

const statusOrder = ["pending", "processing", "shipped", "delivered"] as const;

const OrderTimeline = ({ order }: OrderTimelineProps) => {
    // Build timeline from statusHistory or create a minimal one from current status
    const getTimelineSteps = () => {
        if (order.statusHistory && order.statusHistory.length > 0) {
            return order.statusHistory;
        }

        // Fallback: create a single entry from current status
        return [{
            status: order.status,
            timestamp: order.createdAt,
        }] as StatusHistoryItem[];
    };

    const historySteps = getTimelineSteps();
    const completedStatuses = historySteps.map(h => h.status);
    const currentStatusIndex = statusOrder.indexOf(order.status as typeof statusOrder[number]);
    const isCancelled = order.status === "cancelled";

    const getTimestamp = (status: string): string | null => {
        const step = historySteps.find(h => h.status === status);
        if (step?.timestamp?.seconds) {
            return format(new Date(step.timestamp.seconds * 1000), "MMM d, yyyy 'at' h:mm a");
        }
        if (step?.timestamp instanceof Date) {
            return format(step.timestamp, "MMM d, yyyy 'at' h:mm a");
        }
        return null;
    };

    return (
        <div className="py-4">
            <h3 className="font-semibold mb-4 text-lg">Order Status</h3>

            <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[18px] top-8 bottom-8 w-0.5 bg-muted-foreground/20" />

                <div className="space-y-6">
                    {statusOrder.map((status, index) => {
                        const config = statusConfig[status];
                        const Icon = config.icon;
                        const isCompleted = completedStatuses.includes(status) || index <= currentStatusIndex;
                        const isCurrent = order.status === status;
                        const timestamp = getTimestamp(status);

                        // Skip if cancelled and this is after current step
                        if (isCancelled && index > 0) return null;

                        return (
                            <div key={status} className="flex items-start gap-4 relative">
                                {/* Icon Circle */}
                                <div
                                    className={`relative z-10 flex items-center justify-center w-9 h-9 rounded-full border-2 ${isCompleted
                                            ? `${config.bgColor} border-transparent`
                                            : "bg-background border-muted-foreground/30"
                                        }`}
                                >
                                    {isCompleted ? (
                                        <Icon className={`h-5 w-5 ${config.color}`} />
                                    ) : (
                                        <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 pt-1">
                                    <p
                                        className={`font-medium ${isCompleted ? "text-foreground" : "text-muted-foreground"
                                            } ${isCurrent ? "font-semibold" : ""}`}
                                    >
                                        {config.label}
                                        {isCurrent && (
                                            <span className="ml-2 text-xs font-normal bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                                Current
                                            </span>
                                        )}
                                    </p>
                                    {timestamp && (
                                        <p className="text-sm text-muted-foreground mt-0.5">
                                            {timestamp}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Cancelled status - show separately if cancelled */}
                    {isCancelled && (
                        <div className="flex items-start gap-4 relative">
                            <div className="relative z-10 flex items-center justify-center w-9 h-9 rounded-full bg-red-100 border-2 border-transparent">
                                <XCircle className="h-5 w-5 text-red-600" />
                            </div>
                            <div className="flex-1 pt-1">
                                <p className="font-semibold text-red-600">
                                    Cancelled
                                    <span className="ml-2 text-xs font-normal bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                                        Current
                                    </span>
                                </p>
                                {getTimestamp("cancelled") && (
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                        {getTimestamp("cancelled")}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderTimeline;
