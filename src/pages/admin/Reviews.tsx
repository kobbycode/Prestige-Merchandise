import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Review } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Link } from "react-router-dom";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface ReviewWithProduct extends Review {
    productName?: string;
}

const AdminReviews = () => {
    const [reviews, setReviews] = useState<ReviewWithProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);

            const reviewList: ReviewWithProduct[] = [];

            // We need to fetch product names too, or we can fetch them on demand. 
            // For a list, better to fetch all needed product names.
            const productIds = new Set<string>();
            snapshot.forEach(doc => {
                const data = doc.data() as Review;
                reviewList.push({ id: doc.id, ...data });
                productIds.add(data.productId);
            });

            // Fetch product names in parallel (or optimized way)
            const productNames: Record<string, string> = {};
            await Promise.all(Array.from(productIds).map(async (pid) => {
                try {
                    const pDoc = await getDoc(doc(db, "products", pid));
                    if (pDoc.exists()) {
                        productNames[pid] = pDoc.data().name;
                    } else {
                        productNames[pid] = "Unknown Product";
                    }
                } catch {
                    productNames[pid] = "Error loading";
                }
            }));

            // attach names
            const fullList = reviewList.map(r => ({
                ...r,
                productName: productNames[r.productId]
            }));

            setReviews(fullList);
        } catch (error) {
            console.error("Error fetching reviews:", error);
            toast.error("Failed to load reviews");
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (reviewId: string, newStatus: 'approved' | 'rejected') => {
        setActionLoading(reviewId);
        try {
            const reviewRef = doc(db, "reviews", reviewId);
            await updateDoc(reviewRef, { status: newStatus });

            // Update local state
            setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, status: newStatus } : r));
            toast.success(`Review ${newStatus}`);
        } catch (error) {
            console.error("Error updating review:", error);
            toast.error("Failed to update status");
        } finally {
            setActionLoading(null);
        }
    };

    const deleteReview = async (reviewId: string) => {
        if (!confirm("Are you sure you want to delete this review?")) return;

        setActionLoading(reviewId);
        try {
            await deleteDoc(doc(db, "reviews", reviewId));
            setReviews(prev => prev.filter(r => r.id !== reviewId));
            toast.success("Review deleted");
        } catch (error) {
            console.error("Error deleting review:", error);
            toast.error("Failed to delete review");
        } finally {
            setActionLoading(null);
        }
    };

    const filteredReviews = filterStatus === "all"
        ? reviews
        : reviews.filter(r => (r.status || 'pending') === filterStatus);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reviews</h1>
                    <p className="text-muted-foreground">Manage and moderate customer reviews</p>
                </div>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Reviews</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Review List</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Rating</TableHead>
                                <TableHead className="w-[300px]">Comment</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredReviews.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        No reviews found matching your filter.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredReviews.map((review) => (
                                    <TableRow key={review.id}>
                                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                                            {format(new Date(review.createdAt), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span>{review.productName}</span>
                                                <Link to={`/product/${review.productId}`} target="_blank" className="text-xs text-primary flex items-center gap-1 hover:underline">
                                                    View Product <ExternalLink className="h-3 w-3" />
                                                </Link>
                                            </div>
                                        </TableCell>
                                        <TableCell>{review.userName}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <span className="font-bold">{review.rating}</span>
                                                <span className="text-yellow-500">★</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-[300px]">
                                            <p className="truncate text-sm" title={review.comment}>
                                                {review.comment}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    review.status === 'approved' ? 'default' :
                                                        review.status === 'rejected' ? 'destructive' :
                                                            'secondary'
                                                }
                                                className={review.status === 'approved' ? 'bg-green-600 hover:bg-green-700' : ''}
                                            >
                                                {(review.status || 'pending').toUpperCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {review.status !== 'approved' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                        onClick={() => updateStatus(review.id, 'approved')}
                                                        disabled={actionLoading === review.id}
                                                    >
                                                        {actionLoading === review.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                                    </Button>
                                                )}
                                                {review.status !== 'rejected' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                                        onClick={() => updateStatus(review.id, 'rejected')}
                                                        disabled={actionLoading === review.id}
                                                    >
                                                        {actionLoading === review.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => deleteReview(review.id)}
                                                    disabled={actionLoading === review.id}
                                                >
                                                    {actionLoading === review.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminReviews;
