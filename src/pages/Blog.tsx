import { Card, CardContent } from "@/components/ui/card";
import { Calendar, User } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Blog = () => {
  const articles = [
    {
      id: 1,
      title: "How to Know If Your Steering Rack Is Faulty",
      excerpt: "Learn the warning signs of a failing steering rack and when to replace it. A faulty steering rack can compromise your vehicle's safety and handling.",
      date: "2025-01-15",
      author: "Kwame Mensah",
      readTime: "5 min read"
    },
    {
      id: 2,
      title: "Top 5 Lubricants for Ghanaian Roads",
      excerpt: "Discover which engine oils and lubricants perform best in Ghana's tropical climate and challenging road conditions.",
      date: "2025-01-10",
      author: "Ama Serwaa",
      readTime: "7 min read"
    },
    {
      id: 3,
      title: "Why Buying Genuine Parts Saves You Money",
      excerpt: "While counterfeit parts may seem cheaper upfront, genuine parts offer better value in the long run. Here's why.",
      date: "2025-01-05",
      author: "Yaw Boateng",
      readTime: "6 min read"
    },
    {
      id: 4,
      title: "Understanding Power Steering Systems",
      excerpt: "A comprehensive guide to how power steering works and the most common issues that affect these systems.",
      date: "2024-12-28",
      author: "Kwame Mensah",
      readTime: "8 min read"
    },
    {
      id: 5,
      title: "When to Replace Your Suspension Parts",
      excerpt: "Worn suspension components affect ride quality and safety. Learn when it's time to replace shock absorbers and other parts.",
      date: "2024-12-20",
      author: "Ama Serwaa",
      readTime: "5 min read"
    },
    {
      id: 6,
      title: "Essential Car Maintenance Tips for Ghana",
      excerpt: "Keep your vehicle running smoothly with these maintenance tips tailored for Ghanaian driving conditions.",
      date: "2024-12-15",
      author: "Yaw Boateng",
      readTime: "10 min read"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        {/* Page Header */}
        <section className="bg-secondary text-secondary-foreground py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Auto Parts Blog & Tips</h1>
            <p className="text-xl opacity-90">Expert advice on car maintenance and genuine auto parts</p>
          </div>
        </section>

        {/* Featured Article */}
        <section className="py-12 bg-muted">
          <div className="container mx-auto px-4">
            <Card className="max-w-5xl mx-auto shadow-hover overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="bg-primary/10 flex items-center justify-center p-12">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🔧</div>
                    <h3 className="text-2xl font-bold">Featured Article</h3>
                  </div>
                </div>
                <CardContent className="p-8 flex flex-col justify-center">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      January 15, 2025
                    </span>
                    <span>•</span>
                    <span>5 min read</span>
                  </div>
                  <h2 className="text-3xl font-bold mb-4">How to Know If Your Steering Rack Is Faulty</h2>
                  <p className="text-muted-foreground mb-6">
                    Learn the warning signs of a failing steering rack and when to replace it. A faulty steering rack can compromise your vehicle's safety and handling. This comprehensive guide covers everything you need to know.
                  </p>
                  <Link to="/blog/1">
                    <button className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                      Read Full Article
                    </button>
                  </Link>
                </CardContent>
              </div>
            </Card>
          </div>
        </section>

        {/* Articles Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">Latest Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <Card key={article.id} className="shadow-card hover:shadow-hover transition-shadow h-full flex flex-col">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(article.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </span>
                      <span>•</span>
                      <span>{article.readTime}</span>
                    </div>
                    
                    <h3 className="text-xl font-bold mb-3 line-clamp-2">{article.title}</h3>
                    <p className="text-muted-foreground mb-4 flex-1 line-clamp-3">{article.excerpt}</p>
                    
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{article.author}</span>
                      </div>
                      <Link to={`/blog/${article.id}`}>
                        <button className="text-primary hover:underline font-semibold">
                          Read More →
                        </button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* SEO Section */}
        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Why Read Our Blog?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Our articles help you make informed decisions about car maintenance and auto parts. 
                Learn from experts with years of experience in the Ghanaian automotive industry.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl mb-2">📚</div>
                    <h3 className="font-bold mb-2">Expert Knowledge</h3>
                    <p className="text-sm text-muted-foreground">Tips from experienced professionals</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl mb-2">💡</div>
                    <h3 className="font-bold mb-2">Save Money</h3>
                    <p className="text-sm text-muted-foreground">Learn to avoid costly mistakes</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl mb-2">🚗</div>
                    <h3 className="font-bold mb-2">Better Performance</h3>
                    <p className="text-sm text-muted-foreground">Keep your vehicle running smoothly</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-hero-gradient text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Need Quality Auto Parts?</h2>
            <p className="text-xl mb-8 opacity-90">Visit our shop for genuine parts backed by expert knowledge</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/shop">
                <button className="px-8 py-3 bg-secondary text-secondary-foreground font-semibold rounded-md hover:bg-secondary/90 transition-colors">
                  Browse Shop
                </button>
              </Link>
              <Link to="/contact">
                <button className="px-8 py-3 border-2 border-primary-foreground font-semibold rounded-md hover:bg-primary-foreground hover:text-primary transition-colors">
                  Contact Us
                </button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
