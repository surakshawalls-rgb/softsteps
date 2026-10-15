import { createClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@^9";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isValidEmail(value: string): boolean {
  return value.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function htmlFromPlainText(value: string): string {
  return escapeHtml(value).replace(/\r\n|\r|\n/g, "<br>");
}

const smtpHost = Deno.env.get("HOSTINGER_SMTP_HOST") ?? "smtp.hostinger.com";
const smtpPort = Number(Deno.env.get("HOSTINGER_SMTP_PORT") ?? "465");
const smtpUser = Deno.env.get("HOSTINGER_SMTP_USER");
const smtpPassword = Deno.env.get("HOSTINGER_SMTP_PASSWORD");
const fromEmail = Deno.env.get("HOSTINGER_SMTP_FROM_EMAIL") ?? "info@softstepscarpets.com";
const fromName = Deno.env.get("HOSTINGER_SMTP_FROM_NAME") ?? "Soft Steps Carpets";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, message: "Method not allowed." }, 405);
  }

  const authorization = req.headers.get("Authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!token) {
    return jsonResponse({ success: false, message: "Please sign in as an admin before sending email." }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error("Required Supabase environment configuration is missing.");
    return jsonResponse({ success: false, message: "Email service is not configured correctly." }, 500);
  }

  try {
    // Verify the supplied access token with Supabase Auth.
    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userResult, error: authError } = await authClient.auth.getUser(token);

    if (authError || !userResult.user) {
      return jsonResponse({ success: false, message: "Your session is invalid or expired. Please sign in again." }, 401);
    }

    // Check admin membership independently on the server.
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: adminRow, error: adminError } = await adminClient
      .from("admin_users")
      .select("user_id")
      .eq("user_id", userResult.user.id)
      .maybeSingle();

    if (adminError) {
      console.error("Admin membership verification failed.");
      return jsonResponse({ success: false, message: "Unable to verify admin access right now." }, 500);
    }

    if (!adminRow) {
      return jsonResponse({ success: false, message: "You do not have permission to send admin emails." }, 403);
    }

    let payload: unknown;
    const contentLength = Number(req.headers.get("content-length") ?? "0");
    if (contentLength > 100_000) {
      return jsonResponse({ success: false, message: "Email request is too large." }, 413);
    }

    try {
      payload = await req.json();
    } catch {
      return jsonResponse({ success: false, message: "Invalid JSON request." }, 400);
    }

    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return jsonResponse({ success: false, message: "Invalid email request." }, 400);
    }

    const input = payload as Record<string, unknown>;
    const to = typeof input["to"] === "string" ? input["to"].trim() : "";
    const subject = typeof input["subject"] === "string" ? input["subject"].trim() : "";
    const body = typeof input["body"] === "string" ? input["body"].trim() : "";

    if (!isValidEmail(to)) {
      return jsonResponse({ success: false, message: "Please provide a valid recipient email address." }, 400);
    }
    if (!subject || subject.length > 200 || /[\r\n]/.test(subject)) {
      return jsonResponse({ success: false, message: "Subject is required and must be 200 characters or fewer." }, 400);
    }
    if (!body || body.length > 30_000) {
      return jsonResponse({ success: false, message: "Message is required and must be 30,000 characters or fewer." }, 400);
    }

    if (!smtpUser || !smtpPassword || !fromEmail) {
      console.error("Hostinger SMTP secrets are missing.");
      return jsonResponse({
        success: false,
        configured: false,
        message: "Hostinger email delivery is not configured. Set the HOSTINGER_SMTP secrets in Supabase and try again.",
      }, 503);
    }

    if (smtpPort !== 465) {
      return jsonResponse({
        success: false,
        configured: false,
        message: "This function is configured for Hostinger SSL/TLS on port 465. Set HOSTINGER_SMTP_PORT to 465.",
      }, 503);
    }

    const transport = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: true,
      auth: { user: smtpUser, pass: smtpPassword },
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
      socketTimeout: 20_000,
    });

    const safeSubject = subject;
    const safeBody = body;
    const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.65;color:#222">${htmlFromPlainText(safeBody)}</div>`;

    const result = await transport.sendMail({
      from: { name: fromName, address: fromEmail },
      to,
      replyTo: fromEmail,
      subject: safeSubject,
      text: safeBody,
      html,
    });

    // SMTP acceptance means queued/accepted by the mail server, not guaranteed inbox delivery.
    return jsonResponse({
      success: true,
      configured: true,
      message: "Email accepted by the Hostinger mail server. Final inbox delivery is not guaranteed.",
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown SMTP error";
    // Do not log payloads, credentials, tokens, or stack traces.
    console.error("send-admin-email failed:", message.slice(0, 300));
    if (/auth|credentials|username|password/i.test(message)) {
      return jsonResponse({ success: false, configured: true, message: "Hostinger SMTP authentication failed. Verify the mailbox username and password in Supabase secrets." }, 502);
    }
    return jsonResponse({ success: false, configured: true, message: "The email could not be sent through Hostinger. Check the SMTP settings and Supabase Function logs." }, 502);
  }
});
