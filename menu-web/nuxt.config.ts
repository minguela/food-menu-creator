// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss"],
  css: ["~/assets/css/main.css"],
  nitro: {
      preset: "vercel",  // OCR Docker requiere Node serverless (no Edge)
  },
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
      adminTelegramId: process.env.NUXT_PUBLIC_ADMIN_TELEGRAM_ID,
      appVersion:
        process.env.NUXT_PUBLIC_APP_VERSION || process.env.npm_package_version,
      appCommitSha:
        process.env.NUXT_PUBLIC_APP_COMMIT_SHA ||
        process.env.VERCEL_GIT_COMMIT_SHA ||
        "",
      appBuildTime: process.env.NUXT_PUBLIC_APP_BUILD_TIME || "",
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || "",
    },
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ocrProcessorUrl: process.env.OCR_PROCESSOR_URL || "",
    ocrSharedSecret: process.env.OCR_SHARED_SECRET || "",
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    twilioFromNumber: process.env.TWILIO_FROM_NUMBER,
    twilioWhatsAppFrom: process.env.TWILIO_WHATSAPP_FROM,
    usdaFdcApiKey:
      process.env.USDA_FDC_API_KEY ||
      process.env.USDA_API_KEY ||
      process.env.NUXT_USDA_FDC_API_KEY,
  },
  app: {
    head: {
      title: "MenuPlanner",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "theme-color", content: "#0F172A" },
        {
          name: "description",
          content: "Planificador de menús semanales rotativos",
        },
        { property: "og:title", content: "MenuPlanner" },
        {
          property: "og:description",
          content: "Planificador de menús semanales rotativos",
        },
        { property: "og:type", content: "website" },
        {
          property: "og:image",
          content:
            (process.env.NUXT_PUBLIC_SITE_URL || "") + "/og-image.png",
        },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: "MenuPlanner" },
        {
          name: "twitter:description",
          content: "Planificador de menús semanales rotativos",
        },
        {
          name: "twitter:image",
          content:
            (process.env.NUXT_PUBLIC_SITE_URL || "") + "/og-image.png",
        },
      ],
      link: [
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossorigin: "",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Montserrat:wght@300;400;500&family=Source+Code+Pro:wght@400&display=swap",
        },
        {
          rel: "canonical",
          href: (process.env.NUXT_PUBLIC_SITE_URL || "") + "/",
        },
      ],
    },
  },
});
