"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Edit,
  Trash2,
  Eye,
  Calendar,
  Hash,
  ArrowLeft,
  Save,
  X,
  Plus,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  FileText,
  BadgeCheck,
  PanelTopClose,
  PanelTopOpen,
  Image as ImageIcon,
  Upload,
  Link,
  CheckCircle,
} from "lucide-react";
import EnhancedRichTextEditor, {
  RichTextEditorHandle,
} from "./EnhancedRichTextEditor";
import { useBlogStore, Blog } from "../store/blogStore";
import { useSession } from "next-auth/react";

interface ManageBlogProps {
  onCreateNew?: () => void;
  onEditBlog?: (blog: Blog) => void;
}

type NotificationType = "success" | "error" | null;

interface Notification {
  type: NotificationType;
  message: string;
}

const ManageBlog: React.FC<ManageBlogProps> = ({ onCreateNew, onEditBlog }) => {
  const { data: session } = useSession();
  const { blogs, fetchBlogs, deleteBlog, updateBlog, error, clearError } =
    useBlogStore();

  const [filteredPosts, setFilteredPosts] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<Blog | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "published" | "draft"
  >("all");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Blog | null>(null);

  // Edit form states
  const [editTitle, setEditTitle] = useState("");
  const [editCoverImageUrl, setCoverImageUrl] = useState("");
  const [editHashtags, setEditHashtags] = useState<string[]>([]);
  const [newHashtag, setNewHashtag] = useState("");
  const [coverImageInput, setCoverImageInput] = useState("");
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

  const showNotification = (type: NotificationType, message: string) => {
    setNotification({ type, message });
  };

  // Fetch posts on component mount
  useEffect(() => {
    const loadPosts = async () => {
      const googleIdToken = (session as { id_token?: string })?.id_token;
      if (!googleIdToken) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        await fetchBlogs(googleIdToken);
      } catch (error) {
        console.error("Failed to fetch blog posts:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      loadPosts();
    }
  }, [session, fetchBlogs]);

  // Clear errors
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Filter posts based on search and status
  useEffect(() => {
    let filtered = blogs;

    if (searchTerm) {
      filtered = filtered.filter(
        (post: Blog) =>
          post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.hashtags.some((tag: string) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase()),
          ),
      );
    }

    setFilteredPosts(filtered);
  }, [blogs, searchTerm, statusFilter]);

  const handleEdit = (post: Blog) => {
    if (onEditBlog) {
      onEditBlog(post);
    } else {
      setEditingPost(post);
      setEditTitle(post.title);
      setCoverImageUrl(post.coverImageUrl);
      setEditHashtags(post.hashtags);
      setIsEditing(true);

      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.setContent(post.content);
        }
      }, 100);
    }
  };

  const handleDelete = async () => {
    if (!postToDelete) return;

    const googleIdToken = (session as { id_token?: string })?.id_token;
    if (!googleIdToken) {
      alert("You must be logged in to delete a blog post");
      return;
    }

    setIsDeleting(postToDelete.id);
    try {
      await deleteBlog(postToDelete.id, googleIdToken);
      setShowDeleteModal(false);
      console.log("Post deleted:", postToDelete.id);
    } catch (error: any) {
      console.error("Failed to delete post:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete blog post";
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsDeleting(null);
      setPostToDelete(null);
    }
  };

  const validateBlog = (): boolean => {
    const errors: string[] = [];
    if (!editTitle.trim()) errors.push("Title is required");
    const content = editorRef.current?.getContent() || "";
    if (!content.trim() || content === "<br>" || content === "<p><br></p>") {
      errors.push("Content is required");
    }
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSave = async () => {
    if (!editingPost) return;

    if (!validateBlog()) return;

    const googleIdToken = (session as { id_token?: string })?.id_token;
    if (!googleIdToken) {
      showNotification("error", "You must be logged in to update a blog post");
      return;
    }

    setIsSaving(true);
    try {
      const content = editorRef.current?.getContent() || "";
      const updatedPost: Blog = {
        ...editingPost,
        title: editTitle.trim(),
        content: content,
        coverImageUrl: editCoverImageUrl,
        hashtags: editHashtags,
        updatedAt: new Date().toISOString(),
      };

      await updateBlog(updatedPost, googleIdToken);
      showNotification("success", "Blog updated successfully! 🎉");

      // Delay to show notification before closing
      setTimeout(() => {
        handleCancelEdit();
      }, 1500);
    } catch (error: any) {
      console.error("Failed to update post:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update blog post";
      showNotification("error", errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingPost(null);
    setEditTitle("");
    setCoverImageUrl("");
    setEditHashtags([]);
    setNewHashtag("");
    setCoverImageInput("");
    setValidationErrors([]);
    editorRef.current?.setContent("");
  };

  const handleConfirmDelete = (post: Blog) => {
    setPostToDelete(post);
    setShowDeleteModal(true);
  };

  const addHashtag = () => {
    const trimmedTag = newHashtag.trim();
    if (trimmedTag && !editHashtags.includes(trimmedTag)) {
      setEditHashtags((prev) => [...prev, trimmedTag]);
      setNewHashtag("");
    }
  };

  const removeHashtag = (hashtag: string) => {
    setEditHashtags((prev) => prev.filter((tag) => tag !== hashtag));
  };

  const handleHashtagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addHashtag();
    }
  };

  const handleCoverImageUrlAdd = () => {
    if (coverImageInput.trim()) {
      try {
        new URL(coverImageInput.trim());
        setCoverImageUrl(coverImageInput.trim());
        setCoverImageInput("");
      } catch (error) {
        showNotification("error", "Please enter a valid URL");
      }
    }
  };

  const removeCoverImage = () => {
    setCoverImageUrl("");
    setCoverImageInput("");
  };

  const handleCoverImageKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCoverImageUrlAdd();
    }
  };

  const previewBlog = () => setShowPreview(true);
  const closePreview = () => setShowPreview(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    const plainText = text.replace(/<[^>]*>/g, "");
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + "...";
  };

  const handleCreateNew = () => {
    if (onCreateNew) {
      onCreateNew();
    }
  };

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
    if (!showPreview || !editingPost) return null;

    const previewData = {
      title: editTitle || "Untitled Blog",
      content: editorRef.current?.getContent() || "",
      coverImageUrl: editCoverImageUrl,
      hashtags: editHashtags,
      createdAt: editingPost.createdAt,
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full overflow-hidden">
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

          <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
            <article className="p-6">
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

              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
                  {previewData.title}
                </h1>
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
                  <span className="ml-4 text-orange-600 font-medium">
                    [EDITING MODE]
                  </span>
                </div>
              </div>

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
                  handleSave();
                }}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Upload className="mr-2 h-4 w-4 inline" />
                {isSaving ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isEditing && editingPost) {
    return (
      <div className="min-h-screen bg-gray-50 p-2">
        <NotificationBar />

        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Blog</h1>
                <p className="text-sm text-gray-600">
                  Make changes to your blog post
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleCancelEdit}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {isSaving ? "Updating..." : "Update"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your blog title..."
            />
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center mb-4">
              <Link className="h-5 w-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">
                Cover Image URL
              </h2>
            </div>

            {!editCoverImageUrl ? (
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
                  src={editCoverImageUrl}
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

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center mb-4">
              <Calendar className="h-5 w-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">
                Blog Content *
              </h2>
            </div>
            <EnhancedRichTextEditor
              ref={editorRef}
              placeholder="Start writing your amazing blog content..."
              height="500px"
              minHeight="300px"
            />
          </div>

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
                  onKeyPress={handleHashtagKeyPress}
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
              {editHashtags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {editHashtags.map((hashtag, index) => (
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

          <div className="md:hidden bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col gap-3">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Upload className="mr-2 h-4 w-4" />
                {isSaving ? "Updating..." : "Update"}
              </button>
            </div>
          </div>

          <PreviewModal />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Blog Posts</h1>
              <p className="text-sm text-gray-600">
                View, edit, and manage your content
              </p>
            </div>
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Post
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 transition-all duration-300">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-stretch sm:items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search posts by title or hashtag..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                />
              </div>
            </div>
          </div>

          {!session?.user && (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Authentication Required
              </h3>
              <p className="text-gray-600 mb-4">
                Please log in to view your blog posts
              </p>
            </div>
          )}

          {loading && session?.user && (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
              <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto" />
              <p className="mt-4 text-gray-600">Loading your posts...</p>
            </div>
          )}

          {!loading && session?.user && filteredPosts.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No posts found
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Get started by creating your first blog post"}
              </p>
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Post
              </button>
            </div>
          )}

          {!loading && session?.user && filteredPosts.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPosts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex flex-col hover:shadow-xl transition-shadow duration-300"
                  >
                    <div className="h-48 overflow-hidden relative">
                      {post.coverImageUrl ? (
                        <img
                          src={post.coverImageUrl}
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                          <ImageIcon className="h-12 w-12" />
                        </div>
                      )}
                    </div>

                    <div className="p-6 flex flex-col flex-1">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <BadgeCheck className="h-3 w-3 mr-1" />
                            Published
                          </span>
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(post.updatedAt)}
                          </div>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                          {post.title}
                        </h3>
                      </div>

                      {post.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-auto mb-4">
                          {post.hashtags.map(
                            (hashtag: string, index: number) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                #{hashtag}
                              </span>
                            ),
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-auto">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(post)}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors shadow-sm"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleConfirmDelete(post)}
                            disabled={isDeleting === post.id}
                            className="inline-flex items-center px-3 py-1.5 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                          >
                            {isDeleting === post.id ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 mr-1" />
                            )}
                            {isDeleting === post.id ? "Deleting" : "Delete"}
                          </button>
                        </div>
                        <a
                          href={`/blog/${post.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 text-center text-sm text-gray-500">
                Showing {filteredPosts.length} of {blogs.length} posts
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl transform transition-all duration-300">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Delete Blog Post
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete the post titled **&ldquo;
                {postToDelete?.title}&rdquo;**? This action cannot be undone.
              </p>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleDelete}
                disabled={isDeleting !== null}
              >
                {isDeleting !== null ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                {isDeleting !== null ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageBlog;
