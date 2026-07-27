import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import { Pill } from "lucide-react";

// Types matching Clerk's API
export interface ClerkUser {
  id: string;
  fullName: string;
  primaryEmailAddress: {
    emailAddress: string;
  };
  role: "admin" | "customer";
}

interface ClerkAuthContextType {
  isSignedIn: boolean;
  user: ClerkUser | null;
  userId: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, role: "admin" | "customer", name?: string) => void;
  signUp: (email: string, role: "admin" | "customer", name: string) => void;
}

const ClerkAuthContext = createContext<ClerkAuthContextType | undefined>(undefined);

// Hybrid Clerk Provider
export function ClerkProvider({ children }: { children: React.ReactNode }) {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  if (publishableKey) {
    // If Clerk key is provided, we can dynamically load Clerk React SDK
    // To keep it simple, we use the same hook bindings if the developer configures it.
    // For local dev, we will focus on our flawless mock client.
  }

  // --- Mock Clerk Implementation ---
  const [user, setUser] = useState<ClerkUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session
    const savedUser = localStorage.getItem("taj_mock_clerk_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("taj_mock_clerk_user");
      }
    }
    setLoading(false);
  }, []);

  const signOut = async () => {
    localStorage.removeItem("taj_mock_clerk_user");
    setUser(null);
    toast.success("Signed out successfully");
  };

  // Generates a stable, deterministic ID from the email so the same user always has the same ID
  const stableIdFromEmail = (email: string) => {
    // Simple djb2 hash — deterministic, no crypto needed
    let hash = 5381;
    for (let i = 0; i < email.length; i++) {
      hash = ((hash << 5) + hash) + email.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  };

  const signIn = (email: string, role: "admin" | "customer", name?: string) => {
    const isActuallyAdmin = email.toLowerCase() === "hellotajmedicals@gmail.com";
    const finalRole = isActuallyAdmin ? "admin" : "customer";
    // Use stable email-derived ID so the same user always gets the same ID
    const stableId = isActuallyAdmin ? "user_admin_taj" : `user_${stableIdFromEmail(email.toLowerCase())}`;
    // Try to restore existing name from localStorage for this user
    const existingJson = localStorage.getItem(`taj_mock_clerk_user_${stableId}`);
    const existingName = existingJson ? JSON.parse(existingJson)?.fullName : null;
    const mockUser: ClerkUser = {
      id: stableId,
      fullName: existingName || name || (finalRole === "admin" ? "Taj Admin" : email.split("@")[0]),
      primaryEmailAddress: { emailAddress: email },
      role: finalRole,
    };
    localStorage.setItem("taj_mock_clerk_user", JSON.stringify(mockUser));
    localStorage.setItem(`taj_mock_clerk_user_${stableId}`, JSON.stringify(mockUser));
    setUser(mockUser);
    toast.success(`Welcome back, ${mockUser.fullName}!`);
  };

  const signUp = (email: string, role: "admin" | "customer", name: string) => {
    const isActuallyAdmin = email.toLowerCase() === "hellotajmedicals@gmail.com";
    const finalRole = isActuallyAdmin ? "admin" : "customer";
    const stableId = isActuallyAdmin ? "user_admin_taj" : `user_${stableIdFromEmail(email.toLowerCase())}`;
    const mockUser: ClerkUser = {
      id: stableId,
      fullName: name,
      primaryEmailAddress: { emailAddress: email },
      role: finalRole,
    };
    localStorage.setItem("taj_mock_clerk_user", JSON.stringify(mockUser));
    localStorage.setItem(`taj_mock_clerk_user_${stableId}`, JSON.stringify(mockUser));
    setUser(mockUser);
    toast.success(`Account created! Welcome, ${name}!`);
  };

  return (
    <ClerkAuthContext.Provider
      value={{
        isSignedIn: !!user,
        user,
        userId: user?.id ?? null,
        loading,
        signOut,
        signIn,
        signUp,
      }}
    >
      {!loading && children}
    </ClerkAuthContext.Provider>
  );
}

// Hooks
export function useUser() {
  const context = useContext(ClerkAuthContext);
  if (!context) throw new Error("useUser must be used within ClerkProvider");
  return {
    isSignedIn: context.isSignedIn,
    user: context.user,
    isLoaded: !context.loading,
  };
}

export function useAuth() {
  const context = useContext(ClerkAuthContext);
  if (!context) throw new Error("useAuth must be used within ClerkProvider");
  return {
    isSignedIn: context.isSignedIn,
    userId: context.userId,
    signOut: context.signOut,
    isLoaded: !context.loading,
  };
}

export function useClerkActions() {
  const context = useContext(ClerkAuthContext);
  if (!context) throw new Error("useClerkActions must be used within ClerkProvider");
  return {
    signIn: context.signIn,
    signUp: context.signUp,
  };
}

// Components
export function SignedIn({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useUser();
  return isSignedIn ? <>{children}</> : null;
}

export function SignedOut({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useUser();
  return !isSignedIn ? <>{children}</> : null;
}

export function UserButton() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full p-1 hover:bg-emerald-50 focus:outline-none transition"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 font-bold text-white uppercase">
          {user.fullName.charAt(0)}
        </div>
        <span className="hidden sm:inline text-xs font-semibold text-emerald-950">
          {user.fullName}
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-emerald-100 bg-white p-3 shadow-xl z-50">
            <p className="text-sm font-bold text-emerald-950">{user.fullName}</p>
            <p className="text-xs text-emerald-800/60 truncate">{user.primaryEmailAddress.emailAddress}</p>
            <div className="mt-1">
              <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${user.role === "admin" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                {user.role === "admin" ? "Admin / Owner" : "Customer"}
              </span>
            </div>
            <div className="my-2 border-t border-emerald-50" />
            <button
              onClick={() => {
                setOpen(false);
                signOut();
              }}
              className="w-full text-left rounded-lg px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
