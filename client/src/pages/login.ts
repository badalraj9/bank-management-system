import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerUser } from "@/lib/api";

export default function Login() {
  const [, navigate] = useLocation();
  const { user, login, loading } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const { toast } = useToast();
  
  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (user && !loading) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    
    try {
      await login(username, password);
      navigate("/dashboard");
    } catch (error) {
      console.error("Error during sign in:", error);
      toast({
        title: "Authentication failed",
        description: "Invalid username or password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAuthenticating(false);
    }
  };
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    
    try {
      // Create the user
      await registerUser({
        username,
        email,
        password,
        displayName: displayName || username
      });
      
      // Log them in
      await login(username, password);
      navigate("/dashboard");
      
      toast({
        title: "Registration successful",
        description: "Your account has been created and you're now logged in.",
      });
    } catch (error) {
      console.error("Error during registration:", error);
      toast({
        title: "Registration failed",
        description: "There was a problem creating your account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAuthenticating(false);
    }
  };
  
  // Show nothing while checking auth status to prevent flicker
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center">
            <Building2 className="h-10 w-10 text-primary" />
            <h1 className="text-3xl font-bold text-primary ml-2">BankEase</h1>
          </div>
          <p className="text-gray-600 mt-2">Banking management system</p>
        </div>
        
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-2xl">
              {isRegistering ? "Create an account" : "Welcome back"}
            </CardTitle>
            <CardDescription>
              {isRegistering 
                ? "Sign up to start managing your banking" 
                : "Sign in to access your banking dashboard"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Enter your username"
                />
              </div>
              
              {isRegistering && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="Enter your email"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name (optional)</Label>
                    <Input
                      id="displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your display name"
                    />
                  </div>
                </>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                />
              </div>
              
              <Button
                className="w-full"
                type="submit"
                disabled={isAuthenticating}
              >
                {isAuthenticating ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {isRegistering ? "Creating account..." : "Signing in..."}
                  </div>
                ) : (
                  isRegistering ? "Create Account" : "Sign In"
                )}
              </Button>
            </form>
            
            <div className="mt-4 text-center">
              <Button
                variant="link"
                onClick={() => setIsRegistering(!isRegistering)}
                disabled={isAuthenticating}
              >
                {isRegistering 
                  ? "Already have an account? Sign in" 
                  : "Don't have an account? Sign up"}
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col text-center text-sm text-gray-500">
            <p>
              By continuing, you agree to BankEase's Terms of Service and Privacy Policy.
            </p>
          </CardFooter>
        </Card>
        
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>
            For demonstration purposes only. Not a real banking application.
          </p>
        </div>
      </div>
    </div>
  );
}
