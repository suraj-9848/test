import React, { useState, useEffect } from "react";
import {
  Trash2,
  FileText,
  ChevronRight,
  Layers,
  HelpCircle,
} from "lucide-react";
import "@/styles/module-mcq-management.css";

interface Module {
  id: string;
  title: string;
  description?: string;
  course_id: string;
  order_index: number;
  created_at: string;
  dayContentCount?: number;
  mcqCount?: number;
}

export const ModulesView: React.FC<{
  data: Module[];
  onSelect: (module: Module) => void;
  onDelete: (module: Module) => void;
  loading: boolean;
}> = ({ data, onSelect, onDelete, loading }) => {
  console.log("ModulesView received data:", data);
  console.log("ModulesView loading state:", loading);

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
        <Layers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">
          No modules found
        </h3>
        <p className="text-gray-500">No modules found in this course.</p>
        <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left">
          <p className="text-sm text-gray-600">Debug Info:</p>
          <p className="text-xs text-gray-500">Data length: {data.length}</p>
          <p className="text-xs text-gray-500">Loading: {loading.toString()}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {data.map((module) => (
        <div
          key={module.id}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-purple-300 transition-all duration-200 group relative"
        >
          <div className="flex items-start justify-between mb-4">
            <div
              className="flex items-center space-x-3 cursor-pointer flex-1"
              onClick={() => onSelect(module)}
            >
              <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <Layers className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                  {module.title}
                </h3>
                <p className="text-sm text-gray-500">
                  Order: {module.order_index}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(module);
                }}
                className="p-2 text-gray-400 hover:text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                title="View Details"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(module);
                }}
                className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                title="Delete Module"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="cursor-pointer" onClick={() => onSelect(module)}>
            {module.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {module.description}
              </p>
            )}

            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-4">
                {module.dayContentCount !== undefined && (
                  <div className="flex items-center space-x-1">
                    <FileText className="w-4 h-4" />
                    <span>{module.dayContentCount} days</span>
                  </div>
                )}
                {module.mcqCount !== undefined && (
                  <div className="flex items-center space-x-1">
                    <HelpCircle className="w-4 h-4" />
                    <span>{module.mcqCount} MCQs</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
