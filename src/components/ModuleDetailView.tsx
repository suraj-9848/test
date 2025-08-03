import React, { useState } from "react";
import { FileText, Layers, HelpCircle } from "lucide-react";
import "@/styles/module-mcq-management.css";
import { DayContentTab } from "./DayContentTab";
import { MCQTab } from "./MCQTab";

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

export const ModuleDetailView: React.FC<{
  module: Module;
  batch: Batch;
  course: Course;
}> = ({ module, batch, course }) => {
  const [activeTab, setActiveTab] = useState<"day-content" | "mcq">(
    "day-content",
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Layers className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {module.title}
              </h2>
              <p className="text-gray-600">
                {batch.name} {" > "} {course.title} {" > "} Module{" "}
                {module.order_index}
              </p>
            </div>
          </div>
        </div>

        {module.description && (
          <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
            {module.description}
          </p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab("day-content")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "day-content"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Day Content</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("mcq")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "mcq"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center space-x-2">
                <HelpCircle className="w-4 h-4" />
                <span>MCQ Management</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "day-content" && (
            <DayContentTab module={module} batch={batch} course={course} />
          )}
          {activeTab === "mcq" && (
            <MCQTab module={module} batch={batch} course={course} />
          )}
        </div>
      </div>
    </div>
  );
};
