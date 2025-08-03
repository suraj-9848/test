import { useState } from "react";

export const CreateModuleModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: {
    title: string;
    description: string;
    order_index: number;
  }) => void;
  loading: boolean;
  courseTitle: string;
  nextOrderIndex: number;
}> = ({ isOpen, onClose, onCreate, loading, courseTitle, nextOrderIndex }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    order_index: nextOrderIndex,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim()) {
      onCreate(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            Create New Module
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Course:</span> {courseTitle}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Module Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter module title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Enter module description (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Index
            </label>
            <input
              type="number"
              value={formData.order_index}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  order_index: parseInt(e.target.value) || 1,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              <span>Create Module</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
