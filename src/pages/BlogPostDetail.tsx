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
                <div className="container mx-auto px-4 max-w-4xl">
                    {/* Back Link */}
                    <Link to="/blog" className="text-muted-foreground hover:text-primary flex items-center gap-2 mb-8 transition-colors w-fit">
                        <ArrowLeft className="h-4 w-4" /> Back to Blog
                    </Link>

                    {/* Header Content */}
                    <header className="mb-10 text-center">
                        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
                            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border bg-card/50 backdrop-blur-sm shadow-sm text-sm font-medium transition-colors hover:bg-accent/50">
                                <Calendar className="h-4 w-4 text-primary" />
                                <span className="text-foreground/80">
                                    {post.publishedAt ? format(new Date(post.publishedAt), "MMMM d, yyyy") : "Draft"}
                                </span>
                            </div>
                            {post.tags && post.tags.length > 0 && (
                                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border bg-card/50 backdrop-blur-sm shadow-sm text-sm font-medium transition-colors hover:bg-accent/50">
                                    <Tag className="h-4 w-4 text-primary" />
                                    <span className="text-foreground/80 capitalize">{post.tags[0]}</span>
                                </div>
                            )}
                        </div>

                        <h1 className="text-3xl md:text-5xl font-bold mb-6 text-foreground leading-tight">
                            {post.title}
                        </h1>

                        <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                            {post.excerpt}
                        </p>
                    </header>

                    {/* Featured Image - Contained & Full Visibility */}
                    {post.coverImage && (
                        <div className="rounded-2xl overflow-hidden shadow-xl border bg-muted mb-12">
                            <img
                                src={post.coverImage}
                                alt={post.title}
                                className="w-full h-auto max-h-[600px] object-cover"
                            />
                        </div>
                    )}
                </div>

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
