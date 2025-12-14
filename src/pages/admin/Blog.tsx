import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

const Blog = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Blog Posts</h1>
                    <p className="text-muted-foreground">Manage your blog articles</p>
                </div>
                <Button className="gap-2 text-white">
                    <Plus className="h-4 w-4" /> Create Post
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Posts</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-10 text-muted-foreground">
                        No blog posts found. Start writing!
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Blog;
