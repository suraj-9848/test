import axios from "axios";
import { Blog } from "../store/blogStore";
import { API_ENDPOINTS, buildApiUrl } from "../config/urls";

const API_URL = buildApiUrl(API_ENDPOINTS.INSTRUCTOR.BLOGS);

export const fetchAllBlogs = async (jwt: string): Promise<Blog[]> => {
  const res = await axios.get(API_URL, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  // The backend returns { message: "Blog posts retrieved successfully", blogs: Blog[] }
  return res.data.blogs || [];
};

export const fetchBlog = async (id: string, jwt: string): Promise<Blog> => {
  const res = await axios.get(
    buildApiUrl(API_ENDPOINTS.INSTRUCTOR.BLOG_BY_ID(id)),
    {
      headers: { Authorization: `Bearer ${jwt}` },
    },
  );
  return res.data.blog;
};

export const createBlog = async (
  blog: Omit<Blog, "id" | "createdAt" | "updatedAt">,
  jwt: string,
): Promise<Blog> => {
  console.log(`Creating blog with title: ${blog.title}`);
  const res = await axios.post(API_URL, blog, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  return res.data.blog;
};

export const updateBlog = async (blog: Blog, jwt: string): Promise<Blog> => {
  const res = await axios.put(
    buildApiUrl(API_ENDPOINTS.INSTRUCTOR.BLOG_BY_ID(blog.id)),
    {
      title: blog.title,
      content: blog.content,
      coverImageUrl: blog.coverImageUrl,
      hashtags: blog.hashtags,
    },
    {
      headers: { Authorization: `Bearer ${jwt}` },
    },
  );
  return res.data.blog;
};

export const deleteBlog = async (id: string, jwt: string): Promise<void> => {
  await axios.delete(buildApiUrl(API_ENDPOINTS.INSTRUCTOR.BLOG_BY_ID(id)), {
    headers: { Authorization: `Bearer ${jwt}` },
  });
};
