"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Home, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { userDetails, signIn, isLoading: authLoading } = useAuth();

  // Debug logging
  useEffect(() => {
    console.log("LoginPage mounted");
    console.log("userDetails:", userDetails);
    console.log("signIn function:", typeof signIn);
    console.log("authLoading:", authLoading);
  }, [userDetails, signIn, authLoading]);

  // Check if already authenticated
  useEffect(() => {
    if (userDetails && !authLoading) {
      console.log("User already authenticated, redirecting...");
      router.push("/");
    }
  }, [userDetails, router, authLoading]);

  // Quick login functions for testing
  const quickLogin = (role: "admin" | "manager" | "staff") => {
    const credentials = {
      admin: { email: "admin@restaurant-spa.com", password: "Admin@123" },
      manager: { email: "manager@restaurant-spa.com", password: "Manager@123" },
      staff: { email: "staff@restaurant-spa.com", password: "Staff@123" },
    };

    setEmail(credentials[role].email);
    setPassword(credentials[role].password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("=== FORM SUBMISSION STARTED ===");
    console.log("Form submitted with:", { email, password });

    if (isLoading) {
      console.log("Already loading, ignoring submission");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("Calling signIn function...");
      const result = await signIn(email, password);
      console.log("SignIn result:", result);

      if (result && result.error) {
        console.log("SignIn error:", result.error);
        setError("Invalid credentials");
        toast({
          title: "Login failed",
          description: "Please check your credentials and try again.",
          variant: "destructive",
        });
      } else {
        console.log("SignIn successful");
        toast({
          title: "Login successful",
          description: "You have successfully logged in.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An unexpected error occurred");
      toast({
        title: "Login failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      console.log("=== FORM SUBMISSION ENDED ===");
    }
  };

  const handleDirectSubmit = () => {
    console.log("=== DIRECT SUBMIT BUTTON CLICKED ===");
    const form = document.querySelector("form");
    if (form) {
      form.requestSubmit();
    }
  };

  // Show loading if auth is still initializing
  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">
          Initializing...
        </span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="mb-8 flex items-center gap-2">
        <Home className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Spa & Bistro</h1>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the management system
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@restaurant-spa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
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
                disabled={isLoading}
              />
            </div>
            {error && (
              <div className="rounded border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
