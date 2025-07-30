'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { FaBook, FaSave, FaTimes, FaSpinner, FaArrowLeft } from 'react-icons/fa';
import { instructorApi } from '@/api/instructorApi';
import { UpdateCourseData, Course, Batch } from '@/store/courseStore';

const EditCoursePage = () => {
  const router = useRouter();
  const { id } = useParams();
  const courseId = id as string;
  const { data: session } = useSession();

  // State
  const [course, setCourse] = useState<Course | null>(null);
  const [allBatches, setAllBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<UpdateCourseData>({
    title: '',
    logo: '',
    start_date: '',
    end_date: '',
    batch_ids: [],
    is_public: false,
    instructor_name: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Helper function to fetch batches for a course
  const fetchCourseBatches = useCallback(async (courseId: string): Promise<Batch[]> => {
    try {
      const allBatchesWithCourses = await Promise.all(
        allBatches.map(async (batch) => {
          try {
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/instructor/batches/${batch.id}/courses`,
              {
                headers: { Authorization: `Bearer ${sessionStorage.getItem('adminToken')}` },
              }
            );
            if (!response.ok) return null;
            const data = await response.json();
            const courses = data.courses || [];
            const hasCourse = courses.some((c: Course) => c.id === courseId);
            return hasCourse ? batch : null;
          } catch (err) {
            console.warn(`Failed to check batch ${batch.id} for course ${courseId}:`, err);
            return null;
          }
        })
      );
      return allBatchesWithCourses.filter(Boolean) as Batch[];
    } catch (err) {
      console.error('Error fetching course batches:', err);
      return [];
    }
  }, [allBatches]);

  // Fetch course and batches
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all batches first
        const batchesResponse = await instructorApi.getBatches();
        setAllBatches(batchesResponse.batches || []);
        
        // Fetch course details
        const apiCourse = await instructorApi.getCourseById(courseId);
        
        // Map API course type to our internal type with batches
        const mappedCourse: Course = {
          ...apiCourse,
          batches: await fetchCourseBatches(apiCourse.id)
        };
        
        setCourse(mappedCourse);
        
        // Initialize form with course data
        setFormData({
          title: apiCourse.title || '',
          logo: apiCourse.logo || '',
          start_date: formatDateForInput(apiCourse.start_date) || '',
          end_date: formatDateForInput(apiCourse.end_date) || '',
          batch_ids: mappedCourse.batches?.map(b => b.id) || [],
          is_public: apiCourse.is_public || false,
          instructor_name: apiCourse.instructor_name || '',
        });
      } catch (err) {
        console.error('Error fetching course data:', err);
        setError('Failed to load course data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchData();
    }
  }, [courseId, session, fetchCourseBatches]);

  // Format date for input field (YYYY-MM-DD)
  const formatDateForInput = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.title?.trim()) {
      errors.title = 'Course title is required';
    }
    
    if (!formData.start_date) {
      errors.start_date = 'Start date is required';
    }
    
    if (!formData.end_date) {
      errors.end_date = 'End date is required';
    }
    
    if (formData.start_date && formData.end_date && 
        new Date(formData.start_date) >= new Date(formData.end_date)) {
      errors.end_date = 'End date must be after start date';
    }
    
    if (!formData.batch_ids || formData.batch_ids.length === 0) {
      errors.batch_ids = 'At least one batch must be assigned';
    }
    
    if (!formData.instructor_name?.trim()) {
      errors.instructor_name = 'Instructor name is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      // Use first batch as primary batch for API call
      // This will be improved when backend supports direct course update without batch
      const primaryBatchId = formData.batch_ids?.[0] || '';
      
      if (!primaryBatchId) {
        throw new Error('No batches selected');
      }
      
      await instructorApi.updateCourse(courseId, formData);
      
      // Navigate back to courses list
      router.push('/dashboard/instructor/courses');
    } catch (err) {
      console.error('Error updating course:', err);
      setError(err instanceof Error ? err.message : 'Failed to update course');
    } finally {
      setSaving(false);
    }
  };

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : value
    }));
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle batch selection
  const handleBatchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(
      e.target.selectedOptions,
      option => option.value
    );
    
    setFormData(prev => ({ ...prev, batch_ids: selectedOptions }));
    
    if (formErrors.batch_ids) {
      setFormErrors(prev => ({ ...prev, batch_ids: '' }));
    }
  };

  // Cancel edit and go back
  const handleCancel = () => {
    router.back();
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <FaSpinner className="animate-spin text-blue-600 text-3xl" />
          <span className="text-gray-600">Loading course data...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !course) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
          <p>{error}</p>
          <button 
            onClick={() => router.back()}
            className="mt-2 text-sm font-medium text-red-700 hover:text-red-900"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header with back button */}
      <div className="flex items-center mb-8">
        <button
          onClick={() => router.back()}
          className="mr-4 p-2 bg-white rounded-full shadow hover:bg-gray-100 transition-colors"
          aria-label="Go back"
        >
          <FaArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <FaBook className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Edit Course
            </h1>
            <p className="text-slate-600 mt-1">
              Update details for {course?.title}
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-4xl mb-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            {error}
          </div>
        </div>
      )}

      {/* Form */}
      <div className="max-w-4xl">
        <form
          onSubmit={handleSubmit}
          className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-lg p-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Course Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200 ${
                    formErrors.title
                      ? "border-red-300 focus:ring-red-500"
                      : "border-slate-200"
                  }`}
                  placeholder="Enter course title"
                  disabled={saving}
                />
                {formErrors.title && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Logo URL
                </label>
                <input
                  type="url"
                  name="logo"
                  value={formData.logo}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                  placeholder="https://example.com/logo.jpg"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200 ${
                    formErrors.start_date
                      ? "border-red-300 focus:ring-red-500"
                      : "border-slate-200"
                  }`}
                  disabled={saving}
                />
                {formErrors.start_date && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.start_date}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200 ${
                    formErrors.end_date
                      ? "border-red-300 focus:ring-red-500"
                      : "border-slate-200"
                  }`}
                  disabled={saving}
                />
                {formErrors.end_date && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.end_date}</p>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Select Batches *
                </label>
                <select
                  name="batch_ids"
                  multiple
                  value={formData.batch_ids}
                  onChange={handleBatchChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200 ${
                    formErrors.batch_ids
                      ? "border-red-300 focus:ring-red-500"
                      : "border-slate-200"
                  }`}
                  disabled={saving}
                  style={{ minHeight: "100px" }}
                >
                  {allBatches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.name}
                    </option>
                  ))}
                </select>
                {formErrors.batch_ids && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.batch_ids}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Hold Ctrl/Cmd to select multiple batches
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Instructor Name *
                </label>
                <input
                  type="text"
                  name="instructor_name"
                  value={formData.instructor_name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200 ${
                    formErrors.instructor_name
                      ? "border-red-300 focus:ring-red-500"
                      : "border-slate-200"
                  }`}
                  placeholder="Enter instructor name"
                  disabled={saving}
                />
                {formErrors.instructor_name && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.instructor_name}
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-center space-x-2 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    name="is_public"
                    checked={formData.is_public}
                    onChange={handleInputChange}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    disabled={saving}
                  />
                  <span>Make this course public</span>
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center space-x-2 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all duration-200"
              disabled={saving}
            >
              <FaTimes className="w-4 h-4" />
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={saving}
            >
              {saving ? (
                <>
                  <FaSpinner className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FaSave className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCoursePage;
