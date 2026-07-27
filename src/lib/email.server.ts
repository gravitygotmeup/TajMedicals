import { createServerFn } from "@tanstack/react-start";
import nodemailer from "nodemailer";

const GMAIL_USER = process.env.GMAIL_USER || "hellotajmedicals@gmail.com";
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

function getTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
  });
}

async function sendMail(to: string, subject: string, html: string) {
  console.log("=========================================");
  console.log(`[Email] To: ${to}`);
  console.log(`[Email] Subject: ${subject}`);
  console.log(`[Email] Content: ${html.replace(/<[^>]*>/g, " ")}`);
  console.log("=========================================");

  if (!GMAIL_APP_PASSWORD) {
    console.log("[Email] No GMAIL_APP_PASSWORD set. Add to .env to send real emails.");
    console.log("[Email] Get one at: https://myaccount.google.com/apppasswords");
    return { success: true, simulated: true };
  }

  try {
    const info = await getTransporter().sendMail({
      from: `"Taj Medicals" <${GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log("[Email] Sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("[Email] Failed:", err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export const sendNotificationEmail = createServerFn({ method: "POST" })
  .validator((d: { to: string; subject: string; html: string }) => d)
  .handler(async ({ data }) => {
    return sendMail(data.to, data.subject, data.html);
  });

export const sendAdminNewOrderEmail = createServerFn({ method: "POST" })
  .validator((d: { orderId: string; customerEmail: string; notes?: string }) => d)
  .handler(async ({ data }) => {
    const cleanId = data.orderId.replace("mock_", "");
    const adminEmail = process.env.ADMIN_EMAIL || "hellotajmedicals@gmail.com";
    const subject = `[Taj Medicals] New Order Request #${cleanId.slice(0, 8)}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #059669; border-bottom: 2px solid #10b981; padding-bottom: 10px;">New Medicine Order Request</h2>
        <p><strong>Order ID:</strong> ${cleanId.slice(0, 8)}</p>
        <p><strong>Customer Email:</strong> ${data.customerEmail}</p>
        <p><strong>Customer Notes:</strong> ${data.notes || "None provided"}</p>
        <div style="margin-top: 20px;">
          <a href="${process.env.APP_URL || "http://localhost:3000"}/admin" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Review Order in Admin Dashboard</a>
        </div>
      </div>
    `;
    return sendMail(adminEmail, subject, html);
  });

export const sendCustomerPackagingEmail = createServerFn({ method: "POST" })
  .validator((d: { orderId: string; customerEmail: string; totalPrice: number }) => d)
  .handler(async ({ data }) => {
    const cleanId = data.orderId.replace("mock_", "");
    const subject = `[Taj Medicals] Ready for Pickup! Order #${cleanId.slice(0, 8)}`;
    const checkoutUrl = `${process.env.APP_URL || "http://localhost:3000"}/payment/${data.orderId}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #059669; border-bottom: 2px solid #10b981; padding-bottom: 10px;">Your Package is Ready</h2>
        <p>Good news! Our pharmacist has reviewed and packaged your medicines.</p>
        <p><strong>Order ID:</strong> ${cleanId.slice(0, 8)}</p>
        <p><strong>Total Amount:</strong> ₹${data.totalPrice.toFixed(2)}</p>
        <p>You can pay online via UPI QR code or pay at the counter during pickup.</p>
        <p><strong>Pickup Code:</strong> ${cleanId.slice(0, 5).toUpperCase()}</p>
        <p><strong>Pickup Address:</strong> Beside Praveen Hardware, Arya Nagar, Koradi Naka, Nagpur. Phone: 9869782706</p>
        <div style="margin-top: 20px;">
          <a href="${checkoutUrl}" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Receipt & UPI QR Code</a>
        </div>
      </div>
    `;
    return sendMail(data.customerEmail, subject, html);
  });

export const sendCustomerPaymentConfirmedEmail = createServerFn({ method: "POST" })
  .validator((d: { orderId: string; customerEmail: string; totalPrice: number }) => d)
  .handler(async ({ data }) => {
    const cleanId = data.orderId.replace("mock_", "");
    const subject = `[Taj Medicals] Payment Confirmed for Order #${cleanId.slice(0, 8)}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #059669; border-bottom: 2px solid #10b981; padding-bottom: 10px;">Payment Received!</h2>
        <p>We have successfully received your payment of <strong>₹${data.totalPrice.toFixed(2)}</strong> for order <strong>#${cleanId.slice(0, 8)}</strong>.</p>
        <p>Your medicines are packed and ready for pickup at our counter.</p>
        <p><strong>Pickup Code:</strong> ${cleanId.slice(0, 5).toUpperCase()}</p>
        <p><strong>Address:</strong> Beside Praveen Hardware, Arya Nagar, Koradi Naka, Nagpur</p>
        <p><strong>Phone:</strong> 9869782706</p>
        <p>Thank you for choosing Taj Medicals!</p>
      </div>
    `;
    return sendMail(data.customerEmail, subject, html);
  });
