export async function validateOAuthUser(sessionJwt: string) {
  if (!sessionJwt) {
    return { valid: false, error: "Missing Session, please login again." };
  }
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;
  try {
    const response = await fetch(`${baseUrl}/api/auth/admin-login`, {
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
