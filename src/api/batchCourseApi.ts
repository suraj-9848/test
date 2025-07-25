import axios from "axios";
import { getAuthHeaders } from "@/utils/auth";

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "";
const API_URL = `${baseUrl}/api/instructor/batches`;

// Fetch courses for a batch
export const getCoursesForBatch = async (batchId: string) => {
    try {
        const headers = await getAuthHeaders();
        const res = await axios.get(`${API_URL}/${batchId}/courses`, {
            headers,
        });
        return res.data.courses || [];
    } catch (err: unknown) {
        console.error(`Error fetching courses for batch ${batchId}:`, err);
        const errorMessage = err instanceof Error && 'response' in err 
            ? (err as any).response?.data?.message 
            : `Failed to fetch courses for batch ${batchId}`;
        throw new Error(errorMessage);
    }
};

// Assign multiple courses to a single batch
export const assignCoursesToBatch = async (
    batchId: string,
    courseIds: string[]
) => {
    try {
        const headers = await getAuthHeaders();
        console.log(
            `Assigning ${courseIds.length} courses to batch ${batchId}`,
            { courseIds }
        );

        const res = await axios.post(
            `${API_URL}/${batchId}/courses`,
            { courseIds },
            { headers }
        );

        console.log("Assign courses response:", res.data);
        return res.data;
    } catch (err: any) {
        console.error(`Error assigning courses to batch ${batchId}:`, err);
        throw new Error(
            err.response?.data?.message ||
                `Failed to assign courses to batch ${batchId}`
        );
    }
};

// Assign multiple courses to multiple batches
export const assignCoursesToBatches = async (
    batchIds: string[],
    courseIds: string[]
) => {
    console.log(
        `Assigning ${courseIds.length} courses to ${batchIds.length} batches`
    );

    const results: {
        batchId: string;
        success: boolean;
        message?: string;
        data?: any;
    }[] = [];

    for (const batchId of batchIds) {
        try {
            const data = await assignCoursesToBatch(batchId, courseIds);
            results.push({
                batchId,
                success: true,
                data,
            });
        } catch (err: any) {
            console.error(`Failed to assign courses to batch ${batchId}:`, err);
            results.push({
                batchId,
                success: false,
                message:
                    err.message ||
                    `Unknown error assigning courses to batch ${batchId}`,
            });
        }
    }

    const failures = results.filter((r) => !r.success);
    if (failures.length > 0) {
        console.warn(
            `Failed to assign courses to ${failures.length} batch(es):`,
            failures
        );
        const errorMessages = failures.map((f) => f.message).join("; ");
        throw new Error(
            `Failed to assign courses to ${failures.length} batch(es): ${errorMessages}`
        );
    }

    return results.filter((r) => r.success).map((r) => r.data);
};
