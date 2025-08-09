"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Save,
  Eye,
  Upload,
  X,
  Hash,
  Calendar,
  Image,
  Link,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import EnhancedRichTextEditor, {
  RichTextEditorHandle,
} from "./EnhancedRichTextEditor";
import { useBlogStore, Blog } from "../store/blogStore";
import { useSession } from "next-auth/react";

interface BlogData {
  title: string;
  content: string;
  coverImageUrl: string;
  hashtags: string[];
}

interface WriteBlogPageProps {
  editingBlog?: Blog | null;
  onCancel?: () => void;
  onSuccess?: () => void;
}

type NotificationType = "success" | "error" | null;

interface Notification {
  type: NotificationType;
  message: string;
}

const WriteBlogPage: React.FC<WriteBlogPageProps> = ({
  editingBlog,
  onCancel,
  onSuccess,
}) => {
  const { data: session } = useSession();
  const { addBlog, updateBlog, error, clearError } = useBlogStore();

  const [blogData, setBlogData] = useState<BlogData>({
    title: "",
    content: "",
    coverImageUrl: "",
    hashtags: [],
  });

  const [newHashtag, setNewHashtag] = useState("");
  const [coverImageInput, setCoverImageInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);

  const editorRef = useRef<RichTextEditorHandle>(null);

  // Auto-hide notifications after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Initialize form data when editing
  useEffect(() => {
    if (editingBlog) {
      setBlogData({
        title: editingBlog.title,
        content: editingBlog.content,
        coverImageUrl: editingBlog.coverImageUrl,
        hashtags: editingBlog.hashtags,
      });
      // Set content in editor after a brief delay to ensure it's mounted
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.setContent(editingBlog.content);
        }
      }, 100);
    }
  }, [editingBlog]);

  // Clear errors when they exist
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const showNotification = (type: NotificationType, message: string) => {
    setNotification({ type, message });
  };

  const handleInputChange = (field: keyof BlogData, value: any) => {
    setBlogData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (validationErrors.length > 0) setValidationErrors([]);
  };

  const handleContentChange = (content: string) => {
    setBlogData((prev) => ({
      ...prev,
      content,
    }));
  };

  const handleCoverImageUrlAdd = () => {
    if (coverImageInput.trim()) {
      // Basic URL validation
      try {
        new URL(coverImageInput.trim());
        setBlogData((prev) => ({
          ...prev,
          coverImageUrl: coverImageInput.trim(),
        }));
        setCoverImageInput("");
      } catch (error) {
        showNotification("error", "Please enter a valid URL");
      }
    }
  };

  const removeCoverImage = () => {
    setBlogData((prev) => ({ ...prev, coverImageUrl: "" }));
    setCoverImageInput("");
  };

  const addHashtag = () => {
    if (newHashtag.trim() && !blogData.hashtags.includes(newHashtag.trim())) {
      setBlogData((prev) => ({
        ...prev,
        hashtags: [...prev.hashtags, newHashtag.trim()],
      }));
      setNewHashtag("");
    }
  };

  const removeHashtag = (hashtag: string) => {
    setBlogData((prev) => ({
      ...prev,
      hashtags: prev.hashtags.filter((tag) => tag !== hashtag),
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addHashtag();
    }
  };

  const handleCoverImageKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCoverImageUrlAdd();
    }
  };

  const validateBlog = (): boolean => {
    const errors: string[] = [];
    if (!blogData.title.trim()) errors.push("Title is required");
    const content = editorRef.current?.getContent() || "";
    if (!content.trim() || content === "<br>" || content === "<p><br></p>") {
      errors.push("Content is required");
    }
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const saveBlog = async () => {
    if (!validateBlog()) return;

    // Check if user is authenticated
    const googleIdToken = (session as { id_token?: string })?.id_token;
    if (!googleIdToken) {
      showNotification("error", "You must be logged in to publish a blog post");
      return;
    }

    setIsLoading(true);
    try {
      const finalBlogData = {
        title: blogData.title.trim(),
        content: editorRef.current?.getContent() || "",
        coverImageUrl: blogData.coverImageUrl,
        hashtags: blogData.hashtags,
      };

      console.log("=== BLOG DATA TO SAVE ===");
      console.log("Blog Data:", finalBlogData);
      console.log("Is Editing:", !!editingBlog);
      console.log("========================");

      if (editingBlog) {
        // Update existing blog
        const updatedBlog: Blog = {
          ...editingBlog,
          ...finalBlogData,
          updatedAt: new Date().toISOString(),
        };
        await updateBlog(updatedBlog, googleIdToken);
        showNotification("success", "Blog updated successfully! 🎉");
      } else {
        // Create new blog
        const newBlog = await addBlog(finalBlogData, googleIdToken);
        showNotification("success", "Blog published successfully! 🚀");

        // Reset form for new blog creation
        setBlogData({
          title: "",
          content: "",
          coverImageUrl: "",
          hashtags: [],
        });
        if (editorRef.current) {
          editorRef.current.setContent("");
        }
        setCoverImageInput("");
        setNewHashtag("");
      }

      // Call success callback if provided
      if (onSuccess) {
        // Delay to show notification before navigation
        setTimeout(onSuccess, 1500);
      }
    } catch (error: any) {
      console.error("Error saving blog:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to save blog post";
      showNotification("error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const previewBlog = () => setShowPreview(true);
  const closePreview = () => setShowPreview(false);

  // Notification Component
  const NotificationBar = () => {
    if (!notification) return null;

    const isSuccess = notification.type === "success";

    return (
      <div
        className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg transition-all duration-300 ${
          isSuccess
            ? "bg-green-50 border border-green-200"
            : "bg-red-50 border border-red-200"
        }`}
      >
        <div className="flex items-center">
          {isSuccess ? (
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          )}
          <p
            className={`text-sm font-medium ${
              isSuccess ? "text-green-800" : "text-red-800"
            }`}
          >
            {notification.message}
          </p>
          <button
            onClick={() => setNotification(null)}
            className="ml-4 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  // Preview Modal Component
  const PreviewModal = () => {
    if (!showPreview) return null;

    const previewData = {
      title: blogData.title || "Untitled Blog",
      content: editorRef.current?.getContent() || "",
      coverImageUrl: blogData.coverImageUrl,
      hashtags: blogData.hashtags,
      createdAt: editingBlog?.createdAt || new Date().toISOString(),
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full overflow-hidden">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Blog Preview
            </h2>
            <button
              onClick={closePreview}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
            <article className="p-6">
              {/* Cover Image */}
              {previewData.coverImageUrl && (
                <div className="mb-8">
                  <img
                    src={previewData.coverImageUrl}
                    alt={previewData.title}
                    className="w-full h-64 object-cover rounded-lg shadow-md"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}

              {/* Blog Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
                  {previewData.title}
                </h1>
                {/* Hashtags */}
                {previewData.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {previewData.hashtags.map((hashtag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        #{hashtag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Metadata */}
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  <time>
                    {new Date(previewData.createdAt).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    )}
                  </time>
                  {editingBlog && (
                    <span className="ml-4 text-orange-600 font-medium">
                      [EDITING MODE]
                    </span>
                  )}
                </div>
              </div>

              {/* Blog Content */}
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: previewData.content }}
                style={{
                  fontSize: "16px",
                  lineHeight: "1.7",
                  color: "#374151",
                }}
              />

              {!previewData.content && (
                <div className="text-center py-12 text-gray-500">
                  <p>No content to preview yet. Start writing your blog!</p>
                </div>
              )}
            </article>
          </div>

          {/* Modal Footer */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex justify-end space-x-3">
              <button
                onClick={closePreview}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  closePreview();
                  saveBlog();
                }}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Upload className="mr-2 h-4 w-4 inline" />
                {isLoading
                  ? editingBlog
                    ? "Updating..."
                    : "Publishing..."
                  : editingBlog
                    ? "Update"
                    : "Publish Now"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2 ">
      {/* Notification */}
      <NotificationBar />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {editingBlog ? "Edit Blog" : "Write Blog"}
              </h1>
              <p className="text-sm text-gray-600">
                {editingBlog
                  ? "Make changes to your blog post"
                  : "Create engaging content for your audience"}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={previewBlog}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </button>
              <button
                onClick={saveBlog}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Upload className="mr-2 h-4 w-4" />
                {isLoading
                  ? editingBlog
                    ? "Updating..."
                    : "Publishing..."
                  : editingBlog
                    ? "Update"
                    : "Publish"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Please fix the following errors:
                </h3>
                <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Blog Title */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <label
            htmlFor="blog-title"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Blog Title *
          </label>
          <input
            id="blog-title"
            type="text"
            value={blogData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your blog title..."
          />
        </div>

        {/* Cover Image Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center mb-4">
            <Link className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">
              Cover Image URL
            </h2>
          </div>

          {!blogData.coverImageUrl ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={coverImageInput}
                  onChange={(e) => setCoverImageInput(e.target.value)}
                  onKeyPress={handleCoverImageKeyPress}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Paste image URL here..."
                />
                <button
                  onClick={handleCoverImageUrlAdd}
                  disabled={!coverImageInput.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add
                </button>
              </div>
              <p className="text-sm text-gray-500">
                Enter a valid image URL (e.g., https://example.com/image.jpg)
              </p>
            </div>
          ) : (
            <div className="relative">
              <img
                src={blogData.coverImageUrl}
                alt="Cover preview"
                className="w-full h-64 object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.src =
                    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNiAxNkMyMC40MTgzIDE2IDI0IDE5LjU4MTcgMjQgMjRDMjQgMjguNDE4MyAyMC40MTgzIDMyIDE2IDMyQzExLjU4MTcgMzIgOCAyOC40MTgzIDggMjRDOCAxOS41ODE3IDExLjU4MTcgMTYgMTYgMTZaIiBmaWxsPSIjOUNBM0FGIi8+Cjx0ZXh0IHg9IjIwIiB5PSIyNSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjNjc3NDhGIj5JbWFnZSBub3QgZm91bmQ8L3RleHQ+Cjwvc3ZnPgo=";
                  e.currentTarget.className += " opacity-50";
                }}
              />
              <button
                onClick={removeCoverImage}
                className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Content Editor Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center mb-4">
            <Calendar className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">
              Blog Content *
            </h2>
          </div>
          <EnhancedRichTextEditor
            ref={editorRef}
            value={blogData.content}
            onChange={handleContentChange}
            placeholder="Start writing your amazing blog content..."
            height="500px"
            minHeight="300px"
          />
        </div>

        {/* Hashtags Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center mb-4">
            <Hash className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Hashtags</h2>
          </div>
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newHashtag}
                onChange={(e) => setNewHashtag(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Add a hashtag (without #)"
              />
              <button
                onClick={addHashtag}
                disabled={!newHashtag.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                Add
              </button>
            </div>
            {blogData.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {blogData.hashtags.map((hashtag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    #{hashtag}
                    <button
                      onClick={() => removeHashtag(hashtag)}
                      className="ml-1 hover:bg-blue-200 rounded-full p-1 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons Mobile */}
        <div className="md:hidden bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col gap-3">
            <button
              onClick={previewBlog}
              className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </button>
            <button
              onClick={saveBlog}
              disabled={isLoading}
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Upload className="mr-2 h-4 w-4" />
              {isLoading
                ? editingBlog
                  ? "Updating..."
                  : "Publishing..."
                : editingBlog
                  ? "Update"
                  : "Publish"}
            </button>
          </div>
        </div>

        {/* Preview Modal */}
        <PreviewModal />
      </div>
    </div>
  );
};

export default WriteBlogPage;
