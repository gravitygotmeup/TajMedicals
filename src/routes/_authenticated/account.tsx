import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useUser, useAuth } from "@/components/clerk-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import {
  ShoppingBag, ClipboardList, LogOut, User, Mail,
  ArrowRight, ShieldCheck, Pill
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "My Account — Taj Medicals" }] }),
  component: AccountPage,
});

function AccountPage() {
  const navigate = useNavigate();
  const { user, isSignedIn } = useUser();
  const { signOut } = useAuth();

  // Redirect admin to admin dashboard immediately
  useEffect(() => {
    if (isSignedIn && user?.role === "admin") {
      navigate({ to: "/admin" });
    }
  }, [isSignedIn, user, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  if (!user) return null;

  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50/40 via-white to-emerald-50/20 dark:from-emerald-950 dark:via-emerald-950/80 dark:to-emerald-900/30">
      <SiteHeader />
      <main className="flex-1 mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-12">

        {/* Profile Card */}
        <div className="rounded-3xl border border-emerald-100 dark:border-emerald-800/60 bg-white dark:bg-emerald-900/30 p-6 sm:p-8 shadow-xl shadow-emerald-950/5 mb-6 flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white text-2xl font-black shadow-lg shadow-emerald-600/30 shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black tracking-tight text-emerald-950 dark:text-white truncate">
              {user.fullName}
            </h1>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-emerald-900/60 dark:text-emerald-300/70">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{user.primaryEmailAddress.emailAddress}</span>
            </div>
            <div className="mt-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-800/50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                <User className="h-3 w-3" /> Customer Account
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl hidden sm:flex items-center gap-1.5 font-semibold shrink-0"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <Link
            to="/request-medicine"
            className="group rounded-3xl border border-emerald-100 dark:border-emerald-800/60 bg-white dark:bg-emerald-900/30 p-6 shadow-lg shadow-emerald-950/5 hover:shadow-xl hover:shadow-emerald-600/10 hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-4"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-800/50 text-emerald-700 dark:text-emerald-300 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-200 shrink-0">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-emerald-950 dark:text-white">Order Medicines</p>
              <p className="text-xs text-emerald-900/60 dark:text-emerald-300/60 mt-0.5">Upload prescription &amp; request medicines</p>
            </div>
            <ArrowRight className="h-5 w-5 text-emerald-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all duration-200" />
          </Link>

          <Link
            to="/my-orders"
            className="group rounded-3xl border border-emerald-100 dark:border-emerald-800/60 bg-white dark:bg-emerald-900/30 p-6 shadow-lg shadow-emerald-950/5 hover:shadow-xl hover:shadow-emerald-600/10 hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-4"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-800/50 text-emerald-700 dark:text-emerald-300 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-200 shrink-0">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-emerald-950 dark:text-white">My Requests</p>
              <p className="text-xs text-emerald-900/60 dark:text-emerald-300/60 mt-0.5">Track your orders &amp; view receipts</p>
            </div>
            <ArrowRight className="h-5 w-5 text-emerald-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all duration-200" />
          </Link>
        </div>

        {/* Store Info Card */}
        <div className="rounded-3xl border border-emerald-100 dark:border-emerald-800/60 bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 sm:p-8 shadow-xl shadow-emerald-600/20 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <Pill className="h-5 w-5" />
            </div>
            <div>
              <p className="font-black text-lg">Taj Medicals</p>
              <p className="text-xs text-emerald-100/80">Pickup Information</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-emerald-100/70 text-xs font-semibold uppercase tracking-wider mb-1">Address</p>
              <p className="font-medium leading-snug">Beside Praveen Hardware, Arya Nagar, Koradi Naka, Nagpur</p>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-emerald-100/70 text-xs font-semibold uppercase tracking-wider mb-1">Phone</p>
                <p className="font-medium">9869782706</p>
              </div>
              <div>
                <p className="text-emerald-100/70 text-xs font-semibold uppercase tracking-wider mb-1">Hours</p>
                <p className="font-medium">Mon–Sat: 8am–10pm &nbsp;|&nbsp; Sun: 9am–8pm</p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-200" />
            <p className="text-xs text-emerald-100/80">All medicines are 100% genuine and properly stored.</p>
          </div>
        </div>

        {/* Mobile sign out */}
        <div className="sm:hidden mt-4">
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="w-full text-red-500 border-red-100 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-950/30 rounded-xl"
          >
            <LogOut className="h-4 w-4 mr-2" /> Sign Out
          </Button>
        </div>

      </main>
      <SiteFooter />
    </div>
  );
}
