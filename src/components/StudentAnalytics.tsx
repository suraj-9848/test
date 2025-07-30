import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import apiClient from "../utils/axiosInterceptor";
import { API_ENDPOINTS } from "../config/urls";

interface Student {
  student_id: string;
  student_name: string;
  email: string;
  progress_percentage: number;
  modules_completed: number;
  total_modules: number;
  last_activity: string;
  time_spent_hours: number;
  quiz_scores: number[];
  average_score: number;
}

interface Batch {
  id: string;
  name: string;
  description: string;
  org_id: string;
  created_at: string;
  student_count: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  duration: string;
  enrolled_students: number;
  completion_rate: number;
}

const StudentAnalytics: React.FC = () => {
  const { data: session, status } = useSession();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [studentsData, setStudentsData] = useState<Student[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const mountedRef = useRef<boolean>(true);

  // Fetch student analytics data
  const fetchStudentAnalytics = useCallback(
    async (batchId: string, courseId: string) => {
      if (!batchId || !courseId || !mountedRef.current) {
        return;
      }

      try {
        console.log(`📊 ANALYTICS FETCH START: Fetching student analytics for batch: ${batchId}, course: ${courseId}`);
        console.log(`📊 ANALYTICS URLS:`, {
          progressURL: API_ENDPOINTS.INSTRUCTOR.ANALYTICS.BATCH_COURSE_PROGRESS(batchId, courseId),
          studentsURL: API_ENDPOINTS.INSTRUCTOR.ANALYTICS.BATCH_STUDENTS(batchId),
          fullProgressURL: `${apiClient.defaults.baseURL}${API_ENDPOINTS.INSTRUCTOR.ANALYTICS.BATCH_COURSE_PROGRESS(batchId, courseId)}`,
          fullStudentsURL: `${apiClient.defaults.baseURL}${API_ENDPOINTS.INSTRUCTOR.ANALYTICS.BATCH_STUDENTS(batchId)}`
        });
        
        console.log(`📊 ANALYTICS API CALLS: Making Promise.all for progress and students data...`);
        
        // Fetch complete student analytics with real data
        const [progressResponse, studentsResponse] = await Promise.all([
          apiClient.get(API_ENDPOINTS.INSTRUCTOR.ANALYTICS.BATCH_COURSE_PROGRESS(batchId, courseId)),
          apiClient.get(API_ENDPOINTS.INSTRUCTOR.ANALYTICS.BATCH_STUDENTS(batchId))
        ]);
        
        console.log(`📊 ANALYTICS RESPONSES RECEIVED:`, {
          progressStatus: progressResponse?.status,
          progressDataSize: progressResponse?.data ? JSON.stringify(progressResponse.data).length : 0,
          studentsStatus: studentsResponse?.status,
          studentsDataSize: studentsResponse?.data ? JSON.stringify(studentsResponse.data).length : 0
        });

        if (!mountedRef.current) return;

        const progressData = progressResponse?.data?.report || [];
        const studentsData = studentsResponse?.data?.students || [];
        
        // Create student lookup map for emails and details
        const studentMap = new Map();
        studentsData.forEach((student: any) => {
          studentMap.set(student.id, {
            email: student.email || student.user?.email || 'No email',
            name: student.username || student.name || student.user?.username || 'Unknown Student'
          });
        });

        // Get course details to calculate accurate progress
        console.log(`📊 ANALYTICS COURSE FETCH: Getting course details for courseId: ${courseId}`);
        console.log(`📊 ANALYTICS COURSE URL: ${API_ENDPOINTS.INSTRUCTOR.COURSES}/${courseId}`);
        
        const courseResponse = await apiClient.get(API_ENDPOINTS.INSTRUCTOR.COURSES + `/${courseId}`);
        console.log(`📊 ANALYTICS COURSE RESPONSE:`, {
          status: courseResponse?.status,
          dataSize: courseResponse?.data ? JSON.stringify(courseResponse.data).length : 0,
          modulesCount: courseResponse?.data?.modules?.length || 0
        });
        
        const courseModules = courseResponse?.data?.modules || [];
        const totalModules = courseModules.length || 10;

        if (!mountedRef.current) return;

        // Transform to complete student analytics
        const transformedData: Student[] = await Promise.all(
          progressData.map(async (item: any) => {
            const studentDetails = studentMap.get(item.studentId) || { email: 'No email', name: 'Unknown Student' };
            
            // Calculate real progress percentage
            const progressPercentage = totalModules > 0 
              ? Math.min(100, Math.round((item.currentPage || 0) / totalModules * 100))
              : 0;

            // Fetch real test scores for this student
            let averageScore = 0;
            let quizScores: number[] = [];
            try {
              const scoresResponse = await apiClient.get(
                API_ENDPOINTS.INSTRUCTOR.ANALYTICS.STUDENT_COURSE_SCORES(batchId, courseId, item.studentId)
              );
              const scores = scoresResponse?.data?.scores || [];
              quizScores = scores.map((s: any) => s.percentage || 0);
              averageScore = scoresResponse?.data?.average || 0;
            } catch {
              // If scores endpoint fails, calculate from available data
              averageScore = item.averageScore || 0;
            }

            // Calculate real time spent (convert minutes to hours)
            const timeSpentHours = Math.round((item.timeSpentMinutes || 0) / 60 * 10) / 10;

            return {
              student_id: item.studentId,
              student_name: studentDetails.name,
              email: studentDetails.email,
              progress_percentage: progressPercentage,
              modules_completed: item.currentPage || 0,
              total_modules: totalModules,
              last_activity: item.lastActivity || item.updatedAt || new Date().toISOString(),
              time_spent_hours: timeSpentHours,
              quiz_scores: quizScores,
              average_score: averageScore,
            };
          })
        );
        
        if (mountedRef.current) {
          console.log('✅ Student analytics data processed:', transformedData.length, 'students');
          setStudentsData(transformedData);
        }
      } catch (err: any) {
        console.error("❌ ANALYTICS ERROR: Error fetching student analytics:", err);
        console.error("❌ ANALYTICS ERROR DETAILS:", {
          message: err.message,
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          url: err.config?.url,
          method: err.config?.method,
          batchId,
          courseId,
          timestamp: new Date().toISOString(),
          stack: err.stack
        });
        
        if (mountedRef.current) {
          setError(`Failed to load student analytics: ${err.message}`);
          setStudentsData([]);
        }
      }
    },
    [] // No dependencies to prevent infinite loops
  );

  // Fetch courses for batch
  const fetchCoursesForBatch = useCallback(
    async (batchId: string) => {
      if (!batchId || !mountedRef.current) {
        return;
      }

      try {
        console.log(`📋 Fetching courses for batch: ${batchId}`);
        const coursesResponse = await apiClient.get(API_ENDPOINTS.INSTRUCTOR.BATCH_COURSES(batchId));
        
        if (!mountedRef.current) return;

        const courseList = coursesResponse?.data?.courses || [];
        setCourses(courseList);

        if (courseList.length > 0) {
          const firstCourse = courseList[0];
          setSelectedCourse(firstCourse.id);
          
          // Fetch analytics for first course automatically
          await fetchStudentAnalytics(batchId, firstCourse.id);
        } else {
          setStudentsData([]);
          setSelectedCourse("");
        }
      } catch (err: any) {
        console.error("❌ Error fetching courses:", err);
        if (mountedRef.current) {
          setError(`Failed to load courses: ${err.message}`);
        }
      }
    },
    [] // No dependencies to prevent loops
  );

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    console.log('🔄 fetchInitialData called');
    console.log('🔍 Mounted:', mountedRef.current);
    console.log('🔍 Status:', status);
    console.log('🔍 Session:', !!session);
    
    if (!mountedRef.current) {
      console.log('❌ Component not mounted, skipping');
      console.log('🔧 Attempting to fix mountedRef...');
      mountedRef.current = true;
      console.log('🔧 mountedRef after fix:', mountedRef.current);
    }
    
    // Less strict authentication check - let axios interceptor handle auth
    if (status === 'loading') {
      console.log('⏳ Still loading authentication, skipping');
      return;
    }
    
    try {
      setLoading(true);
      setError("");

      console.log('🚀 Making API call to fetch batches...');
      const batchesResponse = await apiClient.get(API_ENDPOINTS.INSTRUCTOR.BATCHES);
      
      console.log('📦 Batches response:', batchesResponse);
      
      if (!mountedRef.current) return;

      const batchList = batchesResponse?.data?.batches || [];
      console.log('✅ Batches received:', batchList.length);
      setBatches(batchList);

      if (batchList.length > 0) {
        const firstBatch = batchList[0];
        console.log('🔄 Setting first batch and fetching courses:', firstBatch.id);
        setSelectedBatch(firstBatch.id);
        
        // Fetch courses for first batch
        await fetchCoursesForBatch(firstBatch.id);
      } else {
        console.log('⚠️ No batches available');
      }
    } catch (err: any) {
      console.error("❌ Error fetching initial data:", err);
      console.error("❌ Error details:", err.response?.data);
      if (mountedRef.current) {
        setError(`Failed to load initial data: ${err.message}`);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []); // Remove dependencies to make it stable

  // Initialize data on component mount
  useEffect(() => {
    console.log('🚀 StudentAnalytics - Component mounted');
    
    // Ensure mountedRef is set to true
    mountedRef.current = true;
    console.log('🔧 mountedRef set to:', mountedRef.current);
    
    fetchInitialData();
    
    return () => {
      console.log('🧹 StudentAnalytics - Component cleanup, setting mountedRef to false');
      mountedRef.current = false;
    };
  }, []); // No dependencies - fetchInitialData handles its own conditions

  // Handle batch selection change
  const handleBatchChange = async (batchId: string) => {
    console.log('🚀 STUDENT ANALYTICS: Batch changed to:', batchId);
    console.log('📍 Component state before batch change:', {
      selectedBatch,
      selectedCourse,
      coursesLength: courses.length,
      studentsDataLength: studentsData.length,
      mountedRef: mountedRef.current,
      loading,
      error
    });
    
    setSelectedBatch(batchId);
    setSelectedCourse("");
    setCourses([]);
    setStudentsData([]);
    setLoading(true);
    
    if (batchId) {
      console.log('📞 Calling fetchCoursesForBatch for batch:', batchId);
      try {
        await fetchCoursesForBatch(batchId);
        console.log('✅ fetchCoursesForBatch completed successfully');
      } catch (error) {
        console.error('❌ fetchCoursesForBatch failed:', error);
      }
    } else {
      console.log('⚠️ No batch ID provided, skipping course fetch');
    }
    setLoading(false);
  };

  // Handle course selection change
  const handleCourseChange = async (courseId: string) => {
    console.log('🚀 STUDENT ANALYTICS: Course changed to:', courseId);
    console.log('📍 Component state before course change:', {
      selectedBatch,
      selectedCourse,
      newCourseId: courseId,
      coursesLength: courses.length,
      studentsDataLength: studentsData.length,
      mountedRef: mountedRef.current,
      loading,
      error
    });
    
    setSelectedCourse(courseId);
    setStudentsData([]);
    setLoading(true);
    
    if (selectedBatch && courseId) {
      console.log('📊 ANALYTICS TRIGGER: About to fetch student analytics for:', {
        batchId: selectedBatch,
        courseId: courseId,
        timestamp: new Date().toISOString()
      });
      
      try {
        await fetchStudentAnalytics(selectedBatch, courseId);
        console.log('✅ ANALYTICS COMPLETED: fetchStudentAnalytics completed successfully');
      } catch (error) {
        console.error('❌ ANALYTICS FAILED: fetchStudentAnalytics failed:', error);
      }
    } else {
      console.log('⚠️ ANALYTICS SKIPPED: Missing batch or course:', {
        selectedBatch,
        courseId,
        reason: !selectedBatch ? 'No batch selected' : !courseId ? 'No course provided' : 'Unknown'
      });
    }
    setLoading(false);
  };

  // Show loading for authentication
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Authenticating...</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={fetchInitialData}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Student Analytics</h2>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Batch
            </label>
            <select
              value={selectedBatch}
              onChange={(e) => handleBatchChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a batch...</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name} ({batch.student_count} students)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Course
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => handleCourseChange(e.target.value)}
              disabled={!selectedBatch || courses.length === 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Choose a course...</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title} ({course.enrolled_students} students)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mb-4 p-3 bg-gray-100 rounded text-xs">
          <p><strong>Debug:</strong></p>
          <p>Batches: {batches.length}</p>
          <p>Courses: {courses.length}</p>
          <p>Students: {studentsData.length}</p>
          <p>Selected Batch: {selectedBatch}</p>
          <p>Selected Course: {selectedCourse}</p>
        </div>

        {/* Student Data Table */}
        {studentsData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Modules
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time Spent
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {studentsData.map((student) => (
                  <tr key={student.student_id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {student.student_name || 'Unknown Student'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {student.email || 'No email'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${student.progress_percentage || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">
                          {student.progress_percentage || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.modules_completed || 0}/{student.total_modules || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.average_score ? student.average_score.toFixed(1) : '0.0'}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.time_spent_hours || 0}h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : selectedBatch && selectedCourse ? (
          <div className="text-center py-8 text-gray-500">
            No student data available for the selected batch and course.
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Please select a batch and course to view student analytics.
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAnalytics;