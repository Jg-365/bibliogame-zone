export function getApiErrorMessage(
  error: any,
  fallback = "Ocorreu um erro"
) {
  if (!error) return fallback;

  // Supabase error shape usually has 'message'
  if (
    typeof error.message === "string" &&
    error.message.trim()
  )
    return error.message;

  // Postgres error detail
  if (
    typeof error.details === "string" &&
    error.details.trim()
  )
    return error.details;

  if (typeof error.error === "string" && error.error.trim())
    return error.error;

  if (typeof error === "string" && error.trim())
    return error;

  try {
    const json = JSON.stringify(error);
    if (json && json !== "{}") return json;
  } catch (e) {
    // ignore
  }

  return fallback;
}
