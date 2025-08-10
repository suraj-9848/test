import { create } from "zustand";
import {
  createBlog,
  updateBlog as apiUpdateBlog,
  deleteBlog as apiDeleteBlog,
  fetchAllBlogs,
} from "../api/blogsApi";

export interface Blog {
  id: string;
  title: string;
  content: string;
  coverImageUrl: string;
  hashtags: string[];
  createdAt: string;
  updatedAt: string;
}

interface BlogStoreState {
  blogs: Blog[];
  loading: boolean;
  error: string | null;
  fetchBlogs: (jwt: string) => Promise<void>;
  addBlog: (
    blog: Omit<Blog, "id" | "createdAt" | "updatedAt">,
    jwt: string,
  ) => Promise<Blog>;
  updateBlog: (blog: Blog, jwt: string) => Promise<void>;
  deleteBlog: (id: string, jwt: string) => Promise<void>;
  getBlogById: (id: string) => Blog | undefined;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useBlogStore = create<BlogStoreState>((set, get) => ({
  blogs: [],
  loading: false,
  error: null,

  setLoading: (loading: boolean) => set({ loading }),

  clearError: () => set({ error: null }),

  fetchBlogs: async (jwt: string) => {
    set({ loading: true, error: null });
    try {
      const blogs = await fetchAllBlogs(jwt);
      set({ blogs, loading: false });
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch blog posts";
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  addBlog: async (blogData, jwt) => {
    set({ loading: true, error: null });
    try {
      const newBlog = await createBlog(blogData, jwt);

      await get().fetchBlogs(jwt);

      set({ loading: false });
      return newBlog;
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create blog post";
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  updateBlog: async (blog, jwt) => {
    set({ loading: true, error: null });
    try {
      await apiUpdateBlog(blog, jwt);

      await get().fetchBlogs(jwt);

      set({ loading: false });
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update blog post";
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  deleteBlog: async (id, jwt) => {
    set({ loading: true, error: null });
    try {
      await apiDeleteBlog(id, jwt);

      set((state) => ({
        blogs: state.blogs.filter((blog) => blog.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete blog post";
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  getBlogById: (id) => get().blogs.find((b) => b.id === id),
}));
