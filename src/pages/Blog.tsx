import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BlogPost } from "@/types/product";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Calendar } from "lucide-react";
import { format } from "date-fns";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BlogGridSkeleton } from "@/components/product/BlogCardSkeleton";

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      // Fetch ALL posts and filter in memory to avoid indexing issues
      const q = query(collection(db, "blog_posts"));
      const querySnapshot = await getDocs(q);

      console.log("Total posts found in Firestore:", querySnapshot.size);

      const postsList: BlogPost[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Convert whatever isPublished is (boolean or string) to a boolean check
        const isPublished = data.isPublished === true || data.isPublished === "true";

        if (isPublished) {
          postsList.push({
            id: doc.id,
            ...data,
            publishedAt: data.publishedAt || data.createdAt
          } as BlogPost);
        }
      });

      console.log("Published posts after filtering:", postsList.length);

      // Sort by publishedAt DESC
      postsList.sort((a, b) => {
        const dateA = new Date(a.publishedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.publishedAt || b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      setPosts(postsList);
    } catch (error) {
      console.error("Critical error fetching blog posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    const title = (post.title || "").toLowerCase();
    const excerpt = (post.excerpt || "").toLowerCase();
    const query = searchQuery.toLowerCase();

    return title.includes(query) || excerpt.includes(query);
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 animate-fade-in">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Our Blog</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Stay updated with the latest news, tips, and insights about auto parts and car maintenance.
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              className="pl-10 h-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <BlogGridSkeleton count={6} />
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            {searchQuery ? "No articles found matching your search." : "No published articles yet. Check back soon!"}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 stagger-animation">
            {filteredPosts.map((post) => (
              <Link to={`/blog/${post.slug || post.id}`} key={post.id} className="group">
                <Card className="h-full overflow-hidden transition-all hover:shadow-lg border-muted animate-slide-up">
                  <div className="aspect-video w-full overflow-hidden bg-muted">
                    {post.coverImage ? (
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary">
                        <span className="text-muted-foreground">No Image</span>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {post.publishedAt ? format(new Date(post.publishedAt), "MMM d, yyyy") : ""}
                      </div>
                    </div>
                    <h2 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    <p className="text-muted-foreground line-clamp-3">
                      {post.excerpt}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
