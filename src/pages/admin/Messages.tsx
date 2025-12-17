import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ContactMessage } from "@/types/message";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Mail, Trash2, CheckCircle, Clock } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Messages = () => {
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);

            const fetchedMessages: ContactMessage[] = [];
            querySnapshot.forEach((doc) => {
                fetchedMessages.push({ id: doc.id, ...doc.data() } as ContactMessage);
            });

            setMessages(fetchedMessages);
        } catch (error) {
            console.error("Error fetching messages:", error);
            toast.error("Failed to load messages");
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id: string, currentStatus: boolean) => {
        try {
            // Optimistic update
            setMessages(messages.map(msg =>
                msg.id === id ? { ...msg, read: true } : msg
            ));

            if (!currentStatus) {
                await updateDoc(doc(db, "messages", id), {
                    read: true
                });
                toast.success("Message marked as read");
            }
        } catch (error) {
            // Revert on error
            fetchMessages();
            console.error("Error updating message:", error);
            toast.error("Failed to update message status");
        }
    };

    const handleDelete = async (id: string) => {
        try {
            // Optimistic update
            setMessages(messages.filter(msg => msg.id !== id));

            await deleteDoc(doc(db, "messages", id));
            toast.success("Message deleted");
        } catch (error) {
            // Revert on error
            fetchMessages();
            console.error("Error deleting message:", error);
            toast.error("Failed to delete message");
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short'
        }).format(date);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
                <p className="text-muted-foreground">View and manage customer inquiries.</p>
            </div>

            {messages.length === 0 ? (
                <Card className="text-center py-12">
                    <div className="flex justify-center mb-4">
                        <Mail className="h-12 w-12 text-muted-foreground/50" />
                    </div>
                    <CardTitle className="text-xl mb-2">No messages yet</CardTitle>
                    <CardDescription>
                        Messages sent from your contact form will appear here.
                    </CardDescription>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {messages.map((message) => (
                        <Card key={message.id} className={`transition-colors ${!message.read ? 'border-primary/50 bg-primary/5' : ''}`}>
                            <CardHeader className="pb-3">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            {!message.read && <Badge variant="default" className="bg-primary hover:bg-primary/90">New</Badge>}
                                            <CardTitle className="text-lg">{message.name}</CardTitle>
                                        </div>
                                        <CardDescription className="flex items-center gap-4 text-sm">
                                            <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {message.email}</span>
                                            {message.phone && <span className="flex items-center gap-1"><span className="text-xs">📞</span> {message.phone}</span>}
                                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDate(message.createdAt)}</span>
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!message.read && (
                                            <Button variant="outline" size="sm" onClick={() => handleMarkAsRead(message.id, message.read)} className="gap-2">
                                                <CheckCircle className="h-4 w-4" />
                                                Mark Read
                                            </Button>
                                        )}

                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete Message?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete the message from {message.name}.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(message.id)} className="bg-destructive hover:bg-destructive/90">
                                                        Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-background/50 p-4 rounded-md text-sm whitespace-pre-wrap border border-border/50">
                                    {message.message}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Messages;
