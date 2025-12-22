import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs, limit, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BlogPost } from "@/types/product";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Tag } from "lucide-react";
import { format } from "date-fns";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const BlogPostDetail = () => {
    const { slug } = useParams();
    const [post, setPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (slug) {
            fetchPost(slug);
        }
    }, [slug]);

    const fetchPost = async (slugId: string) => {
        try {
            console.log("Fetching blog post with slug or ID:", slugId);

            // 1. Try direct ID match
            const docRef = doc(db, "blog_posts", slugId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                console.log("Post found by ID");
                const postData = { id: docSnap.id, ...docSnap.data() } as BlogPost;
                setPost(postData);

                // Increment view count
                const sessionKey = `viewed_post_${docSnap.id}`;
                if (!sessionStorage.getItem(sessionKey)) {
                    await updateDoc(docRef, {
                        views: increment(1)
                    });
                    sessionStorage.setItem(sessionKey, 'true');
                }
                return;
            }

            // 2. Try querying by slug field
            console.log("ID match failed, trying slug query...");
            const q = query(collection(db, "blog_posts"), where("slug", "==", slugId), limit(1));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                console.log("Post found by slug query");
                const docFn = querySnapshot.docs[0];
                const postData = { id: docFn.id, ...docFn.data() } as BlogPost;
                setPost(postData);

                // Increment view count for slug match too
                const sessionKey = `viewed_post_${docFn.id}`;
                if (!sessionStorage.getItem(sessionKey)) {
                    await updateDoc(docFn.ref, {
                        views: increment(1)
                    });
                    sessionStorage.setItem(sessionKey, 'true');
                }
                return;
            }

            // 3. Resilient Fallback: Fetch all and find by slug in memory
            console.log("Slug query failed, trying resilient fallback (fetch all)...");
            const allPostsSnapshot = await getDocs(collection(db, "blog_posts"));
            console.log("Total posts to check in memory:", allPostsSnapshot.size);

            let foundPost: BlogPost | null = null;
            allPostsSnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.slug === slugId || doc.id === slugId) {
                    foundPost = { id: doc.id, ...data } as BlogPost;
                }
            });

            if (foundPost) {
                console.log("Post found via resilient fallback");
                setPost(foundPost);

                // Increment view count
                const postRef = doc(db, "blog_posts", (foundPost as BlogPost).id);
                const sessionKey = `viewed_post_${(foundPost as BlogPost).id}`;
                if (!sessionStorage.getItem(sessionKey)) {
                    await updateDoc(postRef, {
                        views: increment(1)
                    });
                    sessionStorage.setItem(sessionKey, 'true');
                }
            } else {
                console.warn("Post NOT found even after resilient fallback");
            }
        } catch (error) {
            console.error("Error fetching post:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col">
                <Header />
                <div className="flex-grow flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
                <Footer />
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen flex flex-col">
                <Header />
                <div className="flex-grow flex flex-col items-center justify-center text-center px-4">
                    <h1 className="text-3xl font-bold mb-4">Article Not Found</h1>
                    <p className="text-muted-foreground mb-8">The article you're looking for doesn't exist or has been removed.</p>
                    <Link to="/blog">
                        <Button>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
                        </Button>
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow pt-8 pb-16">
                {/* Hero / Cover Image */}
                {post.coverImage && (
                    <div className="w-full h-[400px] relative mb-12">
                        <img
                            src={post.coverImage}
                            alt={post.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40"></div>
                        <div className="absolute inset-0 container mx-auto px-4 flex flex-col justify-end pb-12">
                            <Link to="/blog" className="text-white/80 hover:text-white flex items-center gap-2 mb-6 w-fit hover:underline">
                                <ArrowLeft className="h-4 w-4" /> Back to Blog
                            </Link>
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 max-w-4xl">
                                {post.title}
                            </h1>
                            <div className="flex items-center gap-6 text-white/90">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    {post.publishedAt ? format(new Date(post.publishedAt), "MMMM d, yyyy") : "Draft"}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {!post.coverImage && (
                    <div className="container mx-auto px-4 mb-12 pt-12">
                        <Link to="/blog" className="text-muted-foreground hover:text-foreground flex items-center gap-2 mb-8">
                            <ArrowLeft className="h-4 w-4" /> Back to Blog
                        </Link>
                        <h1 className="text-4xl md:text-5xl font-bold mb-6 max-w-4xl text-primary">
                            {post.title}
                        </h1>
                        <div className="flex items-center gap-6 text-muted-foreground border-b pb-8">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {post.publishedAt ? format(new Date(post.publishedAt), "MMMM d, yyyy") : "Draft"}
                            </div>
                        </div>
                    </div>
                )}

                <article className="container mx-auto px-4 max-w-3xl">
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                        {post.content.split('\n').map((paragraph, index) => (
                            paragraph.trim() && (
                                <p key={index} className="text-lg leading-relaxed text-foreground/90 mb-6 last:mb-0">
                                    {paragraph.trim()}
                                </p>
                            )
                        ))}
                    </div>


                </article>
            </main>
            <Footer />
        </div>
    );
};

export default BlogPostDetail;
