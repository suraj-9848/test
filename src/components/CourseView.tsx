import React, { useState, useEffect } from "react";
import { BookOpen, Calendar, ChevronRight, Layers } from "lucide-react";
import "@/styles/module-mcq-management.css";

interface Batch {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  studentCount?: number;
}

interface Course {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  instructor_name: string;
  moduleCount?: number;
}

export const CoursesView: React.FC<{
  data: Course[];
  onSelect: (course: Course) => void;
  loading: boolean;
}> = ({ data, onSelect, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">
          No courses found
        </h3>
        <p className="text-gray-500">No courses found in this batch.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {data.map((course) => (
        <div
          key={course.id}
          onClick={() => onSelect(course)}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-green-300 transition-all duration-200 cursor-pointer group"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                  {course.title}
                </h3>
                <p className="text-sm text-gray-500">
                  by {course.instructor_name}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
          </div>

          {course.description && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {course.description}
            </p>
          )}

          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(course.start_date).toLocaleDateString()}</span>
            </div>
            {course.moduleCount !== undefined && (
              <div className="flex items-center space-x-1">
                <Layers className="w-4 h-4" />
                <span>{course.moduleCount} modules</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
