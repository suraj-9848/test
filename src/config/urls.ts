// Centralized URL configuration for Admin Dashboard

// Base URLs
export const BASE_URLS = {
  BACKEND: process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://localhost:3000",
  FRONTEND: process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3002",
  STUDENT_LMS:
    process.env.NEXT_PUBLIC_STUDENT_LMS_URL || "http://localhost:3001",
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: "/api/auth/login",
    ADMIN_LOGIN: "/api/auth/admin-login",
    EXCHANGE: "/api/auth/exchange",
    REFRESH: "/api/auth/refresh",
    VERIFY: "/api/auth/verify",
    LOGOUT: "/api/auth/logout",
    LOGOUT_ALL: "/api/auth/logout-all",
    ME: "/api/auth/me",
    CLEANUP_TOKENS: "/api/auth/cleanup-tokens",
  },

  // Admin Routes
  ADMIN: {
    USERS: "/api/admin/users",
    USER_BY_ID: (id: string) => `/api/admin/users/${id}`,
    ORGANIZATIONS: "/api/admin/organizations",
    ORGANIZATION_BY_ID: (id: string) => `/api/admin/organizations/${id}`,
    PAYMENTS: "/api/admin/payments",
    PAYMENT_BY_ID: (id: string) => `/api/admin/payments/${id}`,
    ANALYTICS: "/api/admin/analytics",
    SYSTEM_HEALTH: "/api/admin/system/health",
    USER_STATS: "/api/admin/users/stats",
    BULK_CREATE_USERS: "/api/admin/users/bulk-create",
    BULK_DELETE_USERS: "/api/admin/users/bulk-delete",
  },

  // Instructor Routes
  INSTRUCTOR: {
    // Courses
    COURSES: "/api/instructor/courses",
    COURSE_BY_ID: (id: string) => `/api/instructor/courses/${id}`,
    COURSE_EDIT: (id: string) => `/api/instructor/courses/${id}/edit`,

    // Batches
    BATCHES: "/api/instructor/batches",
    BATCH_BY_ID: (id: string) => `/api/instructor/batches/${id}`,
    BATCH_COURSES: (batchId: string) =>
      `/api/instructor/batches/${batchId}/courses`,
    BATCH_COURSE_ASSIGN_STUDENT: (batchId: string, courseId: string) =>
      `/api/instructor/batches/${batchId}/courses/${courseId}/assign-student`,
    BATCH_COURSE_PROGRESS: (batchId: string, courseId: string) =>
      `/api/instructor/batches/${batchId}/courses/${courseId}/progress`,

    // Batch Student Management
    BATCH_STUDENTS: (batchId: string) =>
      `/api/instructor/batches/${batchId}/students`,
    BATCH_REMOVE_STUDENTS: (batchId: string) =>
      `/api/instructor/batches/${batchId}/remove-students`,
    BATCH_STUDENT_CHECK: (batchId: string, studentId: string) =>
      `/api/instructor/batches/${batchId}/students/${studentId}/check`,
    BATCH_BULK_ASSIGN: "/api/instructor/batches/bulk-assign",
    BATCH_TRANSFER_STUDENT: "/api/instructor/batches/transfer-student",
    BATCH_ASSIGN_STUDENTS: (batchId: string) =>
      `/api/instructor/batches/${batchId}/assign-students`,
    BATCHES_WITH_STUDENT_COUNT:
      "/api/instructor/batches?include_student_count=true",
    STUDENTS_WITH_BATCHES: "/api/instructor/students-with-batches",
    USER_BATCHES: (userId: string) => `/api/instructor/users/${userId}/batches`,

    // Tests
    TESTS: "/api/instructor/tests",
    TEST_BY_ID: (id: string) => `/api/instructor/tests/${id}`,
    TEST_QUESTIONS: (testId: string) =>
      `/api/instructor/tests/${testId}/questions`,
    TEST_QUESTION_BY_ID: (testId: string, questionId: string) =>
      `/api/instructor/tests/${testId}/questions/${questionId}`,
    BATCH_COURSE_TESTS: (batchId: string, courseId: string) =>
      `/api/instructor/batches/${batchId}/courses/${courseId}/tests`,
    BATCH_COURSE_BULK_TESTS: (batchId: string) =>
      `/api/instructor/batches/${batchId}/courses/bulk/tests`,
    BATCH_COURSE_TEST_BY_ID: (
      batchId: string,
      courseId: string,
      testId: string,
    ) =>
      `/api/instructor/batches/${batchId}/courses/${courseId}/tests/${testId}`,
    BATCH_COURSE_TEST_QUESTIONS: (
      batchId: string,
      courseId: string,
      testId: string,
    ) =>
      `/api/instructor/batches/${batchId}/courses/${courseId}/tests/${testId}/questions`,
    BATCH_COURSE_TEST_QUESTION_BY_ID: (
      batchId: string,
      courseId: string,
      testId: string,
      questionId: string,
    ) =>
      `/api/instructor/batches/${batchId}/courses/${courseId}/tests/${testId}/questions/${questionId}`,

    // Modules
    BATCH_COURSE_MODULES: (batchId: string, courseId: string) =>
      `/api/instructor/batches/${batchId}/courses/${courseId}/modules`,
    BATCH_COURSE_MODULE_CREATE: (batchId: string, courseId: string) =>
      `/api/instructor/batches/${batchId}/courses/${courseId}/modules`,
    BATCH_COURSE_MODULE_BY_ID: (
      batchId: string,
      courseId: string,
      moduleId: string,
    ) =>
      `/api/instructor/batches/${batchId}/courses/${courseId}/modules/${moduleId}`,

    // Day Content
    BATCH_COURSE_MODULE_DAY_CONTENT: (
      batchId: string,
      courseId: string,
      moduleId: string,
    ) =>
      `/api/instructor/batches/${batchId}/courses/${courseId}/modules/${moduleId}/day-content`,
    BATCH_COURSE_MODULE_DAY_CONTENT_BY_ID: (
      batchId: string,
      courseId: string,
      moduleId: string,
      dayContentId: string,
    ) =>
      `/api/instructor/batches/${batchId}/courses/${courseId}/modules/${moduleId}/day-content/${dayContentId}`,

    // MCQs
    BATCH_COURSE_MODULE_MCQ: (
      batchId: string,
      courseId: string,
      moduleId: string,
    ) =>
      `/api/instructor/batches/${batchId}/courses/${courseId}/modules/${moduleId}/mcq`,
    BATCH_COURSE_MODULE_MCQ_BY_ID: (
      batchId: string,
      courseId: string,
      moduleId: string,
      mcqId: string,
    ) =>
      `/api/instructor/batches/${batchId}/courses/${courseId}/modules/${moduleId}/mcq/${mcqId}`,
    BATCH_COURSE_TEST_PUBLISH: (
      batchId: string,
      courseId: string,
      testId: string,
    ) =>
      `/api/instructor/batches/${batchId}/courses/${courseId}/tests/${testId}/publish`,
    BATCH_COURSE_TEST_EVALUATE: (
      batchId: string,
      courseId: string,
      testId: string,
    ) =>
      `/api/instructor/batches/${batchId}/courses/${courseId}/tests/${testId}/evaluate`,
    BATCH_COURSE_TEST_SUBMISSION_COUNT: (
      batchId: string,
      courseId: string,
      testId: string,
    ) =>
      `/api/instructor/batches/${batchId}/courses/${courseId}/tests/${testId}/submission-count`,

    // Students
    STUDENTS: "/api/instructor/students",

    // Analytics (updated to match actual backend routes)
    ANALYTICS: {
      // General analytics endpoints
      STUDENTS: "/api/instructor/analytics/students",
      PROGRESS: "/api/instructor/analytics/progress",
      TESTS: "/api/instructor/analytics/tests",
      BATCHES: "/api/instructor/analytics/batches",
      EVALUATION: "/api/instructor/analytics/evaluation",
      // Specific batch/course analytics endpoints:
      BATCH_COURSE_PROGRESS: (batchId: string, courseId: string) =>
        `/api/instructor/batches/${batchId}/courses/${courseId}/progress`,
      BATCH_COURSE_TESTS: (batchId: string, courseId: string) =>
        `/api/instructor/batches/${batchId}/courses/${courseId}/tests`,
      BATCH_COURSE_TEST_STATS: (batchId: string, courseId: string) =>
        `/api/instructor/batches/${batchId}/courses/${courseId}/test-stats`,
      BATCH_COURSE_LEADERBOARD: (batchId: string, courseId: string) =>
        `/api/instructor/batches/${batchId}/courses/${courseId}/leaderboard`,
      TEST_ANALYTICS: (batchId: string, courseId: string, testId: string) =>
        `/api/instructor/batches/${batchId}/courses/${courseId}/tests/${testId}/analytics`,
      EVALUATION_STATISTICS: (
        batchId: string,
        courseId: string,
        testId: string,
      ) =>
        `/api/instructor/batches/${batchId}/courses/${courseId}/tests/${testId}/evaluation-statistics`,

      // New analytics endpoints for complete data
      BATCH_STUDENTS: (batchId: string) =>
        `/api/instructor/batches/${batchId}/students`,
      STUDENT_COURSE_SCORES: (
        batchId: string,
        courseId: string,
        studentId: string,
      ) =>
        `/api/instructor/batches/${batchId}/courses/${courseId}/students/${studentId}/scores`,
      BATCH_ATTENDANCE: (batchId: string) =>
        `/api/instructor/batches/${batchId}/analytics/attendance`,
    },

    // Dashboard
    DASHBOARD: {
      OVERVIEW: "/api/instructor/dashboard/overview",
      STATS: "/api/instructor/dashboard/analytics",
    },

    // Test Management
    TEST_MANAGEMENT: {
      EVALUATE: "/api/instructor/test-management/evaluate",
      SUBMISSIONS: "/api/instructor/test-management/submissions",
      SUBMISSION_BY_ID: (id: string) =>
        `/api/instructor/test-management/submissions/${id}`,
    },

    // Progress Tracking
    PROGRESS: {
      COURSE: (courseId: string) =>
        `/api/instructor/progress/courses/${courseId}`,
      BATCH: (batchId: string) => `/api/instructor/progress/batches/${batchId}`,
      STUDENT: (studentId: string) =>
        `/api/instructor/progress/students/${studentId}`,
    },
  },

  // Recruiter Routes
  RECRUITER: {
    // Recruiter-specific API endpoints
    DASHBOARD: "/api/recruiter/dashboard",
    JOBS: "/api/recruiter/jobs",
    JOB_BY_ID: (id: string) => `/api/recruiter/jobs/${id}`,
    APPLICATIONS: "/api/recruiter/applications",
    SUBSCRIPTIONS: "/api/recruiter/subscriptions",
    SUBSCRIPTION_BY_ID: (id: string) => `/api/recruiter/subscriptions/${id}`,
  },

  // Course Management
  COURSES: {
    LIST: "/api/courses",
    CREATE: "/api/courses",
    BY_ID: (id: string) => `/api/courses/${id}`,
    UPDATE: (id: string) => `/api/courses/${id}`,
    DELETE: (id: string) => `/api/courses/${id}`,
    MODULES: (courseId: string) => `/api/courses/${courseId}/modules`,
    MODULE_BY_ID: (courseId: string, moduleId: string) =>
      `/api/courses/${courseId}/modules/${moduleId}`,
  },

  // Module Management
  MODULES: {
    LIST: "/api/modules",
    CREATE: "/api/modules",
    BY_ID: (id: string) => `/api/modules/${id}`,
    UPDATE: (id: string) => `/api/modules/${id}`,
    DELETE: (id: string) => `/api/modules/${id}`,
    CONTENT: (id: string) => `/api/modules/${id}/content`,
    MCQ: (id: string) => `/api/modules/${id}/mcq`,
  },

  // Batch Management
  BATCHES: {
    LIST: "/api/batches",
    CREATE: "/api/batches",
    BY_ID: (id: string) => `/api/batches/${id}`,
    UPDATE: (id: string) => `/api/batches/${id}`,
    DELETE: (id: string) => `/api/batches/${id}`,
    STUDENTS: (id: string) => `/api/batches/${id}/students`,
    ASSIGN_COURSE: (batchId: string, courseId: string) =>
      `/api/batches/${batchId}/courses/${courseId}`,
  },

  // User Management
  USERS: {
    LIST: "/api/users",
    CREATE: "/api/users",
    BY_ID: (id: string) => `/api/users/${id}`,
    UPDATE: (id: string) => `/api/users/${id}`,
    DELETE: (id: string) => `/api/users/${id}`,
    PROFILE: "/api/users/profile",
  },

  // Hiring Portal
  HIRING: {
    JOBS: "/api/hiring/jobs",
    JOB_BY_ID: (id: string) => `/api/hiring/jobs/${id}`,
    APPLICATIONS: "/api/hiring/applications",
    APPLICATION_BY_ID: (id: string) => `/api/hiring/applications/${id}`,
    APPLY: (jobId: string) => `/api/hiring/jobs/${jobId}/apply`,
  },

  // File Upload
  UPLOAD: {
    GENERAL: "/api/upload",
    RESUME: "/api/upload/resume",
    PROFILE_IMAGE: "/api/upload/profile-image",
    COURSE_MATERIALS: "/api/upload/course-materials",
  },
} as const;

// Full URL builders
export const buildUrl = (
  endpoint: string,
  baseUrl: string = BASE_URLS.BACKEND,
): string => {
  return `${baseUrl}${endpoint}`;
};

export const buildAuthUrl = (endpoint: string): string => {
  return buildUrl(endpoint, BASE_URLS.BACKEND);
};

export const buildApiUrl = (endpoint: string): string => {
  return buildUrl(endpoint, BASE_URLS.BACKEND);
};

// Domain mapping for unified login redirects
export const DOMAIN_MAPPINGS = {
  ADMIN_TO_LMS: {
    localhost: "localhost:3001",
    "admin-stg.nirudhyog.com": "lms-stg.nirudhyog.com",
    "admin-dev.nirudhyog.com": "lms-dev.nirudhyog.com",
    "admin.nirudhyog.com": "lms.nirudhyog.com",
  },
  LMS_TO_ADMIN: {
    localhost: "localhost:3002",
    "lms-stg.nirudhyog.com": "admin-stg.nirudhyog.com",
    "lms-dev.nirudhyog.com": "admin-dev.nirudhyog.com",
    "lms.nirudhyog.com": "admin.nirudhyog.com",
  },
} as const;

// Helper function to get admin dashboard URL from current LMS URL
export const getAdminDashboardUrl = (): string | null => {
  if (typeof window === "undefined") return null;

  const currentHost = window.location.hostname;
  const currentPort = window.location.port;
  const currentProtocol = window.location.protocol;

  const adminHost =
    DOMAIN_MAPPINGS.LMS_TO_ADMIN[
      currentHost as keyof typeof DOMAIN_MAPPINGS.LMS_TO_ADMIN
    ];

  if (adminHost) {
    return `${currentProtocol}//${adminHost}`;
  }

  // Fallback for localhost
  if (currentHost === "localhost") {
    return `${currentProtocol}//localhost:3002`;
  }

  return null;
};

// Helper function to get LMS URL from current admin dashboard URL
export const getLMSUrl = (): string | null => {
  if (typeof window === "undefined") return null;

  const currentHost = window.location.hostname;
  const currentProtocol = window.location.protocol;

  const lmsHost =
    DOMAIN_MAPPINGS.ADMIN_TO_LMS[
      currentHost as keyof typeof DOMAIN_MAPPINGS.ADMIN_TO_LMS
    ];

  if (lmsHost) {
    return `${currentProtocol}//${lmsHost}`;
  }

  return null;
};

// Export commonly used URLs
export const COMMON_URLS = {
  // Authentication URLs
  ADMIN_LOGIN: buildAuthUrl(API_ENDPOINTS.AUTH.ADMIN_LOGIN),
  REFRESH_TOKEN: buildAuthUrl(API_ENDPOINTS.AUTH.REFRESH),
  LOGOUT: buildAuthUrl(API_ENDPOINTS.AUTH.LOGOUT),

  // Instructor URLs
  COURSES: buildApiUrl(API_ENDPOINTS.INSTRUCTOR.COURSES),
  BATCHES: buildApiUrl(API_ENDPOINTS.INSTRUCTOR.BATCHES),
  ANALYTICS_STUDENTS: buildApiUrl(API_ENDPOINTS.INSTRUCTOR.ANALYTICS.STUDENTS),
  ANALYTICS_PROGRESS: buildApiUrl(API_ENDPOINTS.INSTRUCTOR.ANALYTICS.PROGRESS),

  // Admin URLs
  ADMIN_USERS: buildApiUrl(API_ENDPOINTS.ADMIN.USERS),
  ADMIN_ORGANIZATIONS: buildApiUrl(API_ENDPOINTS.ADMIN.ORGANIZATIONS),
} as const;
