import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Calendar, Users, ChevronRight, GraduationCap } from "lucide-react";
import "@/styles/module-mcq-management.css";

interface Batch {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  studentCount?: number;
}
export const BatchesView: React.FC<{
  data: Batch[];
  onSelect: (batch: Batch) => void;
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
        <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">
          No batches found
        </h3>
        <p className="text-gray-500">No batches match your search criteria.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {data.map((batch) => (
        <div
          key={batch.id}
          onClick={() => onSelect(batch)}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer group"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {batch.name}
                </h3>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
          </div>

          {batch.description && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {batch.description}
            </p>
          )}

          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(batch.created_at).toLocaleDateString()}</span>
            </div>
            {batch.studentCount !== undefined && (
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{batch.studentCount} students</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
