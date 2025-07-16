import { create } from "zustand";
import { useOrganizationStore } from "./organizationStore";
import { userApi, CreateUserRequest, UpdateUserRequest } from "@/api/adminApi";

// Types
export type AdminRole = "College Admin" | "Deputy Admin" | "Academic Head";
export type InstructorRole =
  | "Senior Professor"
  | "Associate Professor"
  | "Assistant Professor";
export type StudentRole =
  | "First Year"
  | "Second Year"
  | "Third Year"
  | "Fourth Year"
  | "Final Year";

export type UserRole = "student" | "admin" | "college_admin" | "instructor";
export type UserStatus = "Active" | "Inactive";
export type UserCategory = "college-admins" | "instructors" | "students";

export interface BaseUser {
  id: number;
  name: string;
  email: string;
  college: string;
  status: UserStatus;
  joinDate: string;
}

export interface AdminUser extends BaseUser {
  role: AdminRole;
}
export interface InstructorUser extends BaseUser {
  role: InstructorRole;
}
export interface StudentUser extends BaseUser {
  role: StudentRole;
}

export interface User {
  id: string;
  username: string;
  email: string | null;
  password: string | null;
  org_id: string | null;
  batch_id: string[];
  userRole: UserRole;
}

type StoreKeyMap = {
  "college-admins": "admins";
  instructors: "instructors";
  students: "students";
};

interface AdminStoreState {
  admins: AdminUser[];
  instructors: InstructorUser[];
  students: StudentUser[];
  search: string;
  collegeFilter: string;
  statusFilter: "All" | UserStatus;
  loading: boolean;
  error: string | null;

  setSearch: (search: string) => void;
  setOrgFilter: (org: string) => void;
  setRoleFilter: (role: "All" | UserStatus) => void;
  addUser: (userData: CreateUserRequest, role: UserRole) => Promise<void>;
  deleteUser: (id: string, role: UserRole) => Promise<void>;
  editUser: (
    id: string,
    userData: UpdateUserRequest,
    role: UserRole
  ) => Promise<void>;
  fetchUsers: (role?: UserRole | "All") => Promise<void>;
}

const mockBatches = [
  "2024-Batch-A",
  "2024-Batch-B",
  "2023-Batch-A",
  "2023-Batch-B",
  "2022-Batch-A",
  "2022-Batch-B",
];

// Initial data
const initialAdmins: AdminUser[] = [];
const initialInstructors: InstructorUser[] = [];
const initialStudents: StudentUser[] = [];

// Utility functions
function mapTypeToKey(
  type: UserCategory
): "admins" | "instructors" | "students" {
  const map: StoreKeyMap = {
    "college-admins": "admins",
    instructors: "instructors",
    students: "students",
  };
  return map[type];
}

function roleToCategory(role: UserRole): UserCategory {
  switch (role) {
    case "college_admin":
      return "college-admins";
    case "instructor":
      return "instructors";
    case "student":
      return "students";
    default:
      throw new Error(`Unsupported role: ${role}`);
  }
}

function mapApiUserToStoreUser<
  T extends AdminUser | InstructorUser | StudentUser
>(apiUser: User, role: UserRole): T {
  const baseUser = {
    id: Number(apiUser.id),
    name: apiUser.username,
    email: apiUser.email || "",
    college: apiUser.org_id || "",
    status: "Active" as UserStatus,
    joinDate: new Date().toISOString().split("T")[0],
  };

  switch (role) {
    case "college_admin":
      return { ...baseUser, role: "College Admin" as AdminRole } as T;
    case "instructor":
      return { ...baseUser, role: "Senior Professor" as InstructorRole } as T;
    case "student":
      return { ...baseUser, role: "First Year" as StudentRole } as T;
    default:
      throw new Error(`Unsupported role: ${role}`);
  }
}

// Zustand Store
export const useAdminStore = create<AdminStoreState>((set) => ({
  admins: initialAdmins,
  instructors: initialInstructors,
  students: initialStudents,
  search: "",
  collegeFilter: "All Organizations",
  statusFilter: "All",
  loading: false,
  error: null,

  setSearch: (search) => set({ search }),
  setOrgFilter: (org) => set({ collegeFilter: org }),
  setRoleFilter: (role) => set({ statusFilter: role }),

  addUser: async (userData, role) => {
    try {
      set({ loading: true, error: null });
      const response = await userApi.createUser(userData, role);
      const key = mapTypeToKey(roleToCategory(role));
      const mappedUser = mapApiUserToStoreUser(response.user, role);
      set((state) => ({
        [key]: [
          ...(state[key] as (AdminUser | InstructorUser | StudentUser)[]),
          mappedUser,
        ],
        loading: false,
      }));
    } catch (error) {
      set({ error: "Failed to add user", loading: false });
      throw error;
    }
  },

  deleteUser: async (id, role) => {
    try {
      set({ loading: true, error: null });
      await userApi.deleteUser(id);
      const key = mapTypeToKey(roleToCategory(role));
      set((state) => ({
        [key]: (
          state[key] as (AdminUser | InstructorUser | StudentUser)[]
        ).filter((user) => String(user.id) !== id),
        loading: false,
      }));
    } catch (error) {
      set({ error: "Failed to delete user", loading: false });
      throw error;
    }
  },

  editUser: async (id, userData, role) => {
    try {
      set({ loading: true, error: null });
      const response = await userApi.updateUser(id, userData, role);
      const key = mapTypeToKey(roleToCategory(role));
      const mappedUser = mapApiUserToStoreUser(response.user, role);
      set((state) => ({
        [key]: (state[key] as (AdminUser | InstructorUser | StudentUser)[]).map(
          (user) => (String(user.id) === id ? mappedUser : user)
        ),
        loading: false,
      }));
    } catch (error) {
      set({ error: "Failed to edit user", loading: false });
      throw error;
    }
  },

  fetchUsers: async (role = "All") => {
    try {
      set({ loading: true, error: null });
      const response = await userApi.getUsers(role);

      if (role === "All") {
        set({
          admins: response.users
            .filter((u) => u.userRole === "college_admin")
            .map((u) => mapApiUserToStoreUser<AdminUser>(u, "college_admin")),
          instructors: response.users
            .filter((u) => u.userRole === "instructor")
            .map((u) => mapApiUserToStoreUser<InstructorUser>(u, "instructor")),
          students: response.users
            .filter((u) => u.userRole === "student")
            .map((u) => mapApiUserToStoreUser<StudentUser>(u, "student")),
          loading: false,
        });
      } else {
        const key = mapTypeToKey(roleToCategory(role));
        const mappedUsers = response.users.map((u) => {
          switch (role) {
            case "college_admin":
              return mapApiUserToStoreUser<AdminUser>(u, role);
            case "instructor":
              return mapApiUserToStoreUser<InstructorUser>(u, role);
            case "student":
              return mapApiUserToStoreUser<StudentUser>(u, role);
            default:
              throw new Error(`Unsupported role: ${role}`);
          }
        });
        set({ [key]: mappedUsers, loading: false });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      set({ error: `Failed to fetch users: ${errorMessage}`, loading: false });
      throw error;
    }
  },
}));

// Helpers
export const getOrgs = () => {
  const { organizations } = useOrganizationStore.getState();
  return organizations.map((org) => ({ id: org.id, name: org.name }));
};

export const getBatches = () => mockBatches;
