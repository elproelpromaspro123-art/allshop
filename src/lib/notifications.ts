import { supabaseAdmin, isSupabaseAdminConfigured } from "./supabase-admin";
import type { OrderStatus } from "@/types/database";
import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { readEnvValue } from "@/lib/env";
import {
  buildOrderHistoryAccessEmailMessage,
  buildOrderStatusEmailMessage,
  type NotificationOrderRecord,
} from "./notifications/order-emails";

const smtpUser = readEnvValue("SMTP_USER");
const smtpPass = readEnvValue("SMTP_PASSWORD");
const emailFrom = readEnvValue("EMAIL_FROM") || "Vortixy <vortixyoficial@gmail.com>";

export function isEmailConfigured(): boolean {
  return Boolean(smtpUser && smtpPass);
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
} as SMTPTransport.Options);

export {
  buildOrderHistoryAccessEmailMessage,
  buildOrderStatusEmailMessage,
} from "./notifications/order-emails";

export async function notifyOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<void> {
  if (!isSupabaseAdminConfigured) return;

  const { data: order } = (await supabaseAdmin
    .from("orders")
    .select("id,customer_name,customer_email,total,status,notes,items")
    .eq("id", orderId)
    .maybeSingle()) as {
    data: NotificationOrderRecord | null;
  };

  if (!order) return;

  const message = buildOrderStatusEmailMessage(order, status);

  if (order.customer_email) {
    await sendEmail(order.customer_email, message.subject, message.html, message.text);
  }
}

export async function sendOrderHistoryAccessEmail(input: {
  email: string;
  link: string;
}): Promise<void> {
  if (!isEmailConfigured()) return;

  const safeEmail = String(input.email || "")
    .trim()
    .toLowerCase();
  const safeLink = String(input.link || "").trim();
  if (!safeEmail || !safeLink) return;

  const message = buildOrderHistoryAccessEmailMessage({
    email: safeEmail,
    link: safeLink,
  });

  await sendEmail(safeEmail, message.subject, message.html, message.text);
}

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string,
): Promise<void> {
  if (!isEmailConfigured()) {
    throw new Error("SMTP credentials not configured.");
  }

  try {
    const info = await transporter.sendMail({
      from: emailFrom,
      to,
      subject,
      text,
      html,
    });
    console.log("Email sent: %s", info.messageId);
  } catch (error) {
    console.error("Nodemailer error:", error);
    throw new Error(`Email sending failed: ${error}`);
  }
}
