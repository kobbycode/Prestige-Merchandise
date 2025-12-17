import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const location = useLocation();

    // Helper for friendly errors
    const getFriendlyErrorMessage = (errorCode: string, defaultMessage: string) => {
        switch (errorCode) {
            case 'auth/invalid-credential':
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                return 'Invalid email or password. Please check your credentials.';
            case 'auth/too-many-requests':
                return 'Too many failed attempts. Please try again later.';
            case 'auth/user-disabled':
                return 'This account has been disabled.';
            default:
                return defaultMessage;
        }
    };

    useEffect(() => {
        if (location.state?.email) {
            setEmail(location.state.email);
        }
        if (location.state?.password) {
            setPassword(location.state.password);
            // Optional: Auto-submit if coming from registration? 
            // Ideally not, UX wise it's better they click confirm or see "Sign In" 
            // but user request implies "so they can sign in" with details filled.
        }
        if (location.state?.message) {
            // Could show a toast or message
            // For now we just let them sign in
        }
    }, [location.state]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await login(email, password);
            // If they were redirected here from checkout (via register), they likely want to resume checkout
            // But cart persists. So redirecting to /checkout is safe if cart not empty.
            navigate("/checkout");
        } catch (err: any) {
            console.error("Login error:", err);
            setError(getFriendlyErrorMessage(err.code, err.message || "Failed to log in"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow flex items-center justify-center py-12 px-4 bg-muted/30">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
                        <CardDescription className="text-center">
                            Enter your email and password to access your account
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Signing in..." : "Sign In"}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex justify-center">
                        <p className="text-sm text-muted-foreground">
                            Don't have an account?{" "}
                            <Link to="/register" className="text-primary hover:underline">
                                Sign up
                            </Link>
                        </p>
                    </CardFooter>
                </Card>
            </main>
            <Footer />
        </div>
    );
};

export default Login;
