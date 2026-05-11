import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

async function sendPhoto(chatId: number, photoUrl: string, caption?: string) {
  await fetch(`${TELEGRAM_API}/sendPhoto`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, photo: photoUrl, caption }),
  });
}

async function sendMessage(chatId: number, text: string) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });
}

async function sendDocument(chatId: number, document: string, filename: string) {
  const formData = new FormData();
  formData.append("chat_id", chatId.toString());
  formData.append("document", document, filename);
  await fetch(`${TELEGRAM_API}/sendDocument`, {
    method: "POST",
    body: formData,
  });
}

serve(async (req: Request) => {
  try {
    const update = await req.json();
    console.log("Telegram update:", update);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Notificación interna desde la web.
    if (update.type === "web_notification" && update.chat_id && update.message) {
      await sendMessage(update.chat_id, update.message);
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    // Manejar comando /start
    if (update.message?.text === "/start") {
      const chatId = update.message.chat.id;
      const userId = update.message.from?.id;
      const username = update.message.from?.username;

      await supabase.from("users").upsert({
        telegram_id: userId,
        telegram_chat_id: chatId,
      });

      await sendMessage(chatId,
        `¡Hola${username ? ` @${username}` : ""}! 👋

Soy tu bot de planificación de menús.

*Comandos disponibles:*
/menu - Subir imagen de menú
/status - Ver estado de procesamiento
/monthly - Generar menú del mes
/shopping - Ver lista de la compra

¡Empieza enviándome una foto de tu menú!`
      );

      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    // Manejar comando /menu
    if (update.message?.text === "/menu") {
      const chatId = update.message.chat.id;
      await sendMessage(chatId,
        `📸 *Subir menú*

Envíame una foto de tu menú y luego responde con:
*comida - día 1* o *cena - día 15*

Ejemplos:
• "comida - día 1"
• "cena - día 12"

*Tienes 21 días disponibles (1-21)*`
      );
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    // Manejar comando /monthly
    if (update.message?.text === "/monthly") {
      const chatId = update.message.chat.id;
      const telegramId = update.message.from?.id;

      const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("telegram_id", telegramId)
        .single();

      if (!user) {
        await sendMessage(chatId, "No te encuentro. Usa /start primero.");
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      // Generar menú del mes actual
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      await sendMessage(chatId, `⏳ Generando menú para ${month}/${year}...

Esto puede tardar unos segundos.`);

      const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-monthly-menu`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ user_id: user.id, month, year }),
      });

      const result = await response.json();

      if (result.success) {
        await sendMessage(chatId,
          `✅ *Menú generado*

📅 Días: ${result.plans_count}
🛒 Ingredientes: ${result.shopping_items}
💰 Total estimado: ${result.total_cost.toFixed(2)}€

Usa /shopping para ver la lista.`
        );
      } else {
        await sendMessage(chatId, `❌ Error: ${result.error}`);
      }

      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    // Manejar comando /shopping
    if (update.message?.text === "/shopping") {
      const chatId = update.message.chat.id;
      const telegramId = update.message.from?.id;

      const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("telegram_id", telegramId)
        .single();

      if (!user) {
        await sendMessage(chatId, "No te encuentro. Usa /start primero.");
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      const { data: items } = await supabase
        .from("shopping_lists")
        .select("ingredients(name, carrefour_category), quantity_needed, estimated_price, purchased")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!items || items.length === 0) {
        await sendMessage(chatId, "🛒 No hay lista de la compra generada.\n\nUsa /monthly para generar un menú.");
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      const total = items.reduce((sum, i) => sum + (i.estimated_price || 0), 0);

      const byCategory = items.reduce((acc, item) => {
        const cat = item.ingredients?.carrefour_category || "Otros";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
      }, {});

      let message = "🛒 *Lista de la compra*\n\n";
      for (const [category, catItems] of Object.entries(byCategory)) {
        message += `*${category}*\n`;
        for (const item of catItems) {
          const qty = item.quantity_needed >= 1000
            ? `${(item.quantity_needed / 1000).toFixed(2)} kg`
            : `${item.quantity_needed.toFixed(0)} g`;
          message += `• ${item.ingredients?.name || "Desconocido"} - ${qty}\n`;
        }
        message += "\n";
      }
      message += `💰 *Total: ${total.toFixed(2)}€*`;

      await sendMessage(chatId, message);
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    // Manejar comando /shopping export
    if (update.message?.text?.startsWith("/shopping export")) {
      const chatId = update.message.chat.id;
      const telegramId = update.message.from?.id;
      const parts = update.message.text.split(" ");
      const exportFormat = parts[2];

      const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("telegram_id", telegramId)
        .single();

      if (!user) {
        await sendMessage(chatId, "No te encuentro. Usa /start primero.");
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (!exportFormat) {
        await fetch(`${TELEGRAM_API}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: "Selecciona el formato de exportación:",
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "📝 Texto", callback_data: `export_text_${user.id}` },
                  { text: "📊 CSV", callback_data: `export_csv_${user.id}` }
                ]
              ]
            }
          })
        });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      await sendMessage(chatId, "⏳ Exportando lista de la compra...");

      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const format = exportFormat === "csv" ? "csv" : "text";
        const response = await fetch(
          `${supabaseUrl}/functions/v1/export-shopping-list?user_id=${user.id}&format=${format}`
        );
        const content = await response.text();

        if (format === "csv") {
          await sendDocument(chatId, content, "shopping-list.csv");
          await sendMessage(chatId, "✅ Lista exportada como CSV");
        } else {
          await sendMessage(chatId, `🛒 *Lista de la compra*\n\n${content}`);
        }
      } catch (err) {
        console.error("Export error:", err);
        await sendMessage(chatId, "❌ Error al exportar la lista");
      }

      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    // Manejar callback queries de export
    if (update.callback_query) {
      const callbackData = update.callback_query.data;
      const chatId = update.callback_query.message?.chat.id;
      const messageId = update.callback_query.message?.message_id;

      if (callbackData?.startsWith("export_") && chatId) {
        const parts = callbackData.split("_");
        const format = parts[1];
        const userId = parts[2];

        if (chatId && messageId) {
          await fetch(`${TELEGRAM_API}/editMessageText`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              message_id: messageId,
              text: "⏳ Exportando lista de la compra..."
            })
          });
        }

        try {
          const supabaseUrl = Deno.env.get("SUPABASE_URL");
          const response = await fetch(
            `${supabaseUrl}/functions/v1/export-shopping-list?user_id=${userId}&format=${format}`
          );
          const content = await response.text();

          if (format === "csv") {
            await sendDocument(chatId!, content, "shopping-list.csv");
            if (chatId && messageId) {
              await fetch(`${TELEGRAM_API}/editMessageText`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chat_id: chatId,
                  message_id: messageId,
                  text: "✅ Lista exportada como CSV"
                })
              });
            }
          } else {
            if (chatId && messageId) {
              await fetch(`${TELEGRAM_API}/editMessageText`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chat_id: chatId,
                  message_id: messageId,
                  text: `🛒 *Lista de la compra*\n\n${content}`
                })
              });
            }
          }
        } catch (err) {
          console.error("Export callback error:", err);
          if (chatId && messageId) {
            await fetch(`${TELEGRAM_API}/editMessageText`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: chatId,
                message_id: messageId,
                text: "❌ Error al exportar la lista"
              })
            });
          }
        }

        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
    }

    // Manejar comando /semanal
    if (update.message?.text?.startsWith("/semanal")) {
      const chatId = update.message.chat.id;
      const telegramId = update.message.from?.id;

      const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("telegram_id", telegramId)
        .single();

      if (!user) {
        await sendMessage(chatId, "No te encuentro. Usa /start primero.");
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      const args = update.message.text.split(" ");
      const accion = args[1];

      if (!accion || accion === "help") {
        await sendMessage(chatId,
          `*📅 Menús Semanales*

*Comandos:*
/semanal nuevo [nombre] - Crear nuevo menú
/semanal lista - Ver menús guardados
/semanal info [nº] - Ver menú específico
/semanal compuestos - Ver días compuestos disponibles

*Para añadir platos:*
1. Crea el menú: /semanal nuevo Semana1
2. Envía foto del plato
3. Responde: día 1 comida o día 3 cena
4. Repite para los 14 platos (7 días × 2 comidas)
5. Cuando esté completo: /semanal cerrar

*Usar día compuestos:*
Responde: día 1 comida compuesto [nº]`
        );
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (accion === "nuevo") {
        const nombre = args.slice(2).join(" ") || `Semana ${Date.now()}`;

        // Obtener siguiente week_number
        const { data: existing } = await supabase
          .from("weekly_menus")
          .select("week_number")
          .eq("user_id", user.id)
          .order("week_number", { ascending: false })
          .limit(1);

        const nextWeek = (existing?.[0]?.week_number || 0) + 1;

        const { data: newMenu, error } = await supabase
          .from("weekly_menus")
          .insert({ user_id: user.id, name: nombre, week_number: nextWeek })
          .select()
          .single();

        if (error) {
          await sendMessage(chatId, `❌ Error: ${error.message}`);
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }

        // Guardar en sesión temporal (usando metadata del usuario)
        await supabase
          .from("users")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", user.id);

        await sendMessage(chatId,
          `✅ *Menú "${nombre}" creado*

Ahora envíame fotos de los platos.
Para cada foto, responde con:
*día X comida* o *día X cena*

Ejemplos:
• "día 1 comida"
• "día 3 cena"

Cuando tengas los 14 platos, el menú estará completo.`
        );
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (accion === "lista") {
        const { data: menus } = await supabase
          .from("weekly_menus")
          .select(`
            id,
            name,
            week_number,
            created_at,
            meals_count:weekly_meals(count)
          `)
          .eq("user_id", user.id)
          .order("week_number", { ascending: true });

        if (!menus || menus.length === 0) {
          await sendMessage(chatId, "📅 No tienes menús semanales guardados.\n\nUsa /semanal nuevo para crear uno.");
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }

        let message = "📅 *Tus menús semanales:*\n\n";
        for (const menu of menus) {
          const mealsCount = menu.meals_count?.[0]?.count || 0;
          const status = mealsCount >= 14 ? "✅" : "⏳";
          message += `${status} *${menu.name}* (Semana ${menu.week_number})\n`;
          message += `   ${mealsCount}/14 platos\n`;
        }

        await sendMessage(chatId, message);
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (accion === "info") {
        const num = parseInt(args[2]);
        if (!num) {
          await sendMessage(chatId, "Usa: /semanal info [nº semana]");
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }

        const { data: menu } = await supabase
          .from("weekly_menus")
          .select("id, name, week_number")
          .eq("user_id", user.id)
          .eq("week_number", num)
          .single();

        if (!menu) {
          await sendMessage(chatId, `No encuentro la semana ${num}`);
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }

        const { data: meals } = await supabase
          .from("weekly_meals")
          .select("day_number, meal_type, dish_name")
          .eq("weekly_menu_id", menu.id)
          .order("day_number", { ascending: true })
          .order("meal_type", { ascending: false });

        let message = `📅 *${menu.name}* (Semana ${menu.week_number})\n\n`;

        for (let day = 1; day <= 7; day++) {
          const dayMeals = meals?.filter(m => m.day_number === day) || [];
          const comida = dayMeals.find(m => m.meal_type === "comida");
          const cena = dayMeals.find(m => m.meal_type === "cena");

          message += `*Día ${day}:*\n`;
          message += `🍽️ Comida: ${comida?.dish_name || "—"}\n`;
          message += `🌙 Cena: ${cena?.dish_name || "—"}\n\n`;
        }

        await sendMessage(chatId, message);
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (accion === "compuestos") {
        const { data: compoundDays } = await supabase
          .from("compound_day_meals")
          .select(`
            id,
            name,
            first_dish:dishes!compound_day_meals_first_dish_id_fkey(name),
            second_dish:dishes!compound_day_meals_second_dish_id_fkey(name)
          `)
          .eq("user_id", user.id)
          .order("name", { ascending: true });

        if (!compoundDays || compoundDays.length === 0) {
          await sendMessage(chatId, "📅 No tienes días compuestos.\n\nCrea uno desde la web en la página del menú.");
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }

        let message = "📅 *Tus días compuestos:*\n\n";
        for (const cd of compoundDays) {
          message += `*${cd.name}*\n`;
          message += `  1º: ${cd.first_dish?.name || "—"}\n`;
          message += `  2º: ${cd.second_dish?.name || "—"}\n\n`;
        }

        await sendMessage(chatId, message);
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    // Manejar comando /generar_menu
    if (update.message?.text?.startsWith("/generar")) {
      const chatId = update.message.chat.id;
      const telegramId = update.message.from?.id;
      const args = update.message.text.split(" ");
      const days = parseInt(args[1]) || 7;

      if (days < 1 || days > 90) {
        await sendMessage(chatId, "❌ Número de días inválido (1-90)");
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("telegram_id", telegramId)
        .single();

      if (!user) {
        await sendMessage(chatId, "No te encuentro. Usa /start primero.");
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      // Verificar menús disponibles
      const { data: menus } = await supabase
        .from("weekly_menus")
        .select("id, name, week_number")
        .eq("user_id", user.id)
        .order("week_number", { ascending: true });

      if (!menus || menus.length === 0) {
        await sendMessage(chatId, "❌ No tienes menús semanales.\n\nUsa /semanal nuevo para crear uno.");
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      await sendMessage(chatId, `⏳ Generando menú para ${days} días...`);

      // Generar menú rotativo
      const generatedMeals: any[] = [];
      const startDate = new Date();

      for (let i = 0; i < days; i++) {
        const currentMenuIndex = Math.floor(i / 7) % menus.length;
        const dayInWeek = (i % 7) + 1;
        const menu = menus[currentMenuIndex];

        // Obtener comida y cena del día
        const { data: dayMeals } = await supabase
          .from("weekly_meals")
          .select("meal_type, dish_name, dish_description")
          .eq("weekly_menu_id", menu.id)
          .eq("day_number", dayInWeek);

        const comida = dayMeals?.find(m => m.meal_type === "comida");
        const cena = dayMeals?.find(m => m.meal_type === "cena");

        generatedMeals.push({
          day: i + 1,
          date: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000),
          menu_name: menu.name,
          comida: comida?.dish_name || "No disponible",
          cena: cena?.dish_name || "No disponible",
        });
      }

      // Formatear mensaje
      let message = `📅 *Menú generado (${days} días)*\n\n`;

      for (const meal of generatedMeals) {
        const dateStr = meal.date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
        message += `*Día ${meal.day} (${dateStr}) - ${meal.menu_name}*\n`;
        message += `🍽️ ${meal.comida}\n`;
        message += `🌙 ${meal.cena}\n\n`;
      }

      // Si es muy largo, dividir en varios mensajes
      const chunks = message.match(/[\s\S]{1,4000}/g) || [message];
      for (const chunk of chunks) {
        await sendMessage(chatId, chunk);
      }

      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    // Manejar comando /help
    if (update.message?.text === "/help") {
      const chatId = update.message.chat.id;
      await sendMessage(chatId,
        `*Ayuda - Comandos:*

/start - Iniciar el bot
/semanal - Gestionar menús semanales
/generar [días] - Generar menú rotativo
/status - Ver estado de imágenes
/monthly - Generar menú mensual
/shopping - Ver lista de compra
/help - Esta ayuda`
      );
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    // Manejar comando /status
    if (update.message?.text === "/status") {
      const chatId = update.message.chat.id;
      const telegramId = update.message.from?.id;

      const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("telegram_id", telegramId)
        .single();

      if (!user) {
        await sendMessage(chatId, "No te encuentro en el sistema. Usa /start primero.");
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      const { data: images } = await supabase
        .from("menu_images")
        .select("day_number, meal_type, processed, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      const pending = images?.filter(i => !i.processed).length ?? 0;
      const processed = images?.filter(i => i.processed).length ?? 0;

      await sendMessage(chatId,
        `*Estado de procesamiento:*

✅ Procesadas: ${processed}
⏳ Pendientes: ${pending}

*Últimas imágenes:*
${images?.slice(0, 5).map(i =>
  `${i.processed ? "✅" : "⏳"} Día ${i.day_number} - ${i.meal_type}`
).join("\n") || "Sin imágenes"}`
      );

      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    // Manejar fotos de menús
    if (update.message?.photo) {
      const chatId = update.message.chat.id;
      const telegramId = update.message.from?.id;
      const photo = update.message.photo[update.message.photo.length - 1];
      const caption = update.message.caption;

      // Obtener user_id
      const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("telegram_id", telegramId)
        .single();

      if (!user) {
        await sendMessage(chatId, "Primero usa /start para registrarte.");
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      // Obtener info del archivo
      const { data: fileData } = await fetch(
        `${TELEGRAM_API}/getFile?file_id=${photo.file_id}`
      ).then(r => r.json());

      const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${fileData.result.file_path}`;

      // ==========================================
      // FLUJO 1: Menú semanal (día 1-7)
      // ==========================================
      const weeklyMatch = caption?.match(/^(día?\s*)(\d+)\s+(comida|cena)$/i);
      if (weeklyMatch) {
        const dayNumber = parseInt(weeklyMatch[2]);
        const mealType = weeklyMatch[3].toLowerCase();

        if (dayNumber < 1 || dayNumber > 7) {
          await sendMessage(chatId, "❌ Para menús semanales, el día debe ser 1-7");
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }

        // Buscar el último menú semanal incompleto del usuario
        const { data: activeMenu } = await supabase
          .from("weekly_menus")
          .select("id, name, week_number")
          .eq("user_id", user.id)
          .order("week_number", { ascending: false })
          .limit(1)
          .single();

        if (!activeMenu) {
          await sendMessage(chatId,
            `📸 Imagen recibida, pero no estás creando un menú semanal.

Usa /semanal nuevo para crear uno primero,
o envía la foto con: *comida - día X* (para menú diario)`
          );
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }

        // Extraer nombre del plato de la caption o usar OCR después
        const dishName = caption?.split("\n")[0]?.replace(/día?\s*\d+\s+/i, "").trim() || "Plato sin nombre";

        // Guardar en weekly_meals
        const { error } = await supabase.from("weekly_meals").insert({
          weekly_menu_id: activeMenu.id,
          day_number: dayNumber,
          meal_type: mealType,
          dish_name: dishName,
          dish_description: caption,
          image_url: fileUrl,
        });

        if (error) {
          // Ver si ya existe (día + tipo duplicado)
          if (error.code === "23505") {
            await sendMessage(chatId, `⚠️ Ya tienes un plato para día ${dayNumber} - ${mealType}.\n\n¿Quieres borrarlo primero?`);
          } else {
            await sendMessage(chatId, `❌ Error: ${error.message}`);
          }
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }

        // Contar platos del menú
        const { count } = await supabase
          .from("weekly_meals")
          .select("*", { count: "exact", head: true })
          .eq("weekly_menu_id", activeMenu.id);

        const progress = count || 0;
        const complete = progress >= 14;

        await sendMessage(chatId,
          `✅ *Plato guardado*

📅 ${activeMenu.name} - Día ${dayNumber} ${mealType}
📊 Progreso: ${progress}/14 platos

${complete ? "🎉 ¡Menú semanal completo!" : "¿Añades otro plato?"}`
        );

        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      // ==========================================
      // FLUJO 1.5: Día compuesto en menú semanal
      // ==========================================
      const compoundDayMatch = caption?.match(/^(día?\s*)(\d+)\s+(comida|cena)\s+compuesto\s+(\d+)$/i);
      if (compoundDayMatch) {
        const dayNumber = parseInt(compoundDayMatch[2]);
        const mealType = compoundDayMatch[3].toLowerCase();
        const compoundNum = parseInt(compoundDayMatch[4]);

        if (dayNumber < 1 || dayNumber > 7) {
          await sendMessage(chatId, "❌ Para menús semanales, el día debe ser 1-7");
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }

        const { data: activeMenu } = await supabase
          .from("weekly_menus")
          .select("id, name, week_number")
          .eq("user_id", user.id)
          .order("week_number", { ascending: false })
          .limit(1)
          .single();

        if (!activeMenu) {
          await sendMessage(chatId, "❌ No tienes un menú semanal activo.\n\nUsa /semanal nuevo para crear uno.");
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }

        const { data: compoundDays } = await supabase
          .from("compound_day_meals")
          .select(`
            id,
            name,
            first_dish:dishes!compound_day_meals_first_dish_id_fkey(id, name),
            second_dish:dishes!compound_day_meals_second_dish_id_fkey(id, name)
          `)
          .eq("user_id", user.id)
          .order("name", { ascending: true });

        const compoundDay = compoundDays?.[compoundNum - 1];
        if (!compoundDay) {
          await sendMessage(chatId, `❌ No existe el día compuesto nº${compoundNum}.\n\nUsa /semanal compuestos para ver los disponibles.`);
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }

        const dishName = `${compoundDay.first_dish?.name} + ${compoundDay.second_dish?.name}`;
        const dishDescription = `Día compuesto: ${compoundDay.name}`;

        await supabase.from("weekly_meals").insert({
          weekly_menu_id: activeMenu.id,
          day_number: dayNumber,
          meal_type: mealType,
          dish_name: dishName,
          dish_description: dishDescription,
          image_url: fileUrl,
        });

        const { count } = await supabase
          .from("weekly_meals")
          .select("*", { count: "exact", head: true })
          .eq("weekly_menu_id", activeMenu.id);

        const progress = count || 0;
        const complete = progress >= 14;

        await sendMessage(chatId,
          `✅ *Día compuesto guardado*

📅 ${activeMenu.name} - Día ${dayNumber} ${mealType}
🍽️ ${compoundDay.name}
📊 Progreso: ${progress}/14 platos

${complete ? "🎉 ¡Menú semanal completo!" : "¿Añades otro plato?"}`
        );

        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      // ==========================================
      // FLUJO 2: Menú diario clásico (día 1-21)
      // ==========================================
      const dailyMatch = caption?.match(/^(comida|cena)\s*-?\s*día?\s*(\d+)/i);
      if (dailyMatch) {
        const mealType = dailyMatch[1].toLowerCase();
        const dayNumber = parseInt(dailyMatch[2]);

        if (!mealType || dayNumber < 1 || dayNumber > 21) {
          await sendMessage(chatId, "❌ Formato inválido. Usa: *comida - día 1* o *cena - día 15*");
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }

        // Guardar en menu_images
        await supabase.from("menu_images").insert({
          user_id: user.id,
          telegram_message_id: update.message.message_id,
          image_url: fileUrl,
          meal_type: mealType,
          day_number: dayNumber,
          ocr_raw_text: caption,
          processed: false,
        });

        await sendMessage(chatId,
          `✅ *Imagen guardada*

Día ${dayNumber} - ${mealType}
Procesando con OCR...

¿Envías otra imagen?`
        );

        // Trigger para procesar OCR (se puede hacer asíncrono)
        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/ocr-processor`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            meal_type: mealType,
            day_number: dayNumber,
            image_url: fileUrl
          }),
        });

        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      // ==========================================
      // FLUJO 3: Foto sin caption válido
      // ==========================================
      await sendMessage(chatId,
        `📸 Imagen recibida.

*Para menú semanal (días 1-7):*
Responde: *día 1 comida* o *día 3 cena*

*Para menú diario (días 1-21):*
Responde: *comida - día 1* o *cena - día 15*`
      );

      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    // Comandos no manejados
    if (update.message?.text?.startsWith("/")) {
      await sendMessage(update.message.chat.id,
        "Comando no reconocido. Usa /help para ver la lista."
      );
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (error) {
    console.error("Error processing Telegram update:", error);
    await logError("telegram", error, "telegram-webhook.main");
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
  }
});

async function logError(source: "telegram", err: unknown, context?: string) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "string"
          ? err
          : JSON.stringify(err);
    const stackTrace = err instanceof Error ? err.stack ?? null : null;

    await fetch(`${supabaseUrl}/rest/v1/rpc/insert_error_log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        p_source: source,
        p_message: context ? `[${context}] ${message}` : message,
        p_stack_trace: stackTrace,
      }),
    });
  } catch (logErr) {
    console.error("Error guardando error log:", logErr);
  }
}
