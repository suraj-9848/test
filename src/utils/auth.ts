import axios from "axios";
import { getSession } from "next-auth/react";

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "";

let cachedBackendJwt: string = "";

export const getBackendJwt = async (): Promise<string> => {
    if (cachedBackendJwt) {
        return cachedBackendJwt;
    }

    const session = await getSession();
    if (!session) {
        throw new Error("No session found - user not logged in");
    }

    const googleIdToken = (session as { id_token?: string })?.id_token;
    if (!googleIdToken) {
        throw new Error("No Google ID token found in session");
    }

    try {
        const loginRes = await axios.post(
            `${baseUrl}/api/auth/admin-login`,
            {},
            {
                headers: { Authorization: `Bearer ${googleIdToken}` },
                withCredentials: true,
            }
        );
        cachedBackendJwt = loginRes.data.token;
        return cachedBackendJwt;
    } catch (err) {
        console.error("Failed to authenticate with backend", err);
        throw new Error("Failed to authenticate with backend");
    }
};

export const getAuthHeaders = async () => {
    const jwt = await getBackendJwt();
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
    };
};
