import { LucideIcon } from "lucide-react";
import { Button } from "./button";
import { Link } from "react-router-dom";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    actionLink?: string;
    onAction?: () => void;
    className?: string;
}

export const EmptyState = ({
    icon: Icon,
    title,
    description,
    actionLabel,
    actionLink,
    onAction,
    className = "",
}: EmptyStateProps) => {
    return (
        <div className={`flex flex-col items-center justify-center text-center p-8 md:p-12 animate-in fade-in zoom-in duration-500 ${className}`}>
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl animate-pulse"></div>
                <div className="relative bg-background border rounded-3xl p-6 shadow-sm">
                    <Icon className="h-12 w-12 text-primary" strokeWidth={1.5} />
                </div>
            </div>
            <h3 className="text-2xl font-bold tracking-tight mb-2">{title}</h3>
            <p className="text-muted-foreground max-w-sm mb-8">
                {description}
            </p>
            {actionLabel && (
                <>
                    {actionLink ? (
                        <Link to={actionLink}>
                            <Button size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95">
                                {actionLabel}
                            </Button>
                        </Link>
                    ) : (
                        <Button
                            size="lg"
                            onClick={onAction}
                            className="rounded-full px-8 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95"
                        >
                            {actionLabel}
                        </Button>
                    )}
                </>
            )}
        </div>
    );
};
