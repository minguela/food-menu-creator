// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss"],
  css: ["~/assets/css/main.css"],
  nitro: {
    preset: "vercel-edge",
  },
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
      adminTelegramId: process.env.NUXT_PUBLIC_ADMIN_TELEGRAM_ID,
    },
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    twilioFromNumber: process.env.TWILIO_FROM_NUMBER,
    twilioWhatsAppFrom: process.env.TWILIO_WHATSAPP_FROM,
    usdaFdcApiKey: process.env.USDA_FDC_API_KEY,
  },
  app: {
    head: {
      title: "MenuPlanner",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "theme-color", content: "#18181b" },
        {
          name: "description",
          content: "Planificador de menús semanales rotativos",
        },
      ],
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossorigin: "",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap",
        },
      ],
    },
  },
});
