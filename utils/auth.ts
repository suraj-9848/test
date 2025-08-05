import { BASE_URLS, API_ENDPOINTS, buildAuthUrl } from "../src/config/urls";

export async function validateOAuthUser(sessionJwt: string) {
  if (!sessionJwt) {
    return { valid: false, error: "Missing Session, please login again." };
  }

  try {
    const url = buildAuthUrl(API_ENDPOINTS.AUTH.ADMIN_LOGIN);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionJwt}`,
      },
    });

    if (!response.ok) {
      // Not a valid user or some error
      return { valid: false, error: await response.json() };
    }

    const data = await response.json();
    return { valid: true, user: data.user };
  } catch (error) {
    return { valid: false, error };
  }
}
