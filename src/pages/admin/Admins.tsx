import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription,
    DialogClose,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, ShieldAlert } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

interface AdminUser {
    id: string;
    email: string;
    role: string;
    createdAt: string;
}

const Admins = () => {
    const { role, createAdmin, deleteAdmin, user: currentUser, loading: authLoading } = useAuth();
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [newEmail, setNewEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newRole, setNewRole] = useState<"admin" | "super_admin">("admin");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // ... (keep useEffect and fetchAdmins)

    const handleDeleteClick = (id: string) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;

        const id = deleteId;
        setDeleteId(null); // Close modal immediately

        // Optimistic update: Remove from UI immediately
        const previousAdmins = [...admins];
        setAdmins(prev => prev.filter(a => a.id !== id));

        const toastId = toast.loading("Revoking access...");
        try {
            await deleteAdmin(id);
            toast.success("Admin access revoked successfully", { id: toastId });
        } catch (error) {
            console.error("Error deleting admin:", error);
            toast.error("Failed to delete admin", { id: toastId });
            // Revert on error
            setAdmins(previousAdmins);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            console.log("Fetching admins...");
            const querySnapshot = await getDocs(collection(db, "admins"));
            console.log("Admins snapshot size:", querySnapshot.size);

            const adminsList: AdminUser[] = [];
            querySnapshot.forEach((doc) => {
                console.log("Found admin doc:", doc.id, doc.data());
                adminsList.push({ id: doc.id, ...doc.data() } as AdminUser);
            });
            setAdmins(adminsList);
        } catch (error) {
            console.error("Error fetching admins:", error);
            toast.error("Failed to fetch admins");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const toastId = toast.loading("Creating admin account...");

        try {
            const newAdmin = await createAdmin(newEmail, newPassword, newRole);
            // Optimistic update: Add to list immediately
            if (newAdmin) {
                setAdmins(prev => [...prev, { id: newAdmin.uid, ...newAdmin } as AdminUser]);
            }
            toast.success("Admin created successfully! They can now login.", { id: toastId });
            setIsDialogOpen(false);
            setNewEmail("");
            setNewPassword("");
            setNewRole("admin");
            // fetchAdmins(); // Skip network fetch
        } catch (error: any) {
            console.error("Error creating admin:", error);
            toast.error("Failed to create admin: " + error.message, { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };




    if (loading || authLoading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }


    if (role !== "super_admin") {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center p-4">
                <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
                <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
                <p className="text-muted-foreground">Only Super Admins can manage other administrators.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Manage Admins</h1>
                    <p className="text-muted-foreground">Create and remove system administrators</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 text-primary-foreground">
                            <Plus className="h-4 w-4" /> Add Admin
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Administrator</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateAdmin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@example.com"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select value={newRole} onValueChange={(value: any) => setNewRole(value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">Admin (Standard)</SelectItem>
                                        <SelectItem value="super_admin">Super Admin (Full Access)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" className="w-full text-primary-foreground" disabled={isSubmitting}>
                                {isSubmitting ? "Creating..." : "Create Admin"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Administrators</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {admins.map((admin) => (
                                <TableRow key={admin.id}>
                                    <TableCell>{admin.email}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${admin.role === 'super_admin' ? 'bg-primary/20 text-primary-foreground' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                                        </span>
                                    </TableCell>
                                    <TableCell>{new Date(admin.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        {admin.role !== 'super_admin' && admin.id !== currentUser?.uid && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDeleteClick(admin.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Revoke Admin Access</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to remove this admin? They will lose access immediately.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Revoke Access</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Admins;
