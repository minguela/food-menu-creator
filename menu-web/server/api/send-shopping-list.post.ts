import { createClient } from "@supabase/supabase-js";
import { logError } from "~/utils/log-error";
import { buildShoppingListText } from "~/utils/shopping-conversions.js";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  try {
    const body = await readBody<{
      userId: string;
      phoneNumber: string;
      channel?: "sms" | "whatsapp";
    }>(event);

    if (!body.userId || !body.phoneNumber) {
      throw createError({
        statusCode: 400,
        statusMessage: "userId y phoneNumber son obligatorios.",
      });
    }

    const supabase = createClient(
      config.public.supabaseUrl,
      config.supabaseServiceKey || config.public.supabaseAnonKey,
    );

    const { data: items, error: listError } = await supabase
      .from("shopping_lists")
      .select("*, ingredients(name)")
      .eq("user_id", body.userId)
      .order("created_at", { ascending: false })
      .limit(120);

    if (listError) {
      throw createError({ statusCode: 500, statusMessage: listError.message });
    }

    const text = `Lista de la compra\n\n${buildShoppingListText(items || [])}`;
    const channel = body.channel || "sms";

    await supabase
      .from("users")
      .update({ phone_number: body.phoneNumber, mobile_channel: channel })
      .eq("id", body.userId);

    if (!config.twilioAccountSid || !config.twilioAuthToken) {
      await markSendStatus(
        supabase,
        body.userId,
        "error",
        "Twilio no está configurado en el servidor.",
      );
      throw createError({
        statusCode: 503,
        statusMessage: "Twilio no está configurado en el servidor.",
      });
    }

    const from =
      channel === "whatsapp"
        ? config.twilioWhatsAppFrom || config.twilioFromNumber
        : config.twilioFromNumber;

    if (!from) {
      await markSendStatus(
        supabase,
        body.userId,
        "error",
        "Falta el número emisor.",
      );
      throw createError({
        statusCode: 503,
        statusMessage: "Falta el número emisor.",
      });
    }

    const to =
      channel === "whatsapp" && !body.phoneNumber.startsWith("whatsapp:")
        ? `whatsapp:${body.phoneNumber}`
        : body.phoneNumber;
    const fromAddress =
      channel === "whatsapp" && !from.startsWith("whatsapp:")
        ? `whatsapp:${from}`
        : from;

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${config.twilioAccountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${config.twilioAccountSid}:${config.twilioAuthToken}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: to,
          From: fromAddress,
          Body: text,
        }),
      },
    );

    const payload = await response.json();

    if (!response.ok) {
      const message = payload?.message || "Error enviando mensaje.";
      await markSendStatus(supabase, body.userId, "error", message);
      throw createError({
        statusCode: response.status,
        statusMessage: message,
      });
    }

    const status = payload.status === "delivered" ? "delivered" : "sent";
    await markSendStatus(supabase, body.userId, status, null);

    return {
      ok: true,
      providerStatus: payload.status,
      status,
      sid: payload.sid,
    };
  } catch (error: any) {
    await logError("web", error, {
      context: "api.send-shopping-list",
      config,
    });
    throw error;
  }
});

async function markSendStatus(
  supabase: any,
  userId: string,
  status: string,
  error: string | null,
) {
  await supabase
    .from("shopping_lists")
    .update({ send_status: status, send_error: error })
    .eq("user_id", userId);
}
