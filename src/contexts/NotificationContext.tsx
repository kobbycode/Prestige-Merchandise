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
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribe: () => void;

        if (user) {
            setLoading(true);
            try {
                // Query notifications for the current user, ordered by date
                // Note: This requires a composite index in Firestore: userId ASC, createdAt DESC
                const q = query(
                    collection(db, "notifications"),
                    where("userId", "==", user.uid),
                    orderBy("createdAt", "desc"),
                    limit(50)
                );

                unsubscribe = onSnapshot(q, (snapshot) => {
                    console.log("Notification listener update. Docs found:", snapshot.size);
                    const newNotifications: Notification[] = [];
                    snapshot.forEach((doc) => {
                        newNotifications.push({ id: doc.id, ...doc.data() } as Notification);
                    });
                    console.log("Notifications processed:", newNotifications);
                    setNotifications(newNotifications);
                    setLoading(false);
                }, (error) => {
                    console.error("Error fetching notifications debug:", error);
                    setLoading(false);
                    // Handle index-required error gracefully or warn
                    if (error.code === 'failed-precondition') {
                        console.warn("Firestore index missing for notifications. Please check console for link to create it.");
                    }
                });
            } catch (error) {
                console.error("Error setting up notification listener:", error);
                setLoading(false);
            }
        } else {
            setNotifications([]);
            setLoading(false);
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user]);

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
