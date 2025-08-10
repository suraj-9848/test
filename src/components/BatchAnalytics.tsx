// import React, { useState, useEffect, useCallback } from "react";
// import {
//   FaChartBar,
//   FaGraduationCap,
//   FaBook,
//   FaUsers,
//   FaSearch,
//   FaSpinner,
//   FaInfoCircle,
//   FaExclamationTriangle,
//   FaFilter,
// } from "react-icons/fa";
// import { useSession } from "next-auth/react";
// import { getBackendJwt } from "../utils/auth";
// import apiClient from "../utils/axiosInterceptor";
// import { API_ENDPOINTS } from "../config/urls";

// // Types
// interface Batch {
//   id: string;
//   name: string;
//   description?: string;
//   created_at?: string;
//   updated_at?: string;
//   org_id?: string;
//   courseCount: number;
//   studentCount: number;
// }

// interface BatchAnalytics {
//   id: string;
//   name: string;
//   totalStudents: number;
//   totalCourses: number;
//   avgProgress: number;
//   avgAttendance: number;
//   avgTestScore: number;
//   completionRate: number;
// }

// const BatchAnalyticsComponent: React.FC = () => {
//   const { data: session } = useSession();
//   const [batches, setBatches] = useState<Batch[]>([]);
//   const [batchAnalytics, setBatchAnalytics] = useState<BatchAnalytics[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [backendJwt, setBackendJwt] = useState<string>("");
//   const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
//   const [filterOpen, setFilterOpen] = useState(false);

//   // Authentication setup
//   useEffect(() => {
//     let isMounted = true;

//     const fetchProfile = async () => {
//       if (!session) return;

//       try {
//         if (backendJwt) return; // Skip if we already have JWT to prevent loop

//         const jwt = await getBackendJwt();
//         if (isMounted) {
//           console.log("JWT obtained successfully");
//           setBackendJwt(jwt);
//         }
//       } catch (err) {
//         console.error("Failed to fetch user profile:", err);
//         if (isMounted) {
//           setError("Authentication failed. Please try again.");
//         }
//       }
//     };

//     fetchProfile();

//     return () => {
//       isMounted = false; // Cleanup to prevent state updates on unmounted component
//     };
//   }, [session, backendJwt]);

//   const fetchBatches = useCallback(async () => {
//     try {
//       setLoading(true);
//       setError("");

//       // Fetch batches via centralized apiClient
//       const response = await apiClient.get(API_ENDPOINTS.INSTRUCTOR.BATCHES);

//       console.log("Batches API response:", response.data);

//       // Handle different API response structures
//       const batchesData: Batch[] =
//         response.data.data?.batches ||
//         response.data.batches ||
//         response.data ||
//         [];
//       console.log(`Fetched ${batchesData.length} batches`);

//       // Fetch additional metrics for each batch using available endpoints
//       const batchesWithMetrics = await Promise.all(
//         batchesData.map(async (batch) => {
//           // Fetch courses for this batch
//           const coursesRes = await apiClient.get(
//             API_ENDPOINTS.INSTRUCTOR.BATCH_COURSES(batch.id),
//           );
//           const courses = coursesRes.data.courses || coursesRes.data || [];
//           return {
//             ...batch,
//             courseCount: courses.length,
//             studentCount: batch.studentCount || 0,
//           };
//         }),
//       );

//       setBatches(batchesWithMetrics);

//       // Calculate real analytics data from backend APIs
//       const analyticsPromises = batchesWithMetrics.map(async (batch) => {
//         const studentCount = batch.studentCount || 0;
//         const courseCount = batch.courseCount || 0;

//         const avgProgress = 0;
//         const avgTestScore = 0;
//         const completionRate = 0;

//         // Get courses for this batch
//         await apiClient.get(API_ENDPOINTS.INSTRUCTOR.BATCH_COURSES(batch.id));
//         // Attendance and test score to be derived from real data
//         const attendanceData = await apiClient.get(
//           API_ENDPOINTS.INSTRUCTOR.ANALYTICS.BATCH_ATTENDANCE(batch.id),
//         );
//         const mockAttendance = attendanceData?.data?.attendanceRate || 0;

//         return {
//           id: batch.id,
//           name: batch.name,
//           totalStudents: studentCount,
//           totalCourses: courseCount,
//           avgProgress,
//           avgAttendance: mockAttendance,
//           avgTestScore,
//           completionRate,
//         };
//       });

//       const analyticsData = await Promise.all(analyticsPromises);
//       console.log("Calculated batch analytics with real data:", analyticsData);

//       setBatchAnalytics(analyticsData);
//     } catch (err) {
//       console.error("Error fetching batches:", err);
//       const errorMsg =
//         (err as { response?: { data?: { message?: string } } })?.response?.data
//           ?.message || "Failed to load batches";
//       setError(errorMsg);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // Fetch data when JWT is available
//   useEffect(() => {
//     if (backendJwt) {
//       fetchBatches();
//     }
//   }, [backendJwt, fetchBatches]);

//   const handleSelectBatch = (batchId: string) => {
//     setSelectedBatch(selectedBatch === batchId ? null : batchId);
//   };

//   const filteredBatches = batches.filter(
//     (batch) =>
//       batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       batch.description?.toLowerCase().includes(searchTerm.toLowerCase()),
//   );

//   if (loading && batches.length === 0) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
//         <div className="flex items-center justify-center h-64">
//           <FaSpinner className="animate-spin text-4xl text-blue-600" />
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="mb-8">
//           <h1 className="text-3xl font-bold text-slate-900 mb-2">
//             Batch Analytics
//           </h1>
//           <p className="text-slate-600">
//             View analytics and performance metrics for your batches
//           </p>
//         </div>

//         {/* Search and Filters */}
//         <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
//           <div className="flex flex-col sm:flex-row gap-4">
//             <div className="relative flex-grow">
//               <FaSearch className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" />
//               <input
//                 type="text"
//                 placeholder="Search batches..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition"
//               />
//             </div>
//             <div>
//               <button
//                 onClick={() => setFilterOpen(!filterOpen)}
//                 className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
//               >
//                 <FaFilter className="text-slate-500" />
//                 Filters
//               </button>
//             </div>
//           </div>

//           {/* Filter panel - can be expanded later */}
//           {filterOpen && (
//             <div className="mt-4 p-4 border-t border-slate-200">
//               {/* Filter options would go here */}
//               <p className="text-slate-500">
//                 Advanced filtering options coming soon
//               </p>
//             </div>
//           )}
//         </div>

//         {/* Error Message */}
//         {error && (
//           <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
//             <FaExclamationTriangle className="text-red-500" />
//             <p className="text-red-700 font-medium">{error}</p>
//             <button
//               onClick={() => setError("")}
//               className="ml-auto text-red-700 hover:text-red-900"
//             >
//               Dismiss
//             </button>
//           </div>
//         )}

//         {/* Analytics Overview */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="text-slate-500 font-semibold">Total Batches</h3>
//               <FaGraduationCap className="text-blue-500 text-xl" />
//             </div>
//             <p className="text-3xl font-bold text-slate-900">
//               {batches.length}
//             </p>
//           </div>

//           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="text-slate-500 font-semibold">Total Students</h3>
//               <FaUsers className="text-green-500 text-xl" />
//             </div>
//             <p className="text-3xl font-bold text-slate-900">
//               {batches.reduce(
//                 (sum, batch) => sum + (batch.studentCount || 0),
//                 0,
//               )}
//             </p>
//           </div>

//           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="text-slate-500 font-semibold">Total Courses</h3>
//               <FaBook className="text-purple-500 text-xl" />
//             </div>
//             <p className="text-3xl font-bold text-slate-900">
//               {batches.reduce(
//                 (sum, batch) => sum + (batch.courseCount || 0),
//                 0,
//               )}
//             </p>
//           </div>

//           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="text-slate-500 font-semibold">Avg. Completion</h3>
//               <FaChartBar className="text-orange-500 text-xl" />
//             </div>
//             <p className="text-3xl font-bold text-slate-900">
//               {batchAnalytics.length
//                 ? `${Math.round(
//                     batchAnalytics.reduce(
//                       (sum, b) => sum + b.completionRate,
//                       0,
//                     ) / batchAnalytics.length,
//                   )}%`
//                 : "0%"}
//             </p>
//           </div>
//         </div>

//         {/* Batch Details */}
//         <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
//           <table className="w-full">
//             <thead className="bg-slate-50 border-b border-slate-200">
//               <tr>
//                 <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
//                   Batch Name
//                 </th>
//                 <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
//                   Created On
//                 </th>
//                 <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
//                   Details
//                 </th>
//                 <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
//                   Avg. Progress
//                 </th>
//                 <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
//                   Completion Rate
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-200">
//               {filteredBatches.length === 0 ? (
//                 <tr>
//                   <td
//                     colSpan={5}
//                     className="px-6 py-8 text-center text-slate-500"
//                   >
//                     <FaInfoCircle className="mx-auto text-2xl text-slate-400 mb-2" />
//                     No batches found
//                   </td>
//                 </tr>
//               ) : (
//                 filteredBatches.map((batch) => {
//                   const analytics = batchAnalytics.find(
//                     (b) => b.id === batch.id,
//                   ) || {
//                     avgProgress: 0,
//                     completionRate: 0,
//                     avgAttendance: 0,
//                     avgTestScore: 0,
//                   };

//                   return (
//                     <React.Fragment key={`batch-analytics-${batch.id}`}>
//                       <tr
//                         className={`hover:bg-slate-50 cursor-pointer ${
//                           selectedBatch === batch.id ? "bg-blue-50" : ""
//                         }`}
//                         onClick={() => handleSelectBatch(batch.id)}
//                       >
//                         <td className="px-6 py-4">
//                           <div className="font-medium text-slate-900">
//                             {batch.name}
//                           </div>
//                           <div className="text-sm text-slate-500">
//                             {batch.description}
//                           </div>
//                         </td>
//                         <td className="px-6 py-4">
//                           <div className="text-sm text-slate-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 inline-block">
//                             {batch.created_at
//                               ? new Date(batch.created_at).toLocaleDateString()
//                               : "N/A"}
//                           </div>
//                         </td>
//                         <td className="px-6 py-4">
//                           <div className="text-sm bg-gradient-to-r from-blue-50 to-purple-50 px-3 py-1 rounded-lg border border-blue-100 inline-block">
//                             <span className="font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
//                               {selectedBatch === batch.id
//                                 ? "Hide Details"
//                                 : "View Details"}
//                             </span>
//                           </div>
//                         </td>
//                         <td className="px-6 py-4">
//                           <div className="w-full bg-slate-200 rounded-full h-2">
//                             <div
//                               className="bg-blue-600 h-2 rounded-full"
//                               style={{
//                                 width: `${analytics.avgProgress}%`,
//                               }}
//                             ></div>
//                           </div>
//                           <div className="text-sm text-slate-500 mt-1">
//                             {Math.round(analytics.avgProgress)}%
//                           </div>
//                         </td>
//                         <td className="px-6 py-4">
//                           <div className="w-full bg-slate-200 rounded-full h-2">
//                             <div
//                               className={`h-2 rounded-full ${
//                                 analytics.completionRate > 75
//                                   ? "bg-green-500"
//                                   : analytics.completionRate > 50
//                                     ? "bg-yellow-500"
//                                     : analytics.completionRate > 25
//                                       ? "bg-orange-500"
//                                       : "bg-red-500"
//                               }`}
//                               style={{
//                                 width: `${analytics.completionRate}%`,
//                               }}
//                             ></div>
//                           </div>
//                           <div className="text-sm text-slate-500 mt-1">
//                             {Math.round(analytics.completionRate)}%
//                           </div>
//                         </td>
//                       </tr>

//                       {selectedBatch === batch.id && (
//                         <tr>
//                           <td
//                             colSpan={5}
//                             className="px-6 py-4 bg-slate-50 border-t border-slate-200"
//                           >
//                             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
//                               <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
//                                 <h4 className="text-sm font-semibold text-slate-700 mb-2">
//                                   Attendance Rate
//                                 </h4>
//                                 <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
//                                   <div
//                                     className="bg-green-500 h-2 rounded-full"
//                                     style={{
//                                       width: `${analytics.avgAttendance}%`,
//                                     }}
//                                   ></div>
//                                 </div>
//                                 <div className="text-xl font-bold text-slate-900">
//                                   {Math.round(analytics.avgAttendance)}%
//                                 </div>
//                               </div>

//                               <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
//                                 <h4 className="text-sm font-semibold text-slate-700 mb-2">
//                                   Average Test Score
//                                 </h4>
//                                 <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
//                                   <div
//                                     className="bg-blue-500 h-2 rounded-full"
//                                     style={{
//                                       width: `${analytics.avgTestScore}%`,
//                                     }}
//                                   ></div>
//                                 </div>
//                                 <div className="text-xl font-bold text-slate-900">
//                                   {analytics.avgTestScore}%
//                                 </div>
//                               </div>

//                               <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
//                                 <h4 className="text-sm font-semibold text-slate-700 mb-2">
//                                   Completion Rate
//                                 </h4>
//                                 <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
//                                   <div
//                                     className="bg-purple-500 h-2 rounded-full"
//                                     style={{
//                                       width: `${analytics.completionRate}%`,
//                                     }}
//                                   ></div>
//                                 </div>
//                                 <div className="text-xl font-bold text-slate-900">
//                                   {Math.round(analytics.completionRate)}%
//                                 </div>
//                               </div>
//                             </div>
//                           </td>
//                         </tr>
//                       )}
//                     </React.Fragment>
//                   );
//                 })
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default BatchAnalyticsComponent;
import React from "react";
