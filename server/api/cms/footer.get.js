export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event);
  const headers = config.strapiToken
    ? { Authorization: `Bearer ${config.strapiToken}` }
    : {};

  return $fetch(`${config.strapiUrl}/footer`, {
    query: {
      "populate[columns][populate]": "links",
      "populate[socialLinks]": "true",
      "populate[bottomLinks]": "true",
    },
    headers,
  });
});
