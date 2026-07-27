import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/components/clerk-provider";
import { toast } from "sonner";

export function useLiveNotifications() {
  const { user, isSignedIn } = useUser();

  useEffect(() => {
    if (!isSignedIn || !user) return;

    // Request Notification permission
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            console.log("Notification permission granted.");
          }
        });
      }
    }

    const showNotification = (title: string, body: string, orderId: string) => {
      // Show Sonner toast inside the app
      toast.success(`${title}: ${body}`, {
        duration: 10000,
        action: {
          label: "View",
          onClick: () => {
            if (user.role === "admin") {
              window.location.href = "/admin";
            } else {
              window.location.href = "/my-orders";
            }
          }
        }
      });

      // Show Browser Chrome Notification
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        try {
          const notification = new Notification(title, {
            body,
            icon: "/favicon.ico",
            tag: `order-${orderId}`,
          });

          notification.onclick = () => {
            window.focus();
            if (user.role === "admin") {
              window.location.href = "/admin";
            } else {
              window.location.href = "/my-orders";
            }
            notification.close();
          };
        } catch (err) {
          console.error("Failed to trigger browser notification:", err);
        }
      }
    };

    // Handle mock DB window events (offline fallback mode)
    const handleMockDbUpdate = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail?.table === "orders") {
        // For admin: new order toast
        if (user.role === "admin") {
          // Get latest order from localStorage
          try {
            const orders = JSON.parse(localStorage.getItem("taj_mock_db_orders") || "[]");
            if (orders.length > 0) {
              const latest = orders[0];
              if (latest && latest.status === "pending_review") {
                // Only notify for very recent orders (within last 5 seconds)
                const orderAge = Date.now() - new Date(latest.created_at).getTime();
                if (orderAge < 5000) {
                  showNotification(
                    "New Order Received! 🔔",
                    `Order #${latest.id.slice(0, 8)} from ${latest.user_email} is pending review.`,
                    latest.id
                  );
                }
              }
            }
          } catch {}
        }
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("taj_mock_db_update", handleMockDbUpdate);
    }

    // Subscribe to Supabase Realtime changes (for when real DB is connected)
    const channel = supabase
      .channel("orders-live-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        (payload: any) => {
          console.log("Realtime order payload received:", payload);
          const newOrder = payload.new as any;
          const oldOrder = payload.old as any;

          // 1. Admin Notifications (Listen to new order insertions)
          if (user.role === "admin" && payload.eventType === "INSERT") {
            showNotification(
              "New Order Received! 🔔",
              `Order #${newOrder.id.slice(0, 8)} from ${newOrder.user_email} is pending review.`,
              newOrder.id
            );
          }

          // 2. Customer Notifications (Listen to status updates on own orders)
          if (user.role === "customer" && payload.eventType === "UPDATE") {
            // Check if this update is for the logged in customer
            if (newOrder.user_id === user.id) {
              const statusChanged = oldOrder && oldOrder.status !== newOrder.status;
              const paymentChanged = oldOrder && oldOrder.payment_status !== newOrder.payment_status;

              if (statusChanged && newOrder.status === "ready_for_pickup") {
                showNotification(
                  "Order Ready for Pickup! 🎉",
                  `Your medicines are packaged and ready at the counter. Total: ₹${newOrder.total_price.toFixed(2)}. Pickup code: ${newOrder.id.slice(0, 5).toUpperCase()}`,
                  newOrder.id
                );
              } else if (statusChanged && newOrder.status === "completed") {
                showNotification(
                  "Order Completed & Picked Up! ✅",
                  `Thank you! Your order #${newOrder.id.slice(0, 5).toUpperCase()} has been marked as picked up. Visit us again!`,
                  newOrder.id
                );
              } else if (paymentChanged && newOrder.payment_status === "paid") {
                showNotification(
                  "Payment Confirmed! 💚",
                  `We received your payment of ₹${newOrder.total_price.toFixed(2)} for order #${newOrder.id.slice(0, 5).toUpperCase()}.`,
                  newOrder.id
                );
              }
            }
          }
        }
      )
      .subscribe((status: any) => {
        console.log("Supabase Realtime subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
      if (typeof window !== "undefined") {
        window.removeEventListener("taj_mock_db_update", handleMockDbUpdate);
      }
    };
  }, [user, isSignedIn]);
}
