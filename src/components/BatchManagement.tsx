import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
    FaChevronDown,
    FaExclamationTriangle,
    FaPlus,
    FaSearch,
    FaSpinner,
    FaGraduationCap,
    FaBook,
    FaInfoCircle,
} from "react-icons/fa";
import { useSession } from "next-auth/react";
import { getBackendJwt } from "../utils/auth";
import Link from "next/link";

// Types
interface Batch {
    id: string;
    name: string;
    description?: string;
    created_at?: string;
    updated_at?: string;
    org_id?: string;
    courseCount?: number;
    studentCount?: number;
}

interface Course {
    id: string;
    title: string;
    instructor_name?: string;
    start_date?: string;
    end_date?: string;
    is_public?: boolean;
    description?: string;
}

const BatchManagement: React.FC = () => {
    const { data: session } = useSession();
    const [batches, setBatches] = useState<Batch[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [courseLoading, setCourseLoading] = useState(false);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [backendJwt, setBackendJwt] = useState<string>("");

    const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "";

    // Authentication setup - Fixed to prevent infinite loop
    useEffect(() => {
        let isMounted = true;

        const fetchProfile = async () => {
            if (!session) return;

            try {
                if (backendJwt) return; // Skip if we already have JWT to prevent loop

                const jwt = await getBackendJwt();
                if (isMounted) {
                    console.log("JWT obtained successfully");
                    setBackendJwt(jwt);
                }
            } catch (err) {
                console.error("Failed to fetch user profile:", err);
                if (isMounted) {
                    setError("Authentication failed. Please try again.");
                }
            }
        };

        fetchProfile();

        return () => {
            isMounted = false; // Cleanup to prevent state updates on unmounted component
        };
    }, [session, backendJwt]);

    const fetchBatches = useCallback(async () => {
        if (!backendJwt) {
            console.log("Cannot fetch batches: No JWT available");
            return;
        }

        try {
            setLoading(true);
            setError("");

            console.log("Making API call to fetch batches");
            const response = await axios.get(
                `${API_BASE_URL}/api/instructor/batches`,
                {
                    headers: { Authorization: `Bearer ${backendJwt}` },
                }
            );

            console.log("Batches API response:", response.data);

            // Handle the API response structure
            const batchesData: Batch[] = response.data.batches || [];
            console.log(`Fetched ${batchesData.length} batches`);

            // Set batches without course counts initially
            setBatches(batchesData);

            // Fetch course counts for each batch
            if (batchesData.length > 0) {
                try {
                    // Fetch course counts for each batch
                    const batchesWithCourseCount = await Promise.all(
                        batchesData.map(async (batch: Batch) => {
                            try {
                                const courseResponse = await axios.get(
                                    `${API_BASE_URL}/api/instructor/batches/${batch.id}/courses`,
                                    {
                                        headers: {
                                            Authorization: `Bearer ${backendJwt}`,
                                        },
                                    }
                                );
                                const courses =
                                    courseResponse.data.courses || [];
                                return {
                                    ...batch,
                                    courseCount: courses.length,
                                };
                            } catch (err) {
                                console.error(
                                    `Error fetching courses for batch ${batch.id}:`,
                                    err
                                );
                                return batch; // Return batch without courseCount if there's an error
                            }
                        })
                    );

                    // Update batches with course counts
                    setBatches(batchesWithCourseCount);
                    console.log(
                        "Updated batches with course counts:",
                        batchesWithCourseCount
                    );
                } catch (err) {
                    console.error("Error fetching course counts:", err);
                }
            }

            if (batchesData.length === 0) {
                console.log("No batches found in API response");
            }
        } catch (err: any) {
            console.error("Error fetching batches:", err);
            const errorMsg =
                err.response?.data?.message || "Failed to load batches";
            console.log("Error message:", errorMsg);
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL, backendJwt]);

    // Fetch data when JWT is available
    useEffect(() => {
        if (backendJwt) {
            console.log(
                "Fetching batches with JWT:",
                backendJwt.substring(0, 10) + "..."
            );
            fetchBatches();
        } else {
            console.log("No backendJwt available yet");
        }
    }, [backendJwt, fetchBatches]);

    const fetchCoursesForBatch = async (batchId: string) => {
        if (!backendJwt) {
            console.log("Cannot fetch courses: No JWT available");
            return;
        }

        try {
            setCourseLoading(true);
            console.log(`Fetching courses for batch ${batchId}`);
            const response = await axios.get(
                `${API_BASE_URL}/api/instructor/batches/${batchId}/courses`,
                {
                    headers: { Authorization: `Bearer ${backendJwt}` },
                }
            );

            // The API returns { message: string, courses: Course[] }
            const courseData = response.data.courses || response.data || [];
            console.log(
                `Successfully fetched ${courseData.length} courses for batch ${batchId}`
            );
            setCourses(courseData);

            // Update the batch's courseCount in the batches array
            setBatches((prevBatches) =>
                prevBatches.map((batch) =>
                    batch.id === batchId
                        ? { ...batch, courseCount: courseData.length }
                        : batch
                )
            );
        } catch (err: any) {
            console.error("Error fetching courses:", err);
            const errorMsg =
                err.response?.data?.message ||
                "Failed to load courses for batch";
            console.log("Error message:", errorMsg);
            setError(errorMsg);
            setCourses([]);
        } finally {
            setCourseLoading(false);
        }
    };

    const handleBatchExpand = async (batchId: string) => {
        if (expandedBatch === batchId) {
            setExpandedBatch(null);
            setCourses([]);
        } else {
            setExpandedBatch(batchId);
            await fetchCoursesForBatch(batchId);
        }
    };

    const handleRefresh = () => {
        fetchBatches();
    };

    const filteredBatches = batches.filter(
        (batch) =>
            batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            batch.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && batches.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
                <div className="flex items-center justify-center h-64">
                    <FaSpinner className="animate-spin text-4xl text-blue-600" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">
                            Batch Management
                        </h1>
                        <p className="text-slate-600">
                            Manage your batches and view courses within each
                            batch
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={handleRefresh}
                            className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg border border-blue-200 hover:bg-blue-100 transition flex items-center gap-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <FaSpinner className="animate-spin" />
                            ) : (
                                <FaGraduationCap />
                            )}
                            Refresh Batches
                        </button>
                        <Link
                            href="/dashboard/instructor/create-batch"
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                        >
                            <FaPlus /> Create New Batch
                        </Link>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-grow">
                            <FaSearch className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by batch name or description..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition"
                            />
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
                        <FaExclamationTriangle className="text-red-500" />
                        <p className="text-red-700 font-medium">{error}</p>
                        <button
                            onClick={() => setError("")}
                            className="ml-auto text-red-700 hover:text-red-900"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {/* Batches List */}
                <div className="space-y-4">
                    {filteredBatches.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
                            <FaGraduationCap className="mx-auto text-4xl text-slate-300 mb-4" />
                            <h3 className="text-xl font-semibold text-slate-700">
                                No batches found
                            </h3>
                            <p className="text-slate-500 mt-2 max-w-md mx-auto">
                                {loading
                                    ? "Loading batches..."
                                    : searchTerm
                                    ? "No batches match your search criteria."
                                    : "Create a new batch to get started or make sure you have instructor permissions."}
                            </p>
                            {!loading && !searchTerm && (
                                <Link
                                    href="/dashboard/instructor/create-batch"
                                    className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                                >
                                    Create New Batch
                                </Link>
                            )}
                        </div>
                    ) : (
                        filteredBatches.map((batch) => (
                            <div
                                key={batch.id}
                                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
                            >
                                <div
                                    className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 transition"
                                    onClick={() => handleBatchExpand(batch.id)}
                                >
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900">
                                            {batch.name}
                                        </h2>
                                        <p className="text-slate-600">
                                            {batch.description ||
                                                "No description provided"}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-sm text-slate-500">
                                            <span className="font-semibold">
                                                {batch.studentCount || 0}
                                            </span>{" "}
                                            Students
                                        </div>
                                        <div className="text-sm text-slate-500">
                                            <span className="font-semibold">
                                                {batch.courseCount || 0}
                                            </span>{" "}
                                            Courses
                                        </div>
                                        <FaChevronDown
                                            className={`transform transition-transform ${
                                                expandedBatch === batch.id
                                                    ? "rotate-180"
                                                    : ""
                                            }`}
                                        />
                                    </div>
                                </div>
                                {expandedBatch === batch.id && (
                                    <div className="p-6 border-t border-slate-200">
                                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                            <FaBook /> Courses in this Batch
                                        </h3>

                                        {courseLoading ? (
                                            <div className="py-8 flex justify-center">
                                                <FaSpinner className="animate-spin text-blue-600 text-2xl" />
                                            </div>
                                        ) : courses.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {courses.map((course) => (
                                                    <div
                                                        key={course.id}
                                                        className="bg-slate-50 p-4 rounded-lg border border-slate-200"
                                                    >
                                                        <h4 className="font-semibold text-slate-800">
                                                            {course.title}
                                                        </h4>
                                                        {course.description && (
                                                            <p className="text-sm text-slate-600 mt-1">
                                                                {
                                                                    course.description
                                                                }
                                                            </p>
                                                        )}
                                                        {course.instructor_name && (
                                                            <p className="text-sm text-slate-500 mt-2">
                                                                Instructor:{" "}
                                                                {
                                                                    course.instructor_name
                                                                }
                                                            </p>
                                                        )}
                                                        {course.start_date &&
                                                            course.end_date && (
                                                                <p className="text-sm text-slate-500">
                                                                    {new Date(
                                                                        course.start_date
                                                                    ).toLocaleDateString()}{" "}
                                                                    -{" "}
                                                                    {new Date(
                                                                        course.end_date
                                                                    ).toLocaleDateString()}
                                                                </p>
                                                            )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-200">
                                                <FaInfoCircle className="mx-auto text-2xl text-slate-400 mb-2" />
                                                <p className="text-slate-500">
                                                    No courses assigned to this
                                                    batch yet.
                                                </p>
                                                <Link
                                                    href="/dashboard/instructor/create-course"
                                                    className="inline-block mt-4 text-blue-600 hover:text-blue-800 text-sm"
                                                >
                                                    Create a new course
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default BatchManagement;
