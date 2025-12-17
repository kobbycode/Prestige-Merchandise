import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Star, User, Loader2, Upload, X, Image as ImageIcon } from "lucide-react";
import { collection, addDoc, query, where, orderBy, getDocs, Timestamp } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Review } from "@/types/product";
import { format } from "date-fns";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface ReviewsProps {
    productId: string;
}

const Reviews = ({ productId }: ReviewsProps) => {
    const { user, isAuthenticated } = useAuth();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [hoverRating, setHoverRating] = useState(0);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);

    useEffect(() => {
        fetchReviews();
    }, [productId]);

    const fetchReviews = async () => {
        try {
            const reviewsRef = collection(db, "reviews");
            const q = query(
                reviewsRef,
                where("productId", "==", productId),
                where("status", "==", "approved"),
                orderBy("createdAt", "desc")
            );

            const querySnapshot = await getDocs(q);
            const reviewList: Review[] = [];
            querySnapshot.forEach((doc) => {
                reviewList.push({ id: doc.id, ...doc.data() } as Review);
            });
            setReviews(reviewList);
        } catch (error) {
            console.error("Error fetching reviews:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length + imageFiles.length > 5) {
            toast.error("You can only upload up to 5 images");
            return;
        }

        setImageFiles(prev => [...prev, ...files]);

        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreviews(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index: number) => {
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
        setImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();

        if (rating === 0) {
            toast.error("Please select a rating");
            return;
        }

        if (comment.trim().length < 5) {
            toast.error("Please write a longer review (at least 5 characters)");
            return;
        }

        setSubmitLoading(true);

        try {
            // Upload images first
            const imageUrls: string[] = [];
            if (imageFiles.length > 0) {
                const uploadPromises = imageFiles.map(async (file) => {
                    const storageRef = ref(storage, `reviews/${productId}/${Date.now()}_${file.name}`);
                    await uploadBytes(storageRef, file);
                    return getDownloadURL(storageRef);
                });
                const urls = await Promise.all(uploadPromises);
                imageUrls.push(...urls);
            }

            const newReview = {
                productId,
                userId: user?.uid || "anonymous",
                userName: user?.displayName || user?.email?.split('@')[0] || "Customer",
                rating,
                comment,
                images: imageUrls.length > 0 ? imageUrls : undefined,
                createdAt: new Date().toISOString(),
                isVerifiedPurchase: false,
                status: 'pending'
            };

            await addDoc(collection(db, "reviews"), newReview);

            toast.success("Review submitted! It will appear after approval.");
            setRating(0);
            setComment("");
            setImageFiles([]);
            setImagePreviews([]);
            fetchReviews();
        } catch (error) {
            console.error("Error submitting review:", error);
            toast.error("Failed to submit review: " + (error instanceof Error ? error.message : "Unknown error"));
        } finally {
            setSubmitLoading(false);
        }
    };

    const averageRating = reviews.length > 0
        ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length
        : 0;

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Summary Section */}
                <Card className="w-full md:w-1/3 shadow-sm border-muted">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">Customer Reviews</CardTitle>
                        <CardDescription>
                            {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="text-5xl font-bold text-primary">{averageRating.toFixed(1)}</span>
                            <span className="text-muted-foreground">/ 5</span>
                        </div>
                        <div className="flex justify-center mb-4">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={`h-6 w-6 ${star <= Math.round(averageRating) ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                                />
                            ))}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            100% genuine reviews from our customers
                        </p>
                    </CardContent>
                </Card>

                {/* Review Form Section */}
                <div className="w-full md:w-2/3">
                    {isAuthenticated ? (
                        <Card className="shadow-sm border-muted">
                            <CardHeader>
                                <CardTitle>Write a Review</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmitReview} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Rating</label>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    className="focus:outline-none transition-transform hover:scale-110"
                                                    onMouseEnter={() => setHoverRating(star)}
                                                    onMouseLeave={() => setHoverRating(0)}
                                                    onClick={() => setRating(star)}
                                                >
                                                    <Star
                                                        className={`h-8 w-8 transition-colors ${star <= (hoverRating || rating)
                                                            ? "text-yellow-400 fill-current"
                                                            : "text-gray-300"
                                                            }`}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">Review</label>
                                        <Textarea
                                            placeholder="What did you like or dislike?"
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            rows={4}
                                            required
                                        />
                                    </div>

                                    {/* Image Upload */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Photos (Optional)</label>

                                        {imagePreviews.length > 0 && (
                                            <div className="grid grid-cols-5 gap-2 mb-3">
                                                {imagePreviews.map((preview, index) => (
                                                    <div key={index} className="relative group">
                                                        <img
                                                            src={preview}
                                                            alt={`Preview ${index + 1}`}
                                                            className="w-full aspect-square object-cover rounded-md"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeImage(index)}
                                                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {imagePreviews.length < 5 && (
                                            <label className="cursor-pointer">
                                                <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary transition-colors">
                                                    <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                                                    <p className="text-xs text-muted-foreground">
                                                        Add photos ({imagePreviews.length}/5)
                                                    </p>
                                                </div>
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    className="hidden"
                                                    onChange={handleImageChange}
                                                />
                                            </label>
                                        )}
                                    </div>

                                    <Button type="submit" disabled={submitLoading}>
                                        {submitLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            "Submit Review"
                                        )}
                                    </Button>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Posting as: {user?.displayName || "User"} <span className="opacity-50">({user?.uid})</span>
                                    </p>
                                </form>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="bg-muted/50 border-muted">
                            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                                <h3 className="text-lg font-semibold mb-2">Share your thoughts</h3>
                                <p className="text-muted-foreground mb-4">
                                    Please sign in to write a review.
                                </p>
                                <Link to="/login">
                                    <Button variant="default">Sign In to Review</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Reviews List */}
            <div className="mt-8 space-y-4">
                <h3 className="text-xl font-bold border-b pb-2">Recent Reviews</h3>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : reviews.length === 0 ? (
                    <p className="text-muted-foreground py-4">No reviews yet. Be the first to review!</p>
                ) : (
                    reviews.map((review) => (
                        <Card key={review.id} className="shadow-none border-b rounded-none last:border-0 hover:bg-muted/10 transition-colors">
                            <CardContent className="p-4 md:p-6">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-primary font-bold">
                                            {review.userName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-sm">{review.userName}</h4>
                                            <div className="flex items-center gap-2">
                                                <div className="flex">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star
                                                            key={star}
                                                            className={`h-3 w-3 ${star <= review.rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                    {format(new Date(review.createdAt), "MMM d, yyyy")}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-foreground/90 mt-2 text-sm md:text-base">
                                    {review.comment}
                                </p>

                                {/* Review Images */}
                                {review.images && review.images.length > 0 && (
                                    <div className="grid grid-cols-4 gap-2 mt-3">
                                        {review.images.map((image, idx) => (
                                            <img
                                                key={idx}
                                                src={image}
                                                alt={`Review image ${idx + 1}`}
                                                className="w-full aspect-square object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => window.open(image, '_blank')}
                                            />
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div >
    );
};

export default Reviews;
