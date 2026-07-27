import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { useUser } from "@/components/clerk-provider";
import {
  Pill,
  ShieldCheck,
  HeartPulse,
  Stethoscope,
  Baby,
  Sparkles,
  ShoppingCart,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Taj Medicals — Trusted Neighborhood Pharmacy" },
      {
        name: "description",
        content:
          "Taj Medicals offers quality medicines, wellness products, and prescription services with easy counter pickup.",
      },
      { property: "og:title", content: "Taj Medicals — Trusted Neighborhood Pharmacy" },
      {
        property: "og:description",
        content:
          "Quality medicines, wellness products, and prescription services with free home delivery.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { isSignedIn, user } = useUser();
  const getStartedTarget = isSignedIn
    ? user?.role === "admin"
      ? "/admin"
      : "/request-medicine"
    : "/auth";

  return (
    <div className="min-h-screen flex flex-col bg-emerald-50/30 dark:bg-emerald-950/80">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-3 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" /> Est. 15 Aug 2020
            </span>
            <h1 className="mt-4 text-4xl md:text-6xl font-bold tracking-tight text-emerald-950 dark:text-white">
              Your health, <span className="text-emerald-600">our priority</span>
            </h1>
            <p className="mt-5 text-lg text-emerald-900/80 dark:text-emerald-100/85 max-w-lg">
              Taj Medicals is your reliable neighborhood pharmacy — offering genuine medicines,
              wellness essentials, and expert advice with quick counter pickup.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Link to={getStartedTarget} search={isSignedIn ? undefined : { mode: "signup" }}>
                  Get Started
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-emerald-600 text-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-900/30 hover:bg-emerald-50"
              >
                <a href="#products">Browse Products</a>
              </Button>
            </div>
            <div className="mt-8 flex gap-6 text-sm text-emerald-900/70 dark:text-emerald-200/75">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> 100% Genuine
              </div>
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-emerald-600" /> Counter Pickup
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-square rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-700 p-8 shadow-xl">
              <div className="h-full w-full rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
                <Pill className="h-40 w-40 text-white/90" />
              </div>
            </div>
            <div className="absolute -bottom-4 left-2 sm:-left-6 rounded-2xl bg-white dark:bg-emerald-950 p-3 sm:p-4 shadow-lg border border-emerald-100 dark:border-emerald-900/60">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-emerald-100 dark:bg-emerald-800 p-2">
                  <HeartPulse className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-emerald-900/60 dark:text-emerald-300/70">Trusted by</p>
                  <p className="text-sm font-bold text-emerald-950 dark:text-emerald-100">
                    10,000+ families
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="py-16 md:py-24 bg-white dark:bg-emerald-950/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-emerald-950 dark:text-white">
              What we offer
            </h2>
            <p className="mt-3 text-emerald-900/70 dark:text-emerald-200/75">
              Everything you need for your family's health, under one roof.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Pill,
                title: "Prescription Medicines",
                desc: "Wide range of branded and generic medicines available on prescription.",
              },
              {
                icon: HeartPulse,
                title: "Wellness & OTC",
                desc: "Vitamins, supplements, first-aid, and daily wellness essentials.",
              },
              {
                icon: Baby,
                title: "Baby & Personal Care",
                desc: "Trusted brands for babies, moms, and personal hygiene.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-emerald-100 dark:border-emerald-900/40 p-6 hover:shadow-lg transition bg-emerald-50/40 dark:bg-emerald-900/10"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-emerald-950 dark:text-emerald-100">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-emerald-900/70 dark:text-emerald-200/70">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-emerald-950 dark:text-white">
              Services designed around you
            </h2>
            <ul className="mt-6 space-y-4">
              {[
                {
                  icon: ShoppingCart,
                  title: "Counter Pickup",
                  desc: "Order online and pick up your packaged medicines at the shop counter.",
                },
                {
                  icon: Stethoscope,
                  title: "Pharmacist Consultation",
                  desc: "Get professional advice from our qualified pharmacists.",
                },
                {
                  icon: ShieldCheck,
                  title: "Secure Transactions",
                  desc: "Pay securely via UPI QR code or cash at the counter.",
                },
              ].map(({ icon: Icon, title, desc }) => (
                <li key={title} className="flex gap-4">
                  <div className="shrink-0 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-emerald-950 dark:text-emerald-100">{title}</p>
                    <p className="text-sm text-emerald-900/70 dark:text-emerald-200/70">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl bg-emerald-600 text-white p-8 md:p-10">
            <h3 className="text-2xl font-bold">Create your account today</h3>
            <p className="mt-2 text-emerald-100">
              Save your prescriptions, track orders, and get exclusive member offers.
            </p>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="mt-6 bg-white dark:bg-emerald-800 text-emerald-700 dark:text-white hover:bg-emerald-50 dark:hover:bg-emerald-700"
            >
              <Link to="/auth" search={{ mode: "signup" }}>
                Sign up free
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-16 md:py-24 bg-white dark:bg-emerald-950/20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-emerald-950 dark:text-white">
            About Taj Medicals
          </h2>
          <p className="mt-4 text-emerald-900/70 dark:text-emerald-200/75 text-lg">
            Since August 2020, Taj Medicals has been serving our community with honesty, care, and
            expertise. We believe healthcare should be accessible, affordable, and personal — that's
            what we deliver every single day.
          </p>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-emerald-950 dark:text-white">
            Get in touch
          </h2>
          <p className="mt-3 text-emerald-900/70 dark:text-emerald-200/75">
            Visit our store or call us anytime.
          </p>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-white dark:bg-emerald-900/10 p-6">
              <p className="font-semibold text-emerald-950 dark:text-emerald-100">Address</p>
              <p className="text-sm text-emerald-900/70 dark:text-emerald-200/70 mt-1">
                Beside Praveen Hardware, Arya Nagar, Koradi Naka, Nagpur
              </p>
            </div>
            <div className="rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-white dark:bg-emerald-900/10 p-6">
              <p className="font-semibold text-emerald-950 dark:text-emerald-100">Phone</p>
              <p className="text-sm text-emerald-900/70 dark:text-emerald-200/70 mt-1">
                9869782706
              </p>
            </div>
            <div className="rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-white dark:bg-emerald-900/10 p-6">
              <p className="font-semibold text-emerald-950 dark:text-emerald-100">Email</p>
              <p className="text-sm text-emerald-900/70 dark:text-emerald-200/70 mt-1">
                hellotajmedicals@gmail.com
              </p>
            </div>
            <div className="rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-white dark:bg-emerald-900/10 p-6">
              <p className="font-semibold text-emerald-950 dark:text-emerald-100">Hours</p>
              <p className="text-sm text-emerald-900/70 dark:text-emerald-200/70 mt-1">
                Mon–Sat: 9:30am–10:30pm
              </p>
              <p className="text-sm text-emerald-900/70 dark:text-emerald-200/70">
                Sun: 9:30am–2pm, 6–9pm
              </p>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
