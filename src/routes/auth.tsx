import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClerkActions, useUser } from "@/components/clerk-provider";
import { toast } from "sonner";
import { Pill, Sparkles, ShieldCheck, Mail, User, AlertCircle } from "lucide-react";

const searchSchema = z.object({
  mode: z.enum(["login", "signup"]).catch("login"),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — Taj Medicals" },
      { name: "description", content: "Sign in or create an account with Taj Medicals to track prescriptions and orders." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const isSignup = mode === "signup";
  const { isSignedIn, user } = useUser();
  const { signIn, signUp } = useClerkActions();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isSignedIn && user) {
      navigate({ to: user.role === "admin" ? "/admin" : "/request-medicine" });
    }
  }, [isSignedIn, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate minor delay for realistic Clerk authentication feel
    setTimeout(() => {
      try {
        const isAdminEmail = email.toLowerCase() === "hellotajmedicals@gmail.com";
        if (isSignup) {
          if (!fullName.trim()) {
            toast.error("Please enter your full name");
            setLoading(false);
            return;
          }
          if (isAdminEmail) {
            toast.error("This email is reserved for Admin. Please sign in.");
            setLoading(false);
            return;
          }
          signUp(email, "customer", fullName);
        } else {
          if (isAdminEmail) {
            if (password !== "admin123") {
              toast.error("Incorrect password for Admin account.");
              setLoading(false);
              return;
            }
            signIn(email, "admin", "Taj Admin");
          } else {
            signIn(email, "customer", fullName || undefined);
          }
        }
        const isAdmin = email.toLowerCase() === "hellotajmedicals@gmail.com";
        navigate({ to: isAdmin ? "/admin" : "/request-medicine" });
      } catch (err) {
        toast.error("Authentication failed. Please try again.");
      } finally {
        setLoading(false);
      }
    }, 800);
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-emerald-500/10 via-white to-emerald-500/5 p-4 sm:p-6 lg:p-8">
      {/* Background patterns */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[20%] left-[10%] w-[350px] h-[350px] rounded-full bg-emerald-300/20 blur-[80px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] rounded-full bg-emerald-400/10 blur-[100px]" />
      </div>

      <div className="w-full max-w-lg rounded-3xl border border-emerald-100/50 bg-white/70 backdrop-blur-md p-6 sm:p-10 shadow-2xl shadow-emerald-950/5">
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
            <Pill className="h-6 w-6" />
          </div>
          <span className="text-2xl font-black tracking-tight text-emerald-950">Taj Medicals</span>
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-emerald-950">
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-emerald-900/60 text-sm">
            {isSignup ? "Select your role and register in seconds" : "Sign in to manage your medical orders"}
          </p>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 text-xs text-emerald-900/80 mb-6">
          <AlertCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            <strong>New customer?</strong> Create a free account with your email below. Admin login is reserved for store staff only.
          </span>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          {isSignup && (
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-xs font-bold text-emerald-950">Full Name</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                className="h-11 border-emerald-100 focus-visible:ring-emerald-500 rounded-xl"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-bold text-emerald-950">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="customer@example.com"
              className="h-11 border-emerald-100 focus-visible:ring-emerald-500 rounded-xl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-bold text-emerald-950">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="h-11 border-emerald-100 focus-visible:ring-emerald-500 rounded-xl"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/20 transition mt-2"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 animate-spin" /> Verifying context...
              </span>
            ) : isSignup ? (
              "Create Account"
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-emerald-900/60 font-medium">
          {isSignup ? "Already have an account? " : "Don't have an account? "}
          <Link
            to="/auth"
            search={{ mode: isSignup ? "login" : "signup" }}
            className="font-bold text-emerald-600 hover:text-emerald-700 underline underline-offset-4"
          >
            {isSignup ? "Sign in" : "Create one"}
          </Link>
        </p>


      </div>
    </div>
  );
}
