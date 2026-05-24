export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");
  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: "Page slug is required",
    });
  }

  const config = useRuntimeConfig(event);
  const headers = config.strapiToken
    ? { Authorization: `Bearer ${config.strapiToken}` }
    : {};

  return $fetch(`${config.strapiUrl}/pages`, {
    query: {
      "filters[slug][$eq]": slug,
      populate: "blocks.backgroundImage,blocks.cta",
    },
    headers,
  });
});
