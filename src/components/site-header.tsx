import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useUser, UserButton } from "@/components/clerk-provider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Pill, Activity, ShieldCheck, ShoppingCart, Sun, Moon, Menu, User } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

export function SiteHeader() {
  const { isSignedIn, user } = useUser();
  const navigate = useNavigate();
  const { toggleTheme, isDark, mounted } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (to: string) => {
    setMobileOpen(false);
    navigate({ to: to as any });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-emerald-100 dark:border-emerald-900/50 bg-white/90 dark:bg-emerald-950/95 backdrop-blur-md transition-colors duration-200">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: auth actions */}
        <div className="flex items-center gap-1.5 sm:gap-3.5 order-1 min-w-0">
          {isSignedIn ? (
            <div className="flex items-center gap-1.5 sm:gap-3">
              <UserButton />
              <Button
                asChild
                size="sm"
                variant="ghost"
                className="hidden sm:inline-flex border border-emerald-100 dark:border-emerald-900 hover:bg-emerald-50 dark:hover:bg-emerald-900/50 rounded-xl text-xs font-bold text-emerald-950 dark:text-emerald-100"
              >
                <Link to="/account">Profile Settings</Link>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="hover:bg-emerald-50 dark:hover:bg-emerald-900/50 hover:text-emerald-950 dark:hover:text-emerald-100 text-emerald-800 dark:text-emerald-300 rounded-lg text-xs font-bold px-2 sm:px-3"
              >
                <Link to="/auth" search={{ mode: "login" }}>
                  Login
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-600/10 px-2 sm:px-3"
              >
                <Link to="/auth" search={{ mode: "signup" }}>
                  <span className="hidden xs:inline">Create </span>Account
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Center: brand logo */}
        <Link
          to="/"
          className="order-2 absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2"
        >
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
            <Pill className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <span className="text-lg sm:text-xl font-extrabold tracking-tight text-emerald-950 dark:text-white">
            Taj Medicals
          </span>
        </Link>

        {/* Right: theme toggle + desktop navigation + hamburger */}
        <div className="order-3 flex items-center gap-1.5 sm:gap-3">
          {/* Theme Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9 rounded-xl border border-emerald-100 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/50 transition-colors shrink-0"
            title="Toggle Theme"
          >
            {mounted && isDark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </Button>

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-emerald-900 dark:text-emerald-100">
            {isSignedIn ? (
              user?.role === "admin" ? (
                <>
                  <Link
                    to="/admin"
                    className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 flex items-center gap-1"
                  >
                    <ShieldCheck className="h-4 w-4" /> Admin Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/request-medicine"
                    className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 flex items-center gap-1"
                  >
                    <Activity className="h-4 w-4" /> Request Medicine
                  </Link>
                  <Link
                    to="/my-orders"
                    className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 flex items-center gap-1"
                  >
                    <ShoppingCart className="h-4 w-4" /> My Requests
                  </Link>
                </>
              )
            ) : (
              <>
                <a href="#products" className="hover:text-emerald-600 dark:hover:text-emerald-400">
                  Products
                </a>
                <a href="#services" className="hover:text-emerald-600 dark:hover:text-emerald-400">
                  Services
                </a>
                <a href="#about" className="hover:text-emerald-600 dark:hover:text-emerald-400">
                  About
                </a>
                <a href="#contact" className="hover:text-emerald-600 dark:hover:text-emerald-400">
                  Contact
                </a>
              </>
            )}
          </nav>

          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-9 w-9 rounded-xl border border-emerald-100 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 shrink-0"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="bg-white dark:bg-emerald-950 border-emerald-100 dark:border-emerald-900 w-[280px] p-6"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
                    <Pill className="h-4 w-4" />
                  </div>
                  <span className="text-lg font-extrabold text-emerald-950 dark:text-white">
                    Taj Medicals
                  </span>
                </div>
              </div>

              <nav className="flex flex-col gap-1">
                {!isSignedIn && (
                  <>
                    <a
                      href="#products"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-emerald-900 dark:text-emerald-100 hover:bg-emerald-50 dark:hover:bg-emerald-900/50 transition"
                    >
                      Products
                    </a>
                    <a
                      href="#services"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-emerald-900 dark:text-emerald-100 hover:bg-emerald-50 dark:hover:bg-emerald-900/50 transition"
                    >
                      Services
                    </a>
                    <a
                      href="#about"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-emerald-900 dark:text-emerald-100 hover:bg-emerald-50 dark:hover:bg-emerald-900/50 transition"
                    >
                      About
                    </a>
                    <a
                      href="#contact"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-emerald-900 dark:text-emerald-100 hover:bg-emerald-50 dark:hover:bg-emerald-900/50 transition"
                    >
                      Contact
                    </a>
                  </>
                )}
                {isSignedIn && user?.role === "admin" && (
                  <button
                    onClick={() => handleNav("/admin")}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-emerald-900 dark:text-emerald-100 hover:bg-emerald-50 dark:hover:bg-emerald-900/50 transition"
                  >
                    <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" /> Admin Dashboard
                  </button>
                )}
                {isSignedIn && user?.role === "customer" && (
                  <>
                    <button
                      onClick={() => handleNav("/request-medicine")}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-emerald-900 dark:text-emerald-100 hover:bg-emerald-50 dark:hover:bg-emerald-900/50 transition"
                    >
                      <Activity className="h-4.5 w-4.5 text-emerald-600" /> Request Medicine
                    </button>
                    <button
                      onClick={() => handleNav("/my-orders")}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-emerald-900 dark:text-emerald-100 hover:bg-emerald-50 dark:hover:bg-emerald-900/50 transition"
                    >
                      <ShoppingCart className="h-4.5 w-4.5 text-emerald-600" /> My Requests
                    </button>
                  </>
                )}
              </nav>

              {isSignedIn && (
                <div className="mt-6 pt-6 border-t border-emerald-100 dark:border-emerald-900 space-y-1">
                  <button
                    onClick={() => handleNav("/account")}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-emerald-900 dark:text-emerald-100 hover:bg-emerald-50 dark:hover:bg-emerald-900/50 transition w-full text-left"
                  >
                    <User className="h-4.5 w-4.5 text-emerald-600" /> Profile
                  </button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
