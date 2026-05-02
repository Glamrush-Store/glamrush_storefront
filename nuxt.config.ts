// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxt/ui", "@nuxt/image", "@pinia/nuxt", "nuxt-auth-utils"],
  imports: {
    dirs: ["composables/cms"],
  },
  css: ["~/assets/css/main.css"],

  runtimeConfig: {
    public: {
      apiBase: "http://127.0.0.1:8000/api/v1",
      strapiToken:
        "d8778d333312f36df2107859752d72f2d93a0657af07d4b395c38b3802c7373f0ba84236208565af150f99abf1480a5808a6f7aec9931e813a6a61404d59d9014b5a630529242ab7232fb60f574d69957b0c2a9bb71cb77f5e99744df09d1c0c3646fc5525c78c9731c7872e55a903314534ffc83bfdbd7b8fb2c0d459c4249c",
      strapiUrl: "http://localhost:1337/api",
    },
  },
});
