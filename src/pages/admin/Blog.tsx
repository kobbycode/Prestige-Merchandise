import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { collection, getDocs, deleteDoc, doc, query, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BlogPost } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Pencil, Trash2, Eye, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const Blog = () => {
    const navigate = useNavigate();
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const q = query(collection(db, "blog_posts"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const postsList: BlogPost[] = [];
            querySnapshot.forEach((doc) => {
                postsList.push({ id: doc.id, ...doc.data() } as BlogPost);
            });
            setPosts(postsList);
        } catch (error) {
            console.error("Error fetching posts:", error);
            toast.error("Failed to load blog posts");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;

        try {
            await deleteDoc(doc(db, "blog_posts", deleteId));
            setPosts(posts.filter(post => post.id !== deleteId));
            toast.success("Post deleted successfully");
        } catch (error) {
            console.error("Error deleting post:", error);
            toast.error("Failed to delete post");
        } finally {
            setDeleteId(null);
        }
    };

    const filteredPosts = posts.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Blog Posts</h1>
                    <p className="text-muted-foreground">Manage your blog articles</p>
                </div>
                <Link to="/admin/blog/new">
                    <Button className="gap-2 text-white">
                        <Plus className="h-4 w-4" /> Create Post
                    </Button>
                </Link>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search posts..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableHeader>
                    <TableBody>
                        {filteredPosts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    No posts found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredPosts.map((post) => (
                                <TableRow key={post.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            {post.coverImage ? (
                                                <img
                                                    src={post.coverImage}
                                                    alt={post.title}
                                                    className="h-10 w-10 rounded object-cover"
                                                />
                                            ) : (
                                                <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                            )}
                                            <span className="truncate max-w-[300px]" title={post.title}>{post.title}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border ${post.isPublished
                                                ? "border-transparent bg-green-500 text-white hover:bg-green-600"
                                                : "border-transparent bg-gray-500 text-white hover:bg-gray-600"
                                            }`}>
                                            {post.isPublished ? "Published" : "Draft"}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(post.createdAt), "MMM d, yyyy")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {/* <Button variant="ghost" size="icon" title="View">
                                                <Eye className="h-4 w-4" />
                                            </Button> */}
                                            <Link to={`/admin/blog/${post.id}/edit`}>
                                                <Button variant="ghost" size="icon" title="Edit">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => setDeleteId(post.id)}
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the blog post.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default Blog;
