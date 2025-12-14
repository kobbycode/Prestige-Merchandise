import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, setDoc, updateDoc, collection } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { BlogPost } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Upload, X } from "lucide-react";
import { toast } from "sonner";

const BlogPostForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isEdit = !!id;

    const [loading, setLoading] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);
    const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
    const [coverImagePreview, setCoverImagePreview] = useState<string>("");

    const [formData, setFormData] = useState<Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt' | 'authorId'>>({
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        coverImage: "",
        isPublished: false,
        publishedAt: null,
        tags: []
    });

    useEffect(() => {
        if (isEdit && id) {
            fetchPost(id);
        }
    }, [id, isEdit]);

    const fetchPost = async (postId: string) => {
        try {
            const docRef = doc(db, "blog_posts", postId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const post = docSnap.data() as BlogPost;
                setFormData({
                    title: post.title,
                    slug: post.slug,
                    excerpt: post.excerpt,
                    content: post.content,
                    coverImage: post.coverImage,
                    isPublished: post.isPublished,
                    publishedAt: post.publishedAt,
                    tags: post.tags,
                });
                setCoverImagePreview(post.coverImage);
            } else {
                toast.error("Post not found");
                navigate("/admin/blog");
            }
        } catch (error) {
            console.error("Error fetching post:", error);
            toast.error("Failed to load post");
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCoverImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setCoverImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, "");
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const title = e.target.value;
        setFormData(prev => ({
            ...prev,
            title,
            slug: generateSlug(title)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSubmitting(true);
        const toastId = toast.loading(isEdit ? "Updating post..." : "Creating post...");

        try {
            const postId = isEdit ? id! : doc(collection(db, "blog_posts")).id;

            let imageUrl = formData.coverImage;
            if (coverImageFile) {
                const storageRef = ref(storage, `blog/${postId}/${Date.now()}_${coverImageFile.name}`);
                await uploadBytes(storageRef, coverImageFile);
                imageUrl = await getDownloadURL(storageRef);
            }

            const postData: BlogPost = {
                id: postId,
                ...formData,
                coverImage: imageUrl,
                authorId: isEdit ? (await getDoc(doc(db, "blog_posts", postId))).data()?.authorId || user.uid : user.uid,
                createdAt: isEdit ? (await getDoc(doc(db, "blog_posts", postId))).data()?.createdAt || new Date().toISOString() : new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                publishedAt: formData.isPublished && !formData.publishedAt ? new Date().toISOString() : formData.publishedAt,
            };

            // Remove id before writing to Firestore
            const { id: _, ...dataToWrite } = postData;

            if (isEdit) {
                await updateDoc(doc(db, "blog_posts", postId), dataToWrite);
                toast.success("Post updated successfully", { id: toastId });
            } else {
                await setDoc(doc(db, "blog_posts", postId), dataToWrite);
                toast.success("Post created successfully", { id: toastId });
            }

            navigate("/admin/blog");
        } catch (error) {
            console.error("Error saving post:", error);
            toast.error("Failed to save post", { id: toastId });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => navigate("/admin/blog")}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {isEdit ? "Edit Post" : "Create Post"}
                    </h1>
                    <p className="text-muted-foreground">
                        {isEdit ? "Update your blog article" : "Write a new article"}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-3">
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Content</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="title">Post Title</Label>
                                    <Input
                                        id="title"
                                        value={formData.title}
                                        onChange={handleTitleChange}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="slug">Slug</Label>
                                    <Input
                                        id="slug"
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        URL friendly version of the title
                                    </p>
                                </div>
                                <div>
                                    <Label htmlFor="excerpt">Excerpt</Label>
                                    <Textarea
                                        id="excerpt"
                                        value={formData.excerpt}
                                        onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                                        rows={3}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Short summary displayed on the blog list
                                    </p>
                                </div>
                                <div>
                                    <Label htmlFor="content">Content</Label>
                                    <Textarea
                                        id="content"
                                        value={formData.content}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                        rows={15}
                                        required
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Publishing</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="isPublished">Published</Label>
                                    <Switch
                                        id="isPublished"
                                        checked={formData.isPublished}
                                        onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
                                    />
                                </div>
                                <div className="border-t pt-4">
                                    <Button type="submit" className="w-full" disabled={submitting}>
                                        {submitting ? "Saving..." : isEdit ? "Update Post" : "Create Post"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Cover Image</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {coverImagePreview ? (
                                    <div className="relative group">
                                        <img
                                            src={coverImagePreview}
                                            alt="Cover"
                                            className="w-full aspect-video object-cover rounded-lg"
                                        />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => {
                                                setCoverImageFile(null);
                                                setCoverImagePreview("");
                                                setFormData(prev => ({ ...prev, coverImage: "" }));
                                            }}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div>
                                        <Label htmlFor="coverImage" className="cursor-pointer">
                                            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                                                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                                <p className="text-sm text-muted-foreground">
                                                    Upload cover image
                                                </p>
                                            </div>
                                        </Label>
                                        <Input
                                            id="coverImage"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleImageChange}
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Tags</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Input
                                    placeholder="Comma-separated tags"
                                    value={formData.tags.join(", ")}
                                    onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(",").map(s => s.trim()) })}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default BlogPostForm;
