import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useUser } from "@/components/clerk-provider";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  FileClock,
  ShoppingCart,
  CreditCard,
  MapPin,
  CheckCircle,
  Package,
  ArrowRight,
  ShieldCheck,
  Pill,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/my-orders")({
  head: () => ({ meta: [{ title: "My Requests — Taj Medicals" }] }),
  component: MyOrdersPage,
});

interface OrderItem {
  name: string;
  quantity: number;
  price?: number;
  isCustom?: boolean;
}

interface Order {
  id: string;
  items: OrderItem[];
  status: string;
  total_price: number;
  payment_status: string;
  prescription_url?: string;
  notes?: string;
  admin_notes?: string;
  created_at: string;
}

function MyOrdersPage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders((data as any) || []);
    } catch (err) {
      console.error("Error loading orders", err);
      toast.error("Failed to load requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    if (!user) return;

    const channel = supabase
      .channel("customer-orders-sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchOrders();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_review":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700">
            <FileClock className="h-3.5 w-3.5" /> Pending Review
          </span>
        );
      case "packaging":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700">
            <Package className="h-3.5 w-3.5" /> Packaging
          </span>
        );
      case "ready_to_pay":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 border border-orange-200 px-3 py-1 text-xs font-semibold text-orange-700">
            <CreditCard className="h-3.5 w-3.5" /> Awaiting Payment
          </span>
        );
      case "ready_for_pickup":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 animate-pulse">
            <CheckCircle className="h-3.5 w-3.5" /> Ready for Pickup
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
            <ShieldCheck className="h-3.5 w-3.5" /> Picked Up & Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs font-semibold text-red-700">
            Cancelled
          </span>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-emerald-50/20">
      <SiteHeader />
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-emerald-950 dark:text-white">
              My Medical Requests
            </h1>
            <p className="mt-1.5 text-emerald-900/70 dark:text-emerald-200/80">
              Track, pay, and get pickup receipts for your medicines.
            </p>
          </div>
          <Button
            asChild
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-600/10"
          >
            <Link to="/request-medicine">New Medicine Request</Link>
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Sparkles className="h-8 w-8 animate-spin text-emerald-600" />
            <p className="mt-3 text-sm text-emerald-900/60 dark:text-emerald-200/70 font-medium">
              Fetching orders status...
            </p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 rounded-3xl border border-emerald-100 dark:border-emerald-800/60 bg-white shadow-xl shadow-emerald-950/5">
            <ShoppingCart className="h-14 w-14 mx-auto text-emerald-900/20 dark:text-emerald-200/30 mb-4" />
            <h3 className="text-lg font-bold text-emerald-950 dark:text-white">
              No requests found
            </h3>
            <p className="text-sm text-emerald-900/60 dark:text-emerald-200/70 mt-1 max-w-sm mx-auto">
              You haven't requested any medicines yet. Place your first request to get started.
            </p>
            <Button
              asChild
              className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold"
            >
              <Link to="/request-medicine">Request Medicines</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-3xl border border-emerald-100/50 bg-white/70 backdrop-blur p-6 shadow-xl shadow-emerald-950/5 flex flex-col md:flex-row justify-between gap-6 hover:shadow-2xl hover:border-emerald-100 transition duration-300"
              >
                {/* Left side: details */}
                <div className="flex-1 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-bold text-emerald-950/40 dark:text-emerald-100/40 uppercase tracking-wider font-mono">
                      Request #{order.id.replace("mock_", "").slice(0, 8)}
                    </span>
                    {getStatusBadge(order.status)}
                    <span className="text-xs text-emerald-950/50 dark:text-emerald-100/50">
                      {formatDate(order.created_at)}
                    </span>
                  </div>

                  {/* Medicines list */}
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950 dark:text-white uppercase tracking-wider mb-2">
                      Requested Items:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 border border-emerald-100/50 px-3 py-1.5 text-xs font-semibold text-emerald-900"
                          >
                            <Pill className="h-3.5 w-3.5 text-emerald-600" />
                            {item.name}{" "}
                            <span className="text-emerald-900/40 dark:text-emerald-200/50 font-bold ml-1">
                              x{item.quantity}
                            </span>
                            {item.price && (
                              <span className="text-[10px] text-emerald-900/50 dark:text-emerald-200/60 ml-1">
                                (₹{item.price.toFixed(2)})
                              </span>
                            )}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-emerald-950/50 dark:text-emerald-100/50 flex items-center gap-1">
                          <Package className="h-4 w-4" /> Prescription Upload only
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Customer Notes */}
                  {order.notes && (
                    <div className="text-xs text-emerald-900/70 dark:text-emerald-200/80 border-l-2 border-emerald-100 dark:border-emerald-800/60 pl-3.5">
                      <strong>My Notes:</strong> {order.notes}
                    </div>
                  )}

                  {/* Admin Notes */}
                  {order.admin_notes && (
                    <div className="text-xs text-amber-900/80 border-l-2 border-amber-300 bg-amber-50/50 rounded-r-lg p-2 pl-3">
                      <strong>Pharmacist Directions:</strong> {order.admin_notes}
                    </div>
                  )}
                </div>

                {/* Right side: Actions & Pricing */}
                <div className="flex flex-col justify-between items-start md:items-end gap-4 min-w-[200px] border-t md:border-t-0 md:border-l border-emerald-50 pt-4 md:pt-0 md:pl-6">
                  {/* Pricing block */}
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-emerald-950/40 dark:text-emerald-100/40 md:text-right uppercase tracking-wider">
                      Estimated Total
                    </p>
                    <p className="text-2xl font-black text-emerald-950 dark:text-white md:text-right">
                      {order.total_price > 0 ? `₹${order.total_price.toFixed(2)}` : "TBD"}
                    </p>
                    <p
                      className={`text-[10px] font-bold uppercase tracking-wider md:text-right ${order.payment_status === "paid" ? "text-emerald-600" : "text-amber-600"}`}
                    >
                      {order.payment_status === "paid" ? "Payment Completed" : "Payment Pending"}
                    </p>
                  </div>

                  {/* Actions depending on status */}
                  <div className="w-full">
                    {order.status === "ready_for_pickup" && (
                      <div className="space-y-3 w-full">
                        {order.payment_status !== "paid" ? (
                          <Button
                            asChild
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-2"
                          >
                            <Link to="/payment/$orderId" params={{ orderId: order.id }}>
                              View Receipt & Pay <ArrowRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        ) : (
                          <span className="inline-flex w-full justify-center items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 py-2.5 text-xs font-bold text-emerald-800">
                            <CheckCircle className="h-4 w-4" /> Payment Verified
                          </span>
                        )}
                        <div className="rounded-2xl border border-emerald-100 dark:border-emerald-800/60 bg-emerald-50/40 p-3.5 space-y-2 text-emerald-950 dark:text-white w-full">
                          <p className="text-[11px] font-bold flex items-center gap-1.5">
                            <MapPin className="h-4 w-4 text-emerald-600 shrink-0" /> Ready at main
                            counter!
                          </p>
                          <p className="text-[10px] text-emerald-950/70 dark:text-emerald-100/70 leading-relaxed">
                            Pickup code:{" "}
                            <strong className="text-emerald-800">
                              {order.id.replace("mock_", "").slice(0, 5).toUpperCase()}
                            </strong>
                            . Show this screen at the counter.
                          </p>
                        </div>
                      </div>
                    )}

                    {order.status === "pending_review" && (
                      <p className="text-xs text-emerald-900/50 dark:text-emerald-200/60 md:text-right italic">
                        Our pharmacist is matching your request to active stock. We will notify you
                        by email once packaging is complete.
                      </p>
                    )}

                    {order.status === "packaging" && (
                      <p className="text-xs text-blue-900/60 md:text-right italic">
                        Our pharmacist is pricing & packaging your items. You will be notified when
                        ready for pickup.
                      </p>
                    )}

                    {order.status === "completed" && (
                      <p className="text-xs text-emerald-900/40 dark:text-emerald-200/50 md:text-right flex items-center gap-1 justify-end">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> Received at counter
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
