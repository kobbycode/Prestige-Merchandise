import React, { createContext, useContext, useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, writeBatch, Timestamp, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Notification } from "@/types/notification";
import { toast } from "sonner";

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    markAsRead: (notificationId: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (notificationId: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const { user, role } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [userNotifications, setUserNotifications] = useState<Notification[]>([]);
    const [roleNotifications, setRoleNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    // Merge notifications whenever sources change
    useEffect(() => {
        const merged = [...userNotifications, ...roleNotifications].sort((a, b) =>
            b.createdAt.toMillis() - a.createdAt.toMillis()
        );
        // Deduplicate by ID just in case
        const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
        setNotifications(unique);
    }, [userNotifications, roleNotifications]);

    useEffect(() => {
        let unsubscribeUser: () => void;
        let unsubscribeRole: () => void;

        if (user) {
            setLoading(true);
            try {
                // 1. User-specific notifications
                const qUser = query(
                    collection(db, "notifications"),
                    where("userId", "==", user.uid),
                    orderBy("createdAt", "desc"),
                    limit(50)
                );

                unsubscribeUser = onSnapshot(qUser, (snapshot) => {
                    const newNotifications: Notification[] = [];
                    snapshot.forEach((doc) => {
                        newNotifications.push({ id: doc.id, ...doc.data() } as Notification);
                    });
                    setUserNotifications(newNotifications);
                    setLoading(false);
                }, (error) => {
                    console.error("Error fetching user notifications:", error);
                    setLoading(false);
                });

                // 2. Role-based notifications (if admin)
                if (role === 'admin' || role === 'super_admin') {
                    const qRole = query(
                        collection(db, "notifications"),
                        where("recipientRole", "==", "admin"),
                        orderBy("createdAt", "desc"),
                        limit(50)
                    );

                    unsubscribeRole = onSnapshot(qRole, (snapshot) => {
                        const newNotifications: Notification[] = [];
                        snapshot.forEach((doc) => {
                            newNotifications.push({ id: doc.id, ...doc.data() } as Notification);
                        });
                        setRoleNotifications(newNotifications);
                    }, (error) => {
                        console.error("Error fetching role notifications:", error);
                    });
                } else {
                    setRoleNotifications([]);
                }

            } catch (error) {
                console.error("Error setting up notification listener:", error);
                setLoading(false);
            }
        } else {
            setNotifications([]);
            setUserNotifications([]);
            setRoleNotifications([]);
            setLoading(false);
        }

        return () => {
            if (unsubscribeUser) unsubscribeUser();
            if (unsubscribeRole) unsubscribeRole();
        };
    }, [user, role]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = async (notificationId: string) => {
        try {
            const notificationRef = doc(db, "notifications", notificationId);
            await updateDoc(notificationRef, { read: true });
        } catch (error) {
            console.error("Error marking notification as read:", error);
            // Optimistic update handled by local state via snapshot? No, snapshot is fast enough.
        }
    };

    const markAllAsRead = async () => {
        const unreadNotifications = notifications.filter(n => !n.read);
        if (unreadNotifications.length === 0) return;

        try {
            const batch = writeBatch(db);
            unreadNotifications.forEach(n => {
                const ref = doc(db, "notifications", n.id);
                batch.update(ref, { read: true });
            });
            await batch.commit();
            toast.success("All notifications marked as read");
        } catch (error) {
            console.error("Error marking all as read:", error);
            toast.error("Failed to mark all as read");
        }
    };

    const deleteNotification = async (notificationId: string) => {
        // Placeholder for future use
    };

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                loading,
                markAsRead,
                markAllAsRead,
                deleteNotification
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error("useNotifications must be used within a NotificationProvider");
    }
    return context;
};
