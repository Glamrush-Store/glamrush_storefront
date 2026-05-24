import { process } from "zod/v4/core";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  app: {
    head: {
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossorigin: "",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap",
        },
      ],
    },
  },
  modules: ["@nuxt/ui", "@nuxt/image", "@pinia/nuxt", "nuxt-auth-utils"],
  imports: {
    dirs: ["composables/cms"],
  },
  css: ["~/assets/css/main.css"],

  runtimeConfig: {
    apiBase: "",
    strapiToken: "",
    strapiUrl: "http://localhost:1337/api",
    public: {
      apiBase: process.env.API_BASE_URL || "http://127.0.0.1:8001/api/v1",
      strapiUrl:
        process.env.NUXT_PUBLIC_STRAPI_URL ||
        process.env.NUXT_STRAPI_URL ||
        "http://localhost:1337/api",
    },
  },
});
