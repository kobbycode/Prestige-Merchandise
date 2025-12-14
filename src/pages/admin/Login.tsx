import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const Login = () => {
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (login(password)) {
            toast.success("Welcome back, Admin!");
            navigate("/admin");
        } else {
            toast.error("Invalid password");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
            <Card className="w-full max-w-md mx-4 shadow-xl border-t-4 border-t-primary">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto bg-white p-2 rounded-full w-fit shadow-sm">
                        <img src={logo} alt="Logo" className="h-20 w-auto" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Admin Access</CardTitle>
                    <CardDescription>Enter your credential to manage the dashboard</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="focus-visible:ring-primary"
                            />
                        </div>
                        <Button type="submit" className="w-full font-bold text-white shadow-md hover:shadow-lg transition-all">
                            Login to Dashboard
                        </Button>
                    </form>
                    <div className="mt-4 text-center text-xs text-muted-foreground">
                        <p>Hint: password is 'admin123'</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Login;
