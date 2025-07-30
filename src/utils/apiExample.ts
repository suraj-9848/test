// Example usage of the API client with automatic token handling
// Import the configured axios instance instead of creating new ones

import apiClient from './axiosInterceptor';

// Example 1: Simple GET request
export const getStudentAnalytics = async (batchId: string) => {
  try {
    const response = await apiClient.get(`/api/instructor/analytics/students?batchId=${batchId}`);
    return response.data;
  } catch (error) {
    // Error is automatically handled by interceptor
    // Token refresh/logout happens automatically
    console.error('Failed to fetch student analytics:', error);
    throw error;
  }
};

// Example 2: POST request with data
export const createCourse = async (courseData: any) => {
  try {
    const response = await apiClient.post('/api/instructor/courses', courseData);
    return response.data;
  } catch (error) {
    console.error('Failed to create course:', error);
    throw error;
  }
};

// Example 3: PUT request for updates
export const updateBatch = async (batchId: string, updateData: any) => {
  try {
    const response = await apiClient.put(`/api/instructor/batches/${batchId}`, updateData);
    return response.data;
  } catch (error) {
    console.error('Failed to update batch:', error);
    throw error;
  }
};

// Example 4: DELETE request
export const deleteCourse = async (courseId: string) => {
  try {
    const response = await apiClient.delete(`/api/instructor/courses/${courseId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete course:', error);
    throw error;
  }
};

// Example 5: Using with React component
/*
import React, { useEffect, useState } from 'react';
import { getStudentAnalytics } from './utils/apiExample';

export const StudentAnalyticsComponent = ({ batchId }: { batchId: string }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const analytics = await getStudentAnalytics(batchId);
        setData(analytics);
      } catch (err) {
        setError(err.message);
        // If token expired, user will be automatically redirected to login
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [batchId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return <div>{JSON.stringify(data)}</div>;
};
*/

// Example 6: Handling specific errors
export const getCoursesWithErrorHandling = async () => {
  try {
    const response = await apiClient.get('/api/instructor/courses');
    return response.data;
  } catch (error: any) {
    // The interceptor will handle token expiry automatically
    // But you can still handle other specific errors
    if (error.response?.status === 403) {
      throw new Error('You do not have permission to access courses');
    } else if (error.response?.status === 404) {
      throw new Error('Courses not found');
    } else {
      throw new Error('Failed to fetch courses');
    }
  }
};

// Example 7: Request with custom headers
export const uploadFile = async (formData: FormData) => {
  try {
    const response = await apiClient.post('/api/instructor/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to upload file:', error);
    throw error;
  }
};

/**
 * IMPORTANT NOTES:
 * 
 * 1. Always use the imported `apiClient` instead of creating new axios instances
 * 2. The interceptor will automatically:
 *    - Add Authorization headers
 *    - Check token expiry before requests
 *    - Attempt token refresh on 401 errors
 *    - Redirect to login if refresh fails
 * 
 * 3. You don't need to:
 *    - Manually add Authorization headers
 *    - Handle token expiry in your components
 *    - Redirect users on authentication errors
 * 
 * 4. The interceptor will redirect users to the unified login:
 *    - localhost → localhost:3001/sign-in
 *    - admin-stg.nirudhyog.com → lms-stg.nirudhyog.com/sign-in
 *    - admin-dev.nirudhyog.com → lms-dev.nirudhyog.com/sign-in
 *    - admin.nirudhyog.com → lms.nirudhyog.com/sign-in
 */ 