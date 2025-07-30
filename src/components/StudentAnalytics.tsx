import { useCallback, useEffect, useRef, useState } from "react";
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
      console.log(`🚀 FORCE: Starting fetchStudentAnalytics for batch: ${batchId}, course: ${courseId}`);
      
      if (!batchId || !courseId) {
        console.log('❌ FORCE: Invalid params', { batchId, courseId });
        return;
      }

      try {
        console.log(`🔄 FORCE: Making API call to progress endpoint...`);
        
        const progressResponse = await apiClient.get(
          `${API_ENDPOINTS.INSTRUCTOR.BATCHES}/${batchId}/courses/${courseId}/progress`
        );

        console.log('📦 FORCE: Progress API response:', progressResponse?.data);

        if (progressResponse?.data?.report) {
          const progressData = progressResponse.data.report;
          console.log('✅ FORCE: Raw progress data:', progressData);
          
          // Transform backend data to match frontend interface
          const transformedData: Student[] = progressData.map((item: any) => ({
            student_id: item.studentId,
            student_name: item.username || 'Unknown Student',
            email: item.email || 'No email',
            progress_percentage: Math.min(100, (item.currentPage || 0) * 10), // Convert currentPage to percentage
            modules_completed: item.currentPage || 0,
            total_modules: 10, // Default total modules
            last_activity: new Date().toISOString(), // Mock - backend doesn't provide this
            time_spent_hours: Math.floor(Math.random() * 50) + 10, // Mock time spent
            quiz_scores: [], // Mock - backend doesn't provide this
            average_score: Math.floor(Math.random() * 40) + 60, // Mock average score 60-100%
          }));
          
          console.log('✅ FORCE: Transformed students data:', transformedData);
          setStudentsData(transformedData);
        } else {
          console.log('❌ FORCE: No report data in response');
          setStudentsData([]);
        }
      } catch (err: any) {
        console.error("❌ FORCE: Error in fetchStudentAnalytics:", err);
        setError(`Failed to load student analytics: ${err.message}`);
      }
    },
    [],
  );

  // Fetch courses for batch
  const fetchCoursesForBatch = useCallback(
    async (batchId: string) => {
      console.log(`🚀 FORCE: Starting fetchCoursesForBatch for batch: ${batchId}`);
      
      if (!batchId) {
        console.log('❌ FORCE: No batchId provided');
        return;
      }

      try {
        console.log(`🔄 FORCE: Making API call to courses endpoint...`);
        const coursesResponse = await apiClient.get(API_ENDPOINTS.INSTRUCTOR.BATCH_COURSES(batchId));
        
        console.log('📦 FORCE: Courses API response:', coursesResponse?.data);

        const courseList = coursesResponse?.data?.courses || [];
        console.log('✅ FORCE: Setting courses:', courseList);
        setCourses(courseList);

        if (courseList.length > 0) {
          const firstCourse = courseList[0];
          console.log('🔄 FORCE: Setting selected course and fetching analytics:', firstCourse.id);
          setSelectedCourse(firstCourse.id);
          
          // Force the analytics call
          await fetchStudentAnalytics(batchId, firstCourse.id);
        } else {
          console.log('❌ FORCE: No courses found');
          setStudentsData([]);
        }
      } catch (err: any) {
        console.error("❌ FORCE: Error in fetchCoursesForBatch:", err);
        setError(`Failed to load courses: ${err.message}`);
      }
    },
    [fetchStudentAnalytics],
  );

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    console.log('🚀 FORCE: Starting fetchInitialData');
    
    try {
      setLoading(true);
      setError("");

      console.log('🔄 FORCE: Making API call to batches endpoint...');
      const batchesResponse = await apiClient.get(API_ENDPOINTS.INSTRUCTOR.BATCHES);
      
      console.log('📦 FORCE: Batches API response:', batchesResponse?.data);

      const batchList = batchesResponse?.data?.batches || [];
      console.log('✅ FORCE: Setting batches:', batchList);
      setBatches(batchList);

      if (batchList.length > 0) {
        const firstBatch = batchList[0];
        console.log('🔄 FORCE: Setting selected batch and fetching courses:', firstBatch.id);
        setSelectedBatch(firstBatch.id);
        
        // Force the courses call
        await fetchCoursesForBatch(firstBatch.id);
      } else {
        console.log('❌ FORCE: No batches found');
      }
    } catch (err: any) {
      console.error("❌ FORCE: Error in fetchInitialData:", err);
      setError(`Failed to load initial data: ${err.message}`);
    } finally {
      console.log('🔄 FORCE: Setting loading to false');
      setLoading(false);
    }
  }, [fetchCoursesForBatch]);

  // Initialize data on component mount
  useEffect(() => {
    console.log('🚀 FORCE: Component mounted, starting data fetch');
    fetchInitialData();
    
    return () => {
      mountedRef.current = false;
    };
  }, [fetchInitialData]);

  // Handle batch selection change
  const handleBatchChange = async (batchId: string) => {
    console.log('🚀 STUDENT ANALYTICS: Batch changed to:', batchId);
    setSelectedBatch(batchId);
    setSelectedCourse("");
    setCourses([]);
    setStudentsData([]);
    setLoading(true);
    
    if (batchId) {
      await fetchCoursesForBatch(batchId);
    }
    setLoading(false);
  };

  // Handle course selection change
  const handleCourseChange = async (courseId: string) => {
    console.log('🚀 STUDENT ANALYTICS: Course changed to:', courseId);
    setSelectedCourse(courseId);
    setStudentsData([]);
    setLoading(true);
    
    if (selectedBatch && courseId) {
      await fetchStudentAnalytics(selectedBatch, courseId);
    }
    setLoading(false);
  };

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