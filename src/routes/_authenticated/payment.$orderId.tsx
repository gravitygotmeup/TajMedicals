import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Pill,
  Sparkles,
  ShieldCheck,
  ArrowLeft,
  Calendar,
  MapPin,
  Phone,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/payment/$orderId")({
  head: () => ({ meta: [{ title: "Online Payment — Taj Medicals" }] }),
  component: PaymentPage,
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
  total_price: number;
  payment_status: string;
  user_email: string;
}

function PaymentPage() {
  const { orderId } = Route.useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .single();

        if (error) throw error;
        setOrder(data as any);
      } catch (err) {
        console.error("Error loading order", err);
        toast.error("Order details not found.");
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-emerald-50/20 dark:bg-emerald-950/80">
        <SiteHeader />
        <main className="flex-1 flex flex-col items-center justify-center py-20">
          <Sparkles className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="mt-3 text-sm text-emerald-900/60 dark:text-emerald-200/70 font-medium">
            Securing payment portal...
          </p>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col bg-emerald-50/20 dark:bg-emerald-950/80">
        <SiteHeader />
        <main className="flex-1 mx-auto max-w-md px-4 py-20 text-center">
          <h2 className="text-xl font-bold text-emerald-950 dark:text-white">Invoice not found</h2>
          <p className="text-sm text-emerald-900/60 dark:text-emerald-200/70 mt-1">
            This payment link is invalid or expired.
          </p>
          <Button
            asChild
            className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
          >
            <Link to="/my-orders">Go to My Orders</Link>
          </Button>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const total = order.total_price; // Total set by pharmacist, no extra fees

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50/30 via-white to-emerald-50/10 dark:from-emerald-950 dark:via-emerald-950 dark:to-emerald-900/30">
      <SiteHeader />

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-2 mb-6">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/50 rounded-xl"
          >
            <Link to="/my-orders">
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to My Orders
            </Link>
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-emerald-950 dark:text-white">
            Payment Checkout
          </h1>
          <p className="mt-1 text-emerald-900/70 dark:text-emerald-200/80">
            Complete your online payment to authorize medication pickup.
          </p>
        </div>

        <div className="grid md:grid-cols-12 gap-8 items-start">
          {/* Invoice Summary column (5 cols) */}
          <div className="md:col-span-5 rounded-3xl border border-emerald-100 dark:border-emerald-800/60 bg-white p-6 shadow-xl shadow-emerald-950/5 space-y-6">
            <h2 className="text-lg font-bold text-emerald-950 dark:text-white border-b border-emerald-50 pb-3">
              Invoice Details
            </h2>

            <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
              {order.items &&
                order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center text-sm border-b border-emerald-50/50 pb-2.5 last:border-b-0 last:pb-0"
                  >
                    <div className="flex items-center gap-2">
                      <Pill className="h-4 w-4 text-emerald-600 shrink-0" />
                      <div>
                        <p className="font-semibold text-emerald-950 dark:text-white">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-emerald-950/40 dark:text-emerald-100/40">
                          Qty: {item.quantity}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-950 dark:text-white">
                      {item.price ? `₹${(item.price * item.quantity).toFixed(2)}` : "TBD"}
                    </span>
                  </div>
                ))}
            </div>

            {/* Calculations */}
            <div className="border-t border-emerald-50 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-base font-extrabold text-emerald-950 dark:text-white pt-1">
                <span>Total Amount Due</span>
                <span className="text-emerald-700">₹{total.toFixed(2)}</span>
              </div>
              <p className="text-[10px] text-emerald-900/50 dark:text-emerald-200/60 leading-relaxed">
                Price inclusive of all applicable charges as set by the pharmacist.
              </p>
            </div>

            {/* Security assurance */}
            <div className="flex gap-2 bg-emerald-50/30 dark:bg-emerald-900/30 border border-emerald-100/50 dark:border-emerald-800/60 rounded-2xl p-3.5 text-xs text-emerald-950 dark:text-white">
              <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold">Sterile Sealed Guarantee</p>
                <p className="text-emerald-950/60 dark:text-emerald-300/60 leading-relaxed mt-0.5">
                  Your prescription is packed in a certified tamper-proof bag under medical grade
                  supervision.
                </p>
              </div>
            </div>
          </div>

          {/* UPI and Pickup info column (7 cols) */}
          <div className="md:col-span-7 rounded-3xl border border-emerald-100 dark:border-emerald-800/60 bg-white p-6 sm:p-8 shadow-xl shadow-emerald-950/5 space-y-6">
            <div className="flex justify-between items-center border-b border-emerald-50 pb-3">
              <h2 className="text-lg font-bold text-emerald-950 dark:text-white">
                Choose Payment Method
              </h2>
              <div className="flex gap-1.5 text-emerald-900/30 dark:text-emerald-200/40">
                <Lock className="h-4 w-4 text-emerald-600" />
                <span className="text-[10px] font-bold tracking-wider uppercase">UPI Secure</span>
              </div>
            </div>

            <div className="space-y-6">
              {/* Option 1: UPI QR code */}
              <div className="border border-emerald-100 dark:border-emerald-800/60 rounded-2xl p-5 bg-emerald-50/10 flex flex-col items-center text-center">
                <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-3">
                  Option 1: Scan UPI QR Code
                </span>
                <p className="text-xs text-emerald-950/70 dark:text-emerald-100/70 mb-4 max-w-sm">
                  Scan this QR code using any UPI app (Google Pay, PhonePe, Paytm, BHIM) to pay the
                  exact amount.
                </p>
                <div className="p-3 bg-white dark:bg-emerald-900/40 rounded-2xl border border-emerald-100 dark:border-emerald-800/60 dark:border-emerald-800/50 shadow-md mb-2">
                  <img
                    src="/qr-code.png"
                    alt="UPI Payment QR Code — Taj Medicals"
                    className="h-[200px] w-[200px] object-contain rounded-lg"
                    onError={(e: any) => {
                      e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent("upi://pay?pa=hellotajmedicals@okaxis&pn=Taj%20Medicals&cu=INR")}`;
                    }}
                  />
                </div>
                <p className="text-xs text-emerald-900/60 dark:text-emerald-200/70 dark:text-emerald-300/60 mb-3">
                  UPI ID:{" "}
                  <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300 select-all">
                    hellotajmedicals@okaxis
                  </span>
                </p>
                <p className="text-sm font-black text-emerald-950 dark:text-white mb-2">
                  Amount Due:{" "}
                  <span className="text-emerald-700 font-mono">₹{total.toFixed(2)}</span>
                </p>
                <p className="text-[11px] text-emerald-900/60 dark:text-emerald-200/70">
                  Show payment screenshot at the counter during pickup.
                </p>
              </div>

              {/* Pay at shop counter */}
              <div className="border border-emerald-100/80 dark:border-emerald-800/60 rounded-2xl p-5 bg-white dark:bg-emerald-900/30 flex flex-col">
                <span className="self-center inline-flex rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-bold text-white uppercase tracking-wider mb-3">
                  Pay at Counter & Pick Up
                </span>
                <p className="text-xs text-emerald-950/70 dark:text-emerald-100/70 text-center mb-4 leading-relaxed">
                  Visit the shop counter with your pickup code. Pay via Cash, Card, or UPI — the
                  pharmacist will hand over your packaged medicines.
                </p>
                <div className="border-t border-emerald-50 pt-4 space-y-3">
                  <div className="flex gap-3 text-xs">
                    <MapPin className="h-5 w-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold text-emerald-950 dark:text-white">Pickup Address:</p>
                      <p className="text-emerald-900/60 dark:text-emerald-200/70 mt-0.5 font-medium leading-relaxed">
                        Beside Praveen Hardware, Arya Nagar, Koradi Naka, Nagpur
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <Phone className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold text-emerald-950 dark:text-white">Phone Number:</p>
                      <p className="text-emerald-900/60 dark:text-emerald-200/70 mt-0.5 font-semibold">
                        9869782706
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <Calendar className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold text-emerald-950 dark:text-white">
                        Your Pickup Code:
                      </p>
                      <p className="text-emerald-800 mt-0.5 font-black uppercase font-mono text-sm tracking-wider">
                        {order.id.replace("mock_", "").slice(0, 5).toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="w-full mt-4 border-emerald-100 dark:border-emerald-800/60 hover:bg-emerald-50 rounded-xl font-bold h-11"
                >
                  <Link to="/my-orders">Back to My Orders</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
