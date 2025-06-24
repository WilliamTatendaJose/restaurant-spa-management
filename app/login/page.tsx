"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth-context";
import {
  Loader2,
  Eye,
  EyeOff,
  Utensils,
  Sparkles,
  Mail,
  Lock,
  ArrowRight,
  Shield,
  Zap,
  Users,
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const { signIn, signUp, user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = isSignUp
        ? await signUp(email, password)
        : await signIn(email, password);

      if (result.error) {
        setError(result.error.message);
        toast({
          title: isSignUp ? "Sign up failed" : "Sign in failed",
          description: result.error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: isSignUp ? "Account created" : "Welcome back!",
          description: isSignUp
            ? "Please check your email to verify your account."
            : "You have been successfully signed in.",
        });
        // The redirect will now be handled by the useEffect hook
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-3/4 left-3/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      {/* Left Side - Enhanced Branding */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 relative overflow-hidden">
        {/* Enhanced Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-20 w-48 h-48 bg-white rounded-full blur-3xl animate-float-delayed"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-white rounded-full blur-2xl animate-float-slow"></div>
          <div className="absolute top-1/4 right-1/3 w-40 h-40 bg-gradient-to-r from-blue-300 to-purple-300 rounded-full blur-2xl animate-float opacity-60"></div>
        </div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="flex items-center gap-4 mb-12">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/20 shadow-lg">
              <Utensils className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Restaurant & Spa
              </h1>
              <p className="text-blue-100 text-lg">Management System</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex items-start gap-5 group hover:translate-x-2 transition-transform duration-300">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm mt-1 border border-white/20 group-hover:bg-white/30 transition-colors">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-xl mb-3">Lightning Fast</h3>
                <p className="text-blue-100 leading-relaxed text-lg">
                  Manage bookings, inventory, staff, and customer relationships
                  with blazing speed and efficiency.
                </p>
              </div>
            </div>

            <div
              className="flex items-start gap-5 group hover:translate-x-2 transition-transform duration-300"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm mt-1 border border-white/20 group-hover:bg-white/30 transition-colors">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-xl mb-3">
                  Secure & Reliable
                </h3>
                <p className="text-blue-100 leading-relaxed text-lg">
                  Enterprise-grade security with offline-first design. Your data
                  is always safe and accessible.
                </p>
              </div>
            </div>

            <div
              className="flex items-start gap-5 group hover:translate-x-2 transition-transform duration-300"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm mt-1 border border-white/20 group-hover:bg-white/30 transition-colors">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-xl mb-3">
                  Team Collaboration
                </h3>
                <p className="text-blue-100 leading-relaxed text-lg">
                  Seamless collaboration tools that keep your entire team
                  synchronized and productive.
                </p>
              </div>
            </div>

            <div className="mt-12 p-8 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20 shadow-xl">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-blue-100 italic text-lg leading-relaxed mb-4">
                    "This system has completely revolutionized our operations.
                    The intuitive design and powerful features have made
                    managing our restaurant and spa effortless!"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold">
                      SJ
                    </div>
                    <div>
                      <p className="font-semibold text-white">Sarah Johnson</p>
                      <p className="text-blue-200 text-sm">
                        Operations Manager
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Enhanced Login Form */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 py-12 px-4 sm:px-6 lg:px-8 relative">
        <div className="w-full max-w-md space-y-8 relative z-10">
          {/* Enhanced Mobile Logo */}
          <div className="lg:hidden text-center animate-fade-in">
            <div className="inline-flex items-center gap-3 p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl mb-6 shadow-lg">
              <Utensils className="h-7 w-7" />
              <span className="font-bold text-lg">Restaurant & Spa</span>
            </div>
          </div>

          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-lg relative overflow-hidden animate-slide-up">
            {/* Card Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5 opacity-50"></div>

            <CardHeader className="space-y-2 pb-8 relative z-10">
              <CardTitle className="text-4xl font-bold text-center bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                {isSignUp ? "Join Us Today" : "Welcome Back"}
              </CardTitle>
              <CardDescription className="text-center text-gray-600 text-lg font-medium">
                {isSignUp
                  ? "Create your account and start transforming your business"
                  : "Sign in to continue to your dashboard"}
              </CardDescription>
            </CardHeader>

            <CardContent className="pb-10 relative z-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert
                    variant="destructive"
                    className="animate-in slide-in-from-top-2 border-red-200 bg-red-50"
                  >
                    <AlertDescription className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="font-medium">{error}</span>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-5">
                  <div className="space-y-3">
                    <Label
                      htmlFor="email"
                      className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4" />
                      Email Address
                    </Label>
                    <div className="relative group">
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        className="h-14 text-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-200 rounded-xl bg-white/80 backdrop-blur-sm"
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="password"
                      className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                    >
                      <Lock className="h-4 w-4" />
                      Password
                    </Label>
                    <div className="relative group">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        minLength={6}
                        className="h-14 text-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-200 rounded-xl bg-white/80 backdrop-blur-sm pr-14"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-2 h-10 w-10 hover:bg-gray-100 rounded-lg transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </Button>
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] text-lg shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      {isSignUp
                        ? "Creating Your Account..."
                        : "Signing You In..."}
                    </>
                  ) : (
                    <>
                      {isSignUp ? "Create Account" : "Sign In"}
                      <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t-2 border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500 font-medium rounded-full">
                      {isSignUp
                        ? "Already have an account?"
                        : "New to our platform?"}
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full mt-6 h-12 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-semibold transition-all duration-200 rounded-xl text-base"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError("");
                  }}
                  disabled={isLoading}
                >
                  {isSignUp
                    ? "Sign in to existing account"
                    : "Create a new account"}
                </Button>
              </div>

              <div className="mt-10 pt-8 border-t-2 border-gray-100">
                <div className="text-sm text-center text-gray-500 space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                      <span className="font-medium">Secured by Supabase</span>
                    </div>
                  </div>
                  <p className="text-xs">
                    Your data is encrypted and synchronized across all devices
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }
        @keyframes float-delayed {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-30px) rotate(-180deg);
          }
        }
        @keyframes float-slow {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-15px);
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 4s ease-in-out infinite;
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.8s ease-out;
        }
      `}</style>
    </div>
  );
}
