import emailjs from "@emailjs/browser";

const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;

let initialized = false;

function init() {
  if (!initialized && PUBLIC_KEY) {
    emailjs.init(PUBLIC_KEY);
    initialized = true;
  }
}

type EmailParams = Record<string, unknown>;

export async function sendEmail(templateId: string, params: EmailParams) {
  init();

  if (!PUBLIC_KEY || !SERVICE_ID) {
    console.log("=========================================");
    console.log("[EmailJS] Simulation mode");
    console.log(`Template: ${templateId}`);
    console.log(`Params:`, JSON.stringify(params, null, 2));
    console.log("=========================================");
    console.log("[EmailJS] Set VITE_EMAILJS_PUBLIC_KEY and VITE_EMAILJS_SERVICE_ID in .env to send real emails.");
    return { success: true, simulated: true };
  }

  try {
    const response = await emailjs.send(SERVICE_ID, templateId, params);
    console.log("[EmailJS] Sent successfully:", response.status, response.text);
    return { success: true };
  } catch (err) {
    console.error("[EmailJS] Failed:", err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function sendAdminNewOrderEmailClient(params: {
  orderId: string;
  customerEmail: string;
  notes?: string;
}) {
  return sendEmail("template_admin_new_order", {
    order_id: params.orderId.slice(0, 8),
    customer_email: params.customerEmail,
    customer_notes: params.notes || "None",
    admin_link: `${window.location.origin}/admin`,
  });
}

export async function sendCustomerPickupReadyClient(params: {
  orderId: string;
  customerEmail: string;
  totalPrice: number;
}) {
  return sendEmail("template_customer_pickup_ready", {
    order_id: params.orderId.slice(0, 8),
    customer_email: params.customerEmail,
    total_price: params.totalPrice.toFixed(2),
    pickup_code: params.orderId.slice(0, 5).toUpperCase(),
    store_address: "Beside Praveen Hardware, Arya Nagar, Koradi Naka, Nagpur",
    store_phone: "9869782706",
    payment_link: `${window.location.origin}/payment/${params.orderId}`,
  });
}

export async function sendCustomerPaymentConfirmedClient(params: {
  orderId: string;
  customerEmail: string;
  totalPrice: number;
}) {
  return sendEmail("template_customer_payment_confirmed", {
    order_id: params.orderId.slice(0, 8),
    customer_email: params.customerEmail,
    total_price: params.totalPrice.toFixed(2),
    pickup_code: params.orderId.slice(0, 5).toUpperCase(),
    store_address: "Beside Praveen Hardware, Arya Nagar, Koradi Naka, Nagpur",
    store_phone: "9869782706",
  });
}
