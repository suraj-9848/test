import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import apiClient from "../utils/axiosInterceptor";
import { API_ENDPOINTS, buildUrl } from "../config/urls";
import {
  Users,
  CheckCircle,
  XCircle,
  Target,
  FileText,
  Download,
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

// Custom Components with Tailwind CSS
interface MyCardProps {
  children: React.ReactNode;
  className?: string;
}
const MyCard = ({ children, className = "" }: MyCardProps) => (
  <div
    className={`border border-gray-200 rounded-lg shadow-sm bg-white ${className}`}
  >
    {children}
  </div>
);

interface MyCardHeaderProps {
  children: React.ReactNode;
  className?: string;
}
const MyCardHeader = ({ children, className = "" }: MyCardHeaderProps) => (
  <div className={`border-b border-gray-200 p-4 ${className}`}>{children}</div>
);

interface MyCardTitleProps {
  children: React.ReactNode;
  className?: string;
}
const MyCardTitle = ({ children, className = "" }: MyCardTitleProps) => (
  <h2 className={`text-lg font-semibold text-gray-900 ${className}`}>
    {children}
  </h2>
);

interface MyCardContentProps {
  children: React.ReactNode;
  className?: string;
}
const MyCardContent = ({ children, className = "" }: MyCardContentProps) => (
  <div className={`p-4 ${className}`}>{children}</div>
);

interface MySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  placeholder: string;
  disabled?: boolean;
}
const MySelect = ({
  value,
  onValueChange,
  children,
  placeholder,
  disabled = false,
}: MySelectProps) => (
  <select
    value={value}
    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
      onValueChange(e.target.value)
    }
    disabled={disabled}
    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
  >
    <option value="">{placeholder}</option>
    {children}
  </select>
);

interface MyInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
}
const MyInput = ({ value, onChange, placeholder }: MyInputProps) => (
  <input
    type="text"
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
  />
);

interface MyButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}
const MyButton = ({ onClick, children, className = "" }: MyButtonProps) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${className}`}
  >
    {children}
  </button>
);

interface MyTableProps {
  children: React.ReactNode;
}
const MyTable = ({ children }: MyTableProps) => (
  <table className="min-w-full divide-y divide-gray-200">{children}</table>
);

interface MyTableHeaderProps {
  children: React.ReactNode;
}
const MyTableHeader = ({ children }: MyTableHeaderProps) => (
  <thead className="bg-gray-50">{children}</thead>
);

interface MyTableRowProps {
  children: React.ReactNode;
}
const MyTableRow = ({ children }: MyTableRowProps) => <tr>{children}</tr>;

interface MyTableHeadProps {
  children: React.ReactNode;
}
const MyTableHead = ({ children }: MyTableHeadProps) => (
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
    {children}
  </th>
);

interface MyTableBodyProps {
  children: React.ReactNode;
}
const MyTableBody = ({ children }: MyTableBodyProps) => (
  <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>
);

interface MyTableCellProps {
  children: React.ReactNode;
  className?: string;
}
const MyTableCell = ({ children, className = "" }: MyTableCellProps) => (
  <td className={`px-6 py-4 whitespace-nowrap ${className}`}>{children}</td>
);

// Types (unchanged)
interface Batch {
  id: string;
  name: string;
}

interface Course {
  id: string;
  title: string;
}

interface Test {
  id: string;
  title: string;
}

interface StudentGave {
  id: string;
  username: string;
  email: string;
  submittedAt: string;
  Score: number;
  passingMarks: string;
  correctQuestions: number;
  wrongQuestions: number;
  notAttemptedQuestions: number;
}

interface StudentNotGave {
  id: string;
  username: string;
  email: string;
}

interface AnalyticsResponse {
  totalEnrolled: number;
  gaveTest: number;
  didNotGiveTest: number;
  studentsGave: StudentGave[];
  studentsNotGave: StudentNotGave[];
  totalAvgScore: number;
  earliestSubmission: string;
  latestSubmission: string;
  totalPossibleMarks: number;
}

interface TestAnalyticsProps {
  onClose?: () => void;
}

const TestAnalytics: React.FC<TestAnalyticsProps> = ({ onClose }) => {
  const { data: session, status } = useSession();

  // State
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedTest, setSelectedTest] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  // New filter states
  const [minScore, setMinScore] = useState<number | "">("");
  const [maxScore, setMaxScore] = useState<number | "">("");
  const [passStatus, setPassStatus] = useState<string>("");

  // Sorting states
  const [sortField, setSortField] = useState<string>("Score");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const mountedRef = useRef(true);

  // Data fetching functions (unchanged)
  const fetchTestAnalytics = useCallback(
    async (batchId: string, courseId: string, testId?: string) => {
      if (!batchId || !courseId || !mountedRef.current) return;
      try {
        setLoading(true);
        setError("");
        setAnalytics(null);
        if (testId) {
          const endpoint = API_ENDPOINTS.INSTRUCTOR.ANALYTICS.TEST_ANALYTICS(
            batchId,
            courseId,
            testId,
          );
          const url = buildUrl(endpoint);
          const response = await apiClient.get(url);
          if (mountedRef.current && response.data) {
            setAnalytics(response.data);
          }
        } else {
          setAnalytics(null);
        }
      } catch (err: any) {
        console.error("Error fetching test analytics:", err);
        if (mountedRef.current) setError("Failed to load test analytics");
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [],
  );

  const fetchTestsForCourse = useCallback(
    async (batchId: string, courseId: string) => {
      if (!batchId || !courseId || !mountedRef.current) return;
      try {
        const endpoint = API_ENDPOINTS.INSTRUCTOR.ANALYTICS.BATCH_COURSE_TESTS(
          batchId,
          courseId,
        );
        const url = buildUrl(endpoint);
        const response = await apiClient.get(url);
        if (!response || !mountedRef.current) return;
        const responseData = response.data;
        const testList = responseData.data?.tests || responseData.tests || [];
        setTests(testList);
        if (testList.length > 0) {
          setSelectedTest(testList[0].id);
          await fetchTestAnalytics(batchId, courseId, testList[0].id);
        }
      } catch (err: any) {
        console.error("Error fetching tests:", err);
        if (mountedRef.current)
          setError("Failed to load tests for the selected course");
      }
    },
    [fetchTestAnalytics],
  );

  const fetchCoursesForBatch = useCallback(
    async (batchId: string) => {
      if (!batchId || !mountedRef.current) return;
      try {
        const coursesResponse = await apiClient.get(
          `${API_ENDPOINTS.INSTRUCTOR.BATCHES}/${batchId}/courses`,
        );
        if (!coursesResponse || !mountedRef.current) return;
        const responseData = coursesResponse.data;
        const courseList = responseData.courses || [];
        setCourses(courseList);
        if (courseList.length > 0) {
          setSelectedCourse(courseList[0].id);
          await fetchTestsForCourse(batchId, courseList[0].id);
        }
      } catch (err: any) {
        console.error("Error fetching courses:", err);
        if (mountedRef.current)
          setError("Failed to load courses for the selected batch");
      }
    },
    [fetchTestsForCourse],
  );

  const fetchInitialData = useCallback(async () => {
    if (!mountedRef.current) return;
    if (status === "loading") return;
    try {
      setLoading(true);
      setError("");
      const batchesResponse = await apiClient.get(
        API_ENDPOINTS.INSTRUCTOR.BATCHES,
      );
      if (!batchesResponse || !mountedRef.current) return;
      const responseData = batchesResponse.data;
      const batchList = responseData.batches || [];
      setBatches(batchList);
      if (batchList.length > 0) {
        setSelectedBatch(batchList[0].id);
        await fetchCoursesForBatch(batchList[0].id);
      }
    } catch (err: any) {
      console.error("Error fetching initial data:", err);
      if (mountedRef.current) setError("Failed to load initial data");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [fetchCoursesForBatch, status]);

  useEffect(() => {
    mountedRef.current = true;
    fetchInitialData();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Handlers
  const handleBatchChange = useCallback(
    (batchId: string) => {
      setSelectedBatch(batchId);
      setSelectedCourse("");
      setSelectedTest("");
      setCourses([]);
      setTests([]);
      setAnalytics(null);
      if (batchId) fetchCoursesForBatch(batchId);
    },
    [fetchCoursesForBatch],
  );

  const handleCourseChange = useCallback(
    (courseId: string) => {
      setSelectedCourse(courseId);
      setSelectedTest("");
      setTests([]);
      setAnalytics(null);
      if (selectedBatch && courseId)
        fetchTestsForCourse(selectedBatch, courseId);
    },
    [selectedBatch, fetchTestsForCourse],
  );

  const handleTestChange = useCallback(
    (testId: string) => {
      setSelectedTest(testId);
      setAnalytics(null);
      if (selectedBatch && selectedCourse)
        fetchTestAnalytics(selectedBatch, selectedCourse, testId || undefined);
    },
    [selectedBatch, selectedCourse, fetchTestAnalytics],
  );

  // Filtered students
  // Filtering logic for students who gave test

  // Filtering and sorting logic for students who gave test
  const filteredStudentsGave =
    analytics?.studentsGave
      ?.filter((student) => {
        // Search filter
        const matchesSearch =
          student.username.toLowerCase().includes(search.toLowerCase()) ||
          student.email.toLowerCase().includes(search.toLowerCase());
        // Score filter
        const matchesMinScore = minScore === "" || student.Score >= minScore;
        const matchesMaxScore = maxScore === "" || student.Score <= maxScore;
        // Pass/Fail filter
        const matchesPassStatus =
          passStatus === "" || student.passingMarks === passStatus;
        return (
          matchesSearch &&
          matchesMinScore &&
          matchesMaxScore &&
          matchesPassStatus
        );
      })
      .sort((a, b) => {
        let compare = 0;
        if (sortField === "Score") {
          compare = a.Score - b.Score;
        } else if (sortField === "Username") {
          compare = a.username.localeCompare(b.username);
        } else if (sortField === "SubmittedAt") {
          compare =
            new Date(a.submittedAt).getTime() -
            new Date(b.submittedAt).getTime();
        }
        return sortOrder === "asc" ? compare : -compare;
      }) || [];

  const filteredStudentsNotGave =
    analytics?.studentsNotGave?.filter(
      (student) =>
        student.username.toLowerCase().includes(search.toLowerCase()) ||
        student.email.toLowerCase().includes(search.toLowerCase()),
    ) || [];

  // Chart data preparation
  const pieData = analytics
    ? [
        { name: "Gave Test", value: analytics.gaveTest },
        { name: "Did Not Give", value: analytics.didNotGiveTest },
      ]
    : [];

  const generateBarData = (
    studentsGave: StudentGave[],
    totalPossibleMarks: number,
  ) => {
    const binSize = 10;
    const bins = [];
    for (let i = 0; i <= totalPossibleMarks; i += binSize) {
      const binStart = i;
      const binEnd = Math.min(i + binSize - 1, totalPossibleMarks);
      const count = studentsGave.filter(
        (student) => student.Score >= binStart && student.Score <= binEnd,
      ).length;
      bins.push({ range: `${binStart}-${binEnd}`, count });
    }
    return bins;
  };

  const barData = analytics
    ? generateBarData(analytics.studentsGave, analytics.totalPossibleMarks)
    : [];

  // Loading and Error States
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {status === "loading"
              ? "Authenticating..."
              : "Loading analytics..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4 bg-white border border-red-200 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2 text-center">
            Error
          </h2>
          <p className="text-red-600 mb-4 text-center">{error}</p>
          <div className="flex justify-center">
            <button
              onClick={() => {
                setError("");
                fetchInitialData();
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const selectedBatchName =
    batches.find((b) => b.id === selectedBatch)?.name || "";
  const selectedCourseTitle =
    courses.find((c) => c.id === selectedCourse)?.title || "";
  const selectedTestTitle =
    tests.find((t) => t.id === selectedTest)?.title || "Selected Test";

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <MyCard>
          <MyCardHeader>
            <div className="flex items-center justify-between">
              <MyCardTitle className="text-2xl flex items-center gap-2">
                <span>📊</span> Test Analytics
              </MyCardTitle>
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  ✕
                </button>
              )}
            </div>
            <p className="text-gray-600">
              Advanced analytics for test performance tracking
            </p>
          </MyCardHeader>
        </MyCard>

        {/* Filters - streamlined and clear */}
        <MyCard>
          <MyCardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch
                </label>
                <MySelect
                  value={selectedBatch}
                  onValueChange={handleBatchChange}
                  placeholder="Select Batch"
                >
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.name}
                    </option>
                  ))}
                </MySelect>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course
                </label>
                <MySelect
                  value={selectedCourse}
                  onValueChange={handleCourseChange}
                  disabled={!selectedBatch}
                  placeholder="Select Course"
                >
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </MySelect>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test
                </label>
                <MySelect
                  value={selectedTest}
                  onValueChange={handleTestChange}
                  disabled={!selectedCourse}
                  placeholder="Select Test"
                >
                  {tests.map((test) => (
                    <option key={test.id} value={test.id}>
                      {test.title}
                    </option>
                  ))}
                </MySelect>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <MyInput
                  value={search}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search by name or email"
                />
              </div>
            </div>
          </MyCardContent>
        </MyCard>

        {/* Context and Analytics */}
        {analytics ? (
          <>
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedTestTitle}
              </h2>
              <p className="text-gray-600">
                {selectedBatchName} • {selectedCourseTitle}
              </p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <MyCard>
                <MyCardContent className="pt-6 flex flex-col items-center">
                  <Users className="text-gray-400 mb-2" size={24} />
                  <p className="text-sm text-gray-600">Total Enrolled</p>
                  <p className="text-2xl font-bold">
                    {analytics?.totalEnrolled ?? 0}
                  </p>
                </MyCardContent>
              </MyCard>
              <MyCard>
                <MyCardContent className="pt-6 flex flex-col items-center">
                  <CheckCircle className="text-green-600 mb-2" size={24} />
                  <p className="text-sm text-gray-600">Gave Test</p>
                  <p className="text-2xl font-bold text-green-600">
                    {analytics?.gaveTest ?? 0}
                  </p>
                </MyCardContent>
              </MyCard>
              <MyCard>
                <MyCardContent className="pt-6 flex flex-col items-center">
                  <XCircle className="text-red-600 mb-2" size={24} />
                  <p className="text-sm text-gray-600">Did Not Give</p>
                  <p className="text-2xl font-bold text-red-600">
                    {analytics?.didNotGiveTest ?? 0}
                  </p>
                </MyCardContent>
              </MyCard>
              <MyCard>
                <MyCardContent className="pt-6 flex flex-col items-center">
                  <Target className="text-purple-600 mb-2" size={24} />
                  <p className="text-sm text-gray-600">Avg Score</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {analytics?.totalAvgScore?.toFixed(2) ?? "0.00"}
                  </p>
                </MyCardContent>
              </MyCard>
              <MyCard>
                <MyCardContent className="pt-6 flex flex-col items-center">
                  <FileText className="text-blue-600 mb-2" size={24} />
                  <p className="text-sm text-gray-600">Possible Marks</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {analytics?.totalPossibleMarks ?? 0}
                  </p>
                </MyCardContent>
              </MyCard>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <MyCard>
                <MyCardHeader>
                  <MyCardTitle>Test Participation</MyCardTitle>
                </MyCardHeader>
                <MyCardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                        }
                      >
                        <Cell fill="#4ade80" />
                        <Cell fill="#f87171" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </MyCardContent>
              </MyCard>
              <MyCard>
                <MyCardHeader>
                  <MyCardTitle>Score Distribution</MyCardTitle>
                </MyCardHeader>
                <MyCardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </MyCardContent>
              </MyCard>
            </div>

            {/* Export - clear and prominent */}
            <div className="flex justify-end mb-4">
              <MyButton
                onClick={() => {
                  const wb = XLSX.utils.book_new();
                  const gaveSheet = XLSX.utils.json_to_sheet(
                    filteredStudentsGave.map((s) => ({
                      Username: s.username,
                      Email: s.email,
                      Score: s.Score,
                      Passing: s.passingMarks,
                      Correct: s.correctQuestions,
                      Wrong: s.wrongQuestions,
                      NotAttempted: s.notAttemptedQuestions,
                      SubmittedAt: s.submittedAt,
                    })),
                  );
                  const notGaveSheet = XLSX.utils.json_to_sheet(
                    filteredStudentsNotGave.map((s) => ({
                      Username: s.username,
                      Email: s.email,
                    })),
                  );
                  XLSX.utils.book_append_sheet(wb, gaveSheet, "GaveTest");
                  XLSX.utils.book_append_sheet(wb, notGaveSheet, "NotGaveTest");
                  XLSX.writeFile(
                    wb,
                    `test-analytics-${selectedTestTitle.replace(
                      /\s+/g,
                      "-",
                    )}.xlsx`,
                  );
                }}
              >
                <Download className="mr-2 h-4 w-4" /> Download Excel
              </MyButton>
            </div>

            {/* Tables - only one main table, below that a neat list for not given */}
            <MyCard className="mb-6">
              <MyCardHeader>
                <MyCardTitle>
                  Students Who Gave Test ({filteredStudentsGave.length})
                </MyCardTitle>
              </MyCardHeader>
              <MyCardContent>
                {/* Filter controls for table */}
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Min Score
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={analytics?.totalPossibleMarks ?? 100}
                      value={minScore}
                      onChange={(e) =>
                        setMinScore(
                          e.target.value === "" ? "" : Number(e.target.value),
                        )
                      }
                      className="block w-full px-2 py-1 border border-gray-300 rounded-md"
                      placeholder="Min"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Max Score
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={analytics?.totalPossibleMarks ?? 100}
                      value={maxScore}
                      onChange={(e) =>
                        setMaxScore(
                          e.target.value === "" ? "" : Number(e.target.value),
                        )
                      }
                      className="block w-full px-2 py-1 border border-gray-300 rounded-md"
                      placeholder="Max"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Pass/Fail
                    </label>
                    <select
                      value={passStatus}
                      onChange={(e) => setPassStatus(e.target.value)}
                      className="block w-full px-2 py-1 border border-gray-300 rounded-md"
                    >
                      <option value="">All</option>
                      <option value="Passed">Passed</option>
                      <option value="Failed">Failed</option>
                    </select>
                  </div>
                  {/* Sorting controls */}
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Sort By
                    </label>
                    <select
                      value={sortField}
                      onChange={(e) => setSortField(e.target.value)}
                      className="block w-full px-2 py-1 border border-gray-300 rounded-md"
                    >
                      <option value="Score">Score</option>
                      <option value="Username">Username</option>
                      <option value="SubmittedAt">Submission Date</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Order
                    </label>
                    <select
                      value={sortOrder}
                      onChange={(e) =>
                        setSortOrder(e.target.value as "asc" | "desc")
                      }
                      className="block w-full px-2 py-1 border border-gray-300 rounded-md"
                    >
                      <option value="asc">Ascending</option>
                      <option value="desc">Descending</option>
                    </select>
                  </div>
                </div>
                <MyTable>
                  <MyTableHeader>
                    <MyTableRow>
                      <MyTableHead>Username</MyTableHead>
                      <MyTableHead>Email</MyTableHead>
                      <MyTableHead>Score</MyTableHead>
                      <MyTableHead>Status</MyTableHead>
                      <MyTableHead>Correct</MyTableHead>
                      <MyTableHead>Wrong</MyTableHead>
                      <MyTableHead>Not Attempted</MyTableHead>
                      <MyTableHead>Submitted</MyTableHead>
                    </MyTableRow>
                  </MyTableHeader>
                  <MyTableBody>
                    {filteredStudentsGave.map((student) => (
                      <MyTableRow key={student.id}>
                        <MyTableCell>{student.username}</MyTableCell>
                        <MyTableCell>{student.email}</MyTableCell>
                        <MyTableCell>{student.Score}</MyTableCell>
                        <MyTableCell
                          className={
                            student.passingMarks === "Passed"
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {student.passingMarks}
                        </MyTableCell>
                        <MyTableCell>{student.correctQuestions}</MyTableCell>
                        <MyTableCell>{student.wrongQuestions}</MyTableCell>
                        <MyTableCell>
                          {student.notAttemptedQuestions}
                        </MyTableCell>
                        <MyTableCell>
                          {new Date(student.submittedAt).toLocaleString()}
                        </MyTableCell>
                      </MyTableRow>
                    ))}
                  </MyTableBody>
                </MyTable>
              </MyCardContent>
            </MyCard>
            <MyCard>
              <MyCardHeader>
                <MyCardTitle>
                  Students Who Did Not Give Test (
                  {filteredStudentsNotGave.length})
                </MyCardTitle>
              </MyCardHeader>
              <MyCardContent>
                {/* Download Not Gave Test Students Button */}
                <div className="flex justify-end mb-4">
                  <MyButton
                    onClick={() => {
                      const wb = XLSX.utils.book_new();
                      const notGaveSheet = XLSX.utils.json_to_sheet(
                        filteredStudentsNotGave.map((s) => ({
                          Username: s.username,
                          Email: s.email,
                        })),
                      );
                      XLSX.utils.book_append_sheet(
                        wb,
                        notGaveSheet,
                        "NotGaveTest",
                      );
                      XLSX.writeFile(
                        wb,
                        `not-gave-test-students-${selectedTestTitle.replace(
                          /\s+/g,
                          "-",
                        )}.xlsx`,
                      );
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" /> Download Not Gave
                    Excel
                  </MyButton>
                </div>
                <ul className="divide-y divide-gray-200">
                  {filteredStudentsNotGave.length === 0 ? (
                    <li className="py-2 text-gray-500">
                      All students have given the test.
                    </li>
                  ) : (
                    filteredStudentsNotGave.map((student) => (
                      <li
                        key={student.id}
                        className="py-2 flex justify-between items-center"
                      >
                        <span className="font-medium text-gray-800">
                          {student.username}
                        </span>
                        <span className="text-gray-600">{student.email}</span>
                      </li>
                    ))
                  )}
                </ul>
              </MyCardContent>
            </MyCard>
          </>
        ) : (
          <MyCard className="text-center">
            <MyCardContent className="pt-6">
              <p className="text-4xl text-gray-400 mb-4">📊</p>
              <h3 className="text-lg font-medium mb-2">
                {!selectedBatch || !selectedCourse
                  ? "Select Filters"
                  : "No Analytics Available"}
              </h3>
              <p className="text-gray-600">
                {!selectedBatch || !selectedCourse
                  ? "Please select a batch and course to view analytics"
                  : "No data found for the selected filters"}
              </p>
            </MyCardContent>
          </MyCard>
        )}
      </div>
    </div>
  );
};

export default TestAnalytics;
