import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useUser } from "@/components/clerk-provider";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ShieldAlert,
  Sparkles,
  TrendingUp,
  PackageCheck,
  ShoppingBag,
  ClipboardList,
  Plus,
  Trash2,
  CheckCircle2,
  IndianRupee,
  FileImage,
  ExternalLink,
  RefreshCw,
  Pill,
} from "lucide-react";
import { sendCustomerPackagingEmail, sendCustomerPickupCompletedEmail } from "@/lib/email.server";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: ({ context }) => {
    const user = (context as any).user;
    if (!user || user.role !== "admin") {
      throw redirect({ to: "/account" });
    }
  },
  head: () => ({ meta: [{ title: "Admin Portal — Taj Medicals" }] }),
  component: AdminPage,
});

interface OrderItem {
  name: string;
  quantity: number;
  price?: number;
  isCustom?: boolean;
}

interface Order {
  id: string;
  user_id: string;
  user_email: string;
  user_phone: string;
  user_address: string;
  items: OrderItem[];
  prescription_url?: string;
  status: string;
  total_price: number;
  payment_status: string;
  notes?: string;
  admin_notes?: string;
  created_at: string;
}

interface Medicine {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
}

function AdminPage() {
  const { user } = useUser();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingInventory, setLoadingInventory] = useState(true);

  // Processing order states
  const [activeProcessingOrder, setActiveProcessingOrder] = useState<Order | null>(null);
  const [processingItems, setProcessingItems] = useState<OrderItem[]>([]);
  const [adminNotes, setAdminNotes] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // New inventory medicine states
  const [newMedName, setNewMedName] = useState("");
  const [newMedDesc, setNewMedDesc] = useState("");
  const [newMedPrice, setNewMedPrice] = useState("");
  const [newMedCategory, setNewMedCategory] = useState("Wellness");
  const [newMedStock, setNewMedStock] = useState("");
  const [addingMed, setAddingMed] = useState(false);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders((data as any) || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch order queue");
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchInventory = async () => {
    setLoadingInventory(true);
    try {
      const { data, error } = await supabase
        .from("medicines")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setMedicines((data as any) || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch inventory catalog");
    } finally {
      setLoadingInventory(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchInventory();

    // Subscribe to realtime updates for orders
    const channel = supabase
      .channel("admin-orders-sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          fetchOrders();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleOpenProcessOrder = (order: Order) => {
    setActiveProcessingOrder(order);
    setProcessingItems(order.items || []);
    setAdminNotes(order.admin_notes || "");
  };

  const handleProcessingItemPriceChange = (index: number, val: number) => {
    setProcessingItems(
      processingItems.map((item, i) => (i === index ? { ...item, price: val } : item)),
    );
  };

  const handleProcessingItemQtyChange = (index: number, val: number) => {
    if (val < 1) return;
    setProcessingItems(
      processingItems.map((item, i) => (i === index ? { ...item, quantity: val } : item)),
    );
  };

  const handleSubmitReview = async () => {
    if (!activeProcessingOrder) return;
    setSubmittingReview(true);

    try {
      // Calculate final total based on admin review pricing
      const finalTotal = processingItems.reduce((acc, item) => {
        const itemPrice = item.price || 0;
        return acc + itemPrice * item.quantity;
      }, 0);

      // Update Order record — set to "packaging", don't notify customer yet
      const { error } = await supabase
        .from("orders")
        .update({
          items: processingItems as any,
          status: "packaging",
          total_price: finalTotal,
          admin_notes: adminNotes,
        })
        .eq("id", activeProcessingOrder.id);

      if (error) throw error;

      toast.success("Order priced and sent to packaging!");
      setActiveProcessingOrder(null);
      fetchOrders();
    } catch (err) {
      console.error("Submit review failed", err);
      toast.error(err instanceof Error ? err.message : "Failed to package order");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleMarkReadyForPickup = async (order: Order) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          status: "ready_for_pickup",
        })
        .eq("id", order.id);

      if (error) throw error;

      // Notify customer that order is ready for pickup
      try {
        await sendCustomerPackagingEmail({
          data: {
            orderId: order.id,
            customerEmail: order.user_email,
            totalPrice: order.total_price || 0,
          },
        });
      } catch (emailErr) {
        console.error("Failed to send pickup notification email", emailErr);
      }

      toast.success("Order marked ready for pickup! Customer notified.");
      fetchOrders();
    } catch (err) {
      console.error("Failed to mark ready for pickup", err);
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const handleMarkAsCompleted = async (order: Order) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          status: "completed",
          payment_status: "paid", // Customer is paying at the counter upon pickup
        })
        .eq("id", order.id);

      if (error) throw error;

      try {
        await sendCustomerPickupCompletedEmail({
          data: {
            orderId: order.id,
            customerEmail: order.user_email,
          },
        });
      } catch (emailErr) {
        console.error("Failed to send completion email", emailErr);
      }

      toast.success("Order marked as completed and payment recorded.");
      fetchOrders();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status.");
    }
  };

  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName || !newMedPrice) return;
    setAddingMed(true);

    try {
      const { error } = await supabase.from("medicines").insert({
        name: newMedName,
        description: newMedDesc,
        price: parseFloat(newMedPrice),
        category: newMedCategory,
        stock: parseInt(newMedStock) || 0,
      });

      if (error) throw error;
      toast.success("Medicine added to catalog!");

      setNewMedName("");
      setNewMedDesc("");
      setNewMedPrice("");
      setNewMedStock("");

      fetchInventory();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add medicine.");
    } finally {
      setAddingMed(false);
    }
  };

  const handleDeleteMedicine = async (id: string) => {
    if (!confirm("Are you sure you want to delete this medicine?")) return;
    try {
      const { error } = await supabase.from("medicines").delete().eq("id", id);

      if (error) throw error;
      toast.success("Medicine deleted.");
      fetchInventory();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete medicine.");
    }
  };

  // Stats Calculations
  const sales = orders
    .filter((o) => o.payment_status === "paid")
    .reduce((acc, curr) => acc + (curr.total_price || 0), 0);

  const pendingCount = orders.filter((o) => o.status === "pending_review").length;
  const readyPickupCount = orders.filter((o) => o.status === "ready_for_pickup").length;
  const completedCount = orders.filter((o) => o.status === "completed").length;

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col bg-emerald-50/20">
        <SiteHeader />
        <main className="flex-1 flex flex-col items-center justify-center py-20 text-center">
          <ShieldAlert className="h-10 w-10 text-red-500 mb-2" />
          <h2 className="text-xl font-bold text-emerald-950 dark:text-white">
            Unauthorized Access
          </h2>
          <p className="text-sm text-emerald-900/60 dark:text-emerald-200/70 mt-1">
            This page requires owner privileges.
          </p>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-emerald-50/10">
      <SiteHeader />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Title */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-emerald-950 dark:text-white flex items-center gap-2">
              Taj Admin Dashboard
            </h1>
            <p className="mt-1 text-emerald-900/70 dark:text-emerald-200/80">
              Manage incoming prescription requests, set sterile packaging pricing, and keep track
              of pickups.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchOrders();
              fetchInventory();
            }}
            className="border-emerald-100 bg-white"
          >
            <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh Data
          </Button>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-lg shadow-emerald-950/5 flex items-center gap-4">
            <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-950/40 dark:text-emerald-100/40 uppercase tracking-wider">
                Total Sales
              </p>
              <p className="text-xl font-extrabold text-emerald-950 dark:text-white">
                ₹{sales.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-lg shadow-emerald-950/5 flex items-center gap-4">
            <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-950/40 dark:text-emerald-100/40 uppercase tracking-wider">
                Pending Review
              </p>
              <p className="text-xl font-extrabold text-emerald-950 dark:text-white">
                {pendingCount} orders
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-lg shadow-emerald-950/5 flex items-center gap-4">
            <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
              <PackageCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-950/40 dark:text-emerald-100/40 uppercase tracking-wider">
                Awaiting Pickup
              </p>
              <p className="text-xl font-extrabold text-emerald-950 dark:text-white">
                {readyPickupCount} orders
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-lg shadow-emerald-950/5 flex items-center gap-4">
            <div className="rounded-xl bg-gray-100 p-3 text-gray-700">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-950/40 dark:text-emerald-100/40 uppercase tracking-wider">
                Completed Pickups
              </p>
              <p className="text-xl font-extrabold text-emerald-950 dark:text-white">
                {completedCount} orders
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Area: Tabs */}
        <Tabs defaultValue="queue" className="space-y-6">
          <TabsList className="bg-white border border-emerald-100 rounded-xl p-1 w-full max-w-sm">
            <TabsTrigger
              value="queue"
              className="rounded-lg font-bold data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
            >
              Order Queue
            </TabsTrigger>
            <TabsTrigger
              value="inventory"
              className="rounded-lg font-bold data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
            >
              Inventory Catalog
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Order Queue */}
          <TabsContent value="queue" className="space-y-6 outline-none">
            {loadingOrders ? (
              <div className="py-12 text-center text-emerald-900/60 dark:text-emerald-200/70 font-semibold flex flex-col items-center gap-2">
                <Sparkles className="h-6 w-6 animate-spin text-emerald-600" /> Loading Queue...
              </div>
            ) : orders.length === 0 ? (
              <div className="py-12 text-center text-emerald-900/50 dark:text-emerald-200/60 bg-white border border-emerald-100 rounded-3xl">
                No orders have been received yet.
              </div>
            ) : (
              <div className="grid xl:grid-cols-12 gap-8 items-start">
                {/* Orders List Deck (7 cols) */}
                <div
                  className={`xl:col-span-7 space-y-4 ${activeProcessingOrder ? "hidden xl:block" : ""}`}
                >
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className={`p-5 rounded-2xl border transition bg-white ${
                        activeProcessingOrder?.id === order.id
                          ? "border-emerald-500 shadow-md ring-2 ring-emerald-100"
                          : "border-emerald-50 hover:shadow-md"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-50 pb-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-950/40 dark:text-emerald-100/40 uppercase font-mono">
                            #{order.id.replace("mock_", "").slice(0, 8)}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                              order.status === "pending_review"
                                ? "bg-amber-100 text-amber-800"
                                : order.status === "packaging"
                                  ? "bg-blue-100 text-blue-800"
                                  : order.status === "ready_to_pay"
                                    ? "bg-orange-100 text-orange-800"
                                    : order.status === "ready_for_pickup"
                                      ? "bg-emerald-100 text-emerald-800 animate-pulse"
                                      : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {order.status.replace("_", " ")}
                          </span>
                        </div>
                        <span className="text-xs text-emerald-950/50 dark:text-emerald-100/50">
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 items-start mb-4">
                        <div>
                          <p className="text-[10px] font-bold text-emerald-950/30 dark:text-emerald-100/30 uppercase tracking-wider">
                            Customer details
                          </p>
                          <p className="text-sm font-bold text-emerald-950 dark:text-white">
                            {order.user_email}
                          </p>
                          <p className="text-xs text-emerald-950/70 dark:text-emerald-100/70">
                            {order.user_phone || "No phone"}
                          </p>
                          <p className="text-[11px] text-emerald-950/60 dark:text-emerald-100/60 mt-1 truncate">
                            {order.user_address || "No address"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-emerald-950/30 dark:text-emerald-100/30 uppercase tracking-wider">
                            Items summary
                          </p>
                          <div className="max-h-[80px] overflow-y-auto mt-1">
                            {order.items &&
                              order.items.map((item, idx) => (
                                <p
                                  key={idx}
                                  className="text-xs text-emerald-950 dark:text-white leading-relaxed font-semibold"
                                >
                                  • {item.name}{" "}
                                  <span className="text-emerald-900/50 dark:text-emerald-200/60">
                                    x{item.quantity}
                                  </span>
                                </p>
                              ))}
                          </div>
                        </div>
                      </div>

                      {order.prescription_url && (
                        <div className="mb-4">
                          <a
                            href={order.prescription_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-100 bg-emerald-50/30 px-3 py-1.5 text-xs text-emerald-800 font-bold hover:bg-emerald-50 transition"
                          >
                            <FileImage className="h-4 w-4 text-emerald-600" /> View Prescription{" "}
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      )}

                      <div className="flex justify-between items-center border-t border-emerald-50 pt-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-emerald-950 dark:text-white">
                            Invoice:{" "}
                            {order.total_price > 0 ? `₹${order.total_price.toFixed(2)}` : "Pending"}
                          </span>
                          {order.total_price > 0 && (
                            <span
                              className={`text-[10px] font-bold uppercase mt-0.5 ${order.payment_status === "paid" ? "text-emerald-600" : "text-amber-600"}`}
                            >
                              {order.payment_status === "paid"
                                ? "Paid"
                                : "Unpaid (Collect at Counter)"}
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {order.status === "pending_review" && (
                            <Button
                              onClick={() => handleOpenProcessOrder(order)}
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs"
                            >
                              Review & Price
                            </Button>
                          )}

                          {order.status === "packaging" && (
                            <Button
                              onClick={() => handleMarkReadyForPickup(order)}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs flex items-center gap-1"
                            >
                              <PackageCheck className="h-3.5 w-3.5" /> Mark Ready for Pickup
                            </Button>
                          )}

                          {order.status === "ready_for_pickup" && (
                            <Button
                              onClick={() => handleMarkAsCompleted(order)}
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs flex items-center gap-1"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Mark Picked Up
                            </Button>
                          )}

                          {order.status === "ready_to_pay" && (
                            <span className="text-xs font-semibold text-orange-600 py-1.5 px-3 bg-orange-50 border border-orange-200 rounded-lg">
                              Awaiting Customer Payment
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Packaging Review Deck (5 cols) */}
                {activeProcessingOrder && (
                  <div className="xl:col-span-5 rounded-3xl border-2 border-emerald-600 bg-white p-6 shadow-xl space-y-6">
                    <div className="flex justify-between items-center border-b border-emerald-50 pb-3">
                      <h2 className="text-lg font-bold text-emerald-950 dark:text-white flex items-center gap-2">
                        Package & Invoice Order
                      </h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveProcessingOrder(null)}
                      >
                        Cancel
                      </Button>
                    </div>

                    <div className="text-xs text-emerald-900/60 dark:text-emerald-200/70 bg-emerald-50/30 border border-emerald-100/50 rounded-2xl p-4 space-y-2">
                      <p>
                        <strong>Customer:</strong> {activeProcessingOrder.user_email}
                      </p>
                      <p>
                        <strong>Address:</strong>{" "}
                        {activeProcessingOrder.user_address || "None specified"}
                      </p>
                      <p>
                        <strong>Customer Notes:</strong>{" "}
                        {activeProcessingOrder.notes || "None provided"}
                      </p>
                    </div>
                    {/* Add new items dynamically if prescription is uploaded */}
                    <div className="border border-emerald-100 rounded-2xl p-4 bg-emerald-50/20 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-950/60 dark:text-emerald-100/60">
                        Add Packaged Item
                      </h4>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Medicine Name (e.g. Paracetamol)"
                          className="h-9 border-emerald-100 rounded-lg text-xs flex-1 bg-white"
                          id="new-item-name"
                        />
                        <Input
                          type="number"
                          min={1}
                          defaultValue={1}
                          className="h-9 border-emerald-100 rounded-lg text-xs w-16 text-center bg-white"
                          id="new-item-qty"
                        />
                        <Button
                          onClick={() => {
                            const nameInput = document.getElementById(
                              "new-item-name",
                            ) as HTMLInputElement;
                            const qtyInput = document.getElementById(
                              "new-item-qty",
                            ) as HTMLInputElement;
                            if (nameInput && nameInput.value.trim()) {
                              const newItem = {
                                name: nameInput.value.trim(),
                                quantity: parseInt(qtyInput.value) || 1,
                                price: 0,
                                isCustom: true,
                              };
                              setProcessingItems([...processingItems, newItem]);
                              nameInput.value = "";
                              qtyInput.value = "1";
                            } else {
                              toast.error("Please enter a medicine name");
                            }
                          }}
                          className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shrink-0"
                        >
                          Add
                        </Button>
                      </div>
                    </div>

                    {/* Items Price Assignments */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-950/40 dark:text-emerald-100/40">
                        Assign Packaging Prices
                      </h3>
                      <div className="space-y-3">
                        {processingItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex gap-3 justify-between items-center py-2.5 border-b border-emerald-50"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-emerald-950 dark:text-white truncate flex items-center gap-1.5">
                                {item.name}
                                {item.isCustom && (
                                  <span className="bg-amber-100 border border-amber-200 px-1 py-0.5 rounded text-[8px] font-bold text-amber-700">
                                    Custom
                                  </span>
                                )}
                              </p>
                            </div>

                            <div className="flex gap-2 shrink-0 items-center">
                              {/* Quantity field */}
                              <div className="w-14">
                                <Input
                                  type="number"
                                  min={1}
                                  className="h-9 text-center p-1 border-emerald-100 rounded-lg text-xs"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    handleProcessingItemQtyChange(
                                      idx,
                                      parseInt(e.target.value) || 1,
                                    )
                                  }
                                />
                              </div>
                              {/* Price field */}
                              <div className="relative w-20">
                                <span className="absolute left-2 top-2.5 text-xs text-emerald-950/40 dark:text-emerald-100/40">
                                  ₹
                                </span>
                                <Input
                                  type="number"
                                  placeholder="Price"
                                  step="0.01"
                                  min="0"
                                  className="h-9 pl-4 pr-1 border-emerald-100 rounded-lg text-xs"
                                  value={item.price || ""}
                                  onChange={(e) =>
                                    handleProcessingItemPriceChange(
                                      idx,
                                      parseFloat(e.target.value) || 0,
                                    )
                                  }
                                />
                              </div>
                              {/* Delete item button */}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setProcessingItems(processingItems.filter((_, i) => i !== idx));
                                }}
                                className="h-8 w-8 text-emerald-900/50 dark:text-emerald-200/60 hover:text-red-500 rounded-lg"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Directions Notes */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="adminNotes"
                        className="text-xs font-bold text-emerald-950 dark:text-white"
                      >
                        Directions for Customer (Admin Notes)
                      </Label>
                      <Textarea
                        id="adminNotes"
                        placeholder="Write medicine dosage instruction (e.g. 1 capsule after breakfast)."
                        className="min-h-[80px] border-emerald-100 rounded-xl text-xs"
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                      />
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-emerald-50">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-bold text-emerald-950 dark:text-white">
                          Subtotal calculation
                        </span>
                        <span className="text-lg font-black text-emerald-700">
                          ₹
                          {processingItems
                            .reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0)
                            .toFixed(2)}
                        </span>
                      </div>

                      <Button
                        onClick={handleSubmitReview}
                        disabled={submittingReview}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold h-11"
                      >
                        {submittingReview ? "Processing..." : "Confirm Pricing & Send to Packaging"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Tab 2: Inventory Catalog */}
          <TabsContent value="inventory" className="space-y-6 outline-none">
            <div className="grid lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Medicines Catalog List (7 cols) */}
              <div className="lg:col-span-7 rounded-3xl border border-emerald-100 bg-white p-6 shadow-xl shadow-emerald-950/5">
                <h2 className="text-lg font-bold text-emerald-950 dark:text-white mb-4">
                  Active Stock Catalog
                </h2>

                {loadingInventory ? (
                  <div className="py-12 text-center text-emerald-900/60 dark:text-emerald-200/70 font-semibold">
                    Loading catalog...
                  </div>
                ) : medicines.length === 0 ? (
                  <div className="py-12 text-center text-emerald-900/50 dark:text-emerald-200/60">
                    Catalog is empty.
                  </div>
                ) : (
                  <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                    {medicines.map((med) => (
                      <div
                        key={med.id}
                        className="flex justify-between items-center p-3.5 rounded-2xl border border-emerald-50 bg-emerald-50/15 hover:bg-emerald-50/30 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                            <Pill className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-emerald-950 dark:text-white">
                              {med.name}
                            </p>
                            <p className="text-xs text-emerald-950/50 dark:text-emerald-100/50 mt-0.5">
                              {med.category} • stock: {med.stock}
                            </p>
                            {med.description && (
                              <p className="text-[10px] text-emerald-950/40 dark:text-emerald-100/40 mt-1 italic">
                                {med.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-extrabold text-emerald-950 dark:text-white">
                            ₹{med.price.toFixed(2)}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-emerald-900/40 dark:text-emerald-200/50 hover:text-red-500 rounded-lg"
                            onClick={() => handleDeleteMedicine(med.id)}
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Add Medicine form (5 cols) */}
              <div className="lg:col-span-5 rounded-3xl border border-emerald-100 bg-white p-6 shadow-xl shadow-emerald-950/5">
                <h2 className="text-lg font-bold text-emerald-950 dark:text-white border-b border-emerald-50 pb-3 mb-4">
                  Add Medicine
                </h2>

                <form onSubmit={handleAddMedicine} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="medName"
                      className="text-xs font-bold text-emerald-950 dark:text-white"
                    >
                      Medicine Name
                    </Label>
                    <Input
                      id="medName"
                      placeholder="e.g. Paracetamol 500mg"
                      required
                      className="border-emerald-100 rounded-xl"
                      value={newMedName}
                      onChange={(e) => setNewMedName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="medDesc"
                      className="text-xs font-bold text-emerald-950 dark:text-white"
                    >
                      Description
                    </Label>
                    <Textarea
                      id="medDesc"
                      placeholder="Brief details about the drug..."
                      className="border-emerald-100 rounded-xl text-xs"
                      value={newMedDesc}
                      onChange={(e) => setNewMedDesc(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="medPrice"
                        className="text-xs font-bold text-emerald-950 dark:text-white"
                      >
                        Price (₹)
                      </Label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2.5 text-xs text-emerald-950/40 dark:text-emerald-100/40">
                          ₹
                        </span>
                        <Input
                          id="medPrice"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          required
                          className="pl-6 border-emerald-100 rounded-xl"
                          value={newMedPrice}
                          onChange={(e) => setNewMedPrice(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="medStock"
                        className="text-xs font-bold text-emerald-950 dark:text-white"
                      >
                        Initial Stock
                      </Label>
                      <Input
                        id="medStock"
                        type="number"
                        min="0"
                        placeholder="0"
                        className="border-emerald-100 rounded-xl text-center"
                        value={newMedStock}
                        onChange={(e) => setNewMedStock(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="medCat"
                      className="text-xs font-bold text-emerald-950 dark:text-white"
                    >
                      Category
                    </Label>
                    <select
                      id="medCat"
                      className="w-full h-10 px-3 border border-emerald-100 rounded-xl bg-white text-sm focus-visible:outline-emerald-500 focus-visible:ring-emerald-500"
                      value={newMedCategory}
                      onChange={(e) => setNewMedCategory(e.target.value)}
                    >
                      <option value="Wellness">Wellness</option>
                      <option value="Analgesics">Analgesics</option>
                      <option value="Antibiotics">Antibiotics</option>
                      <option value="Antidiabetics">Antidiabetics</option>
                      <option value="Cardiovascular">Cardiovascular</option>
                      <option value="Antihistamines">Antihistamines</option>
                      <option value="Gastrointestinal">Gastrointestinal</option>
                    </select>
                  </div>

                  <Button
                    type="submit"
                    disabled={addingMed || !newMedName || !newMedPrice}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold h-11 transition flex items-center justify-center gap-1.5 mt-2"
                  >
                    <Plus className="h-4.5 w-4.5" /> Add Medicine
                  </Button>
                </form>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <SiteFooter />
    </div>
  );
}
