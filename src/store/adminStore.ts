import { create } from "zustand";
import { useOrganizationStore } from "./organizationStore";
import {
  userApi,
  User as ApiUser,
  CreateUserRequest,
  UpdateUserRequest,
} from "@/api/adminApi";

// Type Definitions
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

// Store Interface
interface AdminStoreState {
  // State
  admins: AdminUser[];
  instructors: InstructorUser[];
  students: StudentUser[];
  search: string;
  collegeFilter: string;
  statusFilter: "All" | UserStatus;
  loading: boolean;
  error: string | null;

  // Actions
  setSearch: (search: string) => void;
  setOrgFilter: (org: string) => void;
  setRoleFilter: (role: "All" | UserStatus) => void;
  addUser: (userData: CreateUserRequest, role: UserRole) => Promise<void>;
  deleteUser: (id: string, role: UserRole) => Promise<void>;
  editUser: (id: string, userData: UpdateUserRequest, role: UserRole) => Promise<void>;
  fetchUsers: (role?: UserRole | "All") => Promise<void>;
}

// Mock Data
const mockBatches = [
  "2024-Batch-A",
  "2024-Batch-B",
  "2023-Batch-A",
  "2023-Batch-B",
  "2022-Batch-A",
  "2022-Batch-B",
];

const initialAdmins: AdminUser[] = [
  {
    id: 1,
    name: "Dr. Rajesh Kumar",
    email: "rajesh@aquinas.edu",
    role: "College Admin",
    college: "Aquinas College of Engineering",
    status: "Active",
    joinDate: "2020-01-15",
  },
  {
    id: 2,
    name: "Prof. Neha Verma",
    email: "neha@oxfordtech.edu",
    role: "Deputy Admin",
    college: "Oxford Institute of Technology",
    status: "Active",
    joinDate: "2021-07-10",
  },
  {
    id: 3,
    name: "Dr. Anil Joshi",
    email: "anil@modernit.edu",
    role: "Academic Head",
    college: "Modern Institute of Technology",
    status: "Inactive",
    joinDate: "2018-06-05",
  },
  {
    id: 4,
    name: "Dr. Fatima Khan",
    email: "fatima@stxaviers.edu",
    role: "College Admin",
    college: "St. Xavier’s College",
    status: "Active",
    joinDate: "2019-12-01",
  },
];

const initialInstructors: InstructorUser[] = [
  {
    id: 1,
    name: "Prof. Amit Sharma",
    email: "amit@aquinas.edu",
    role: "Senior Professor",
    college: "Aquinas College of Engineering",
    status: "Active",
    joinDate: "2015-01-12",
  },
  {
    id: 2,
    name: "Dr. Meena Rao",
    email: "meena@oxfordtech.edu",
    role: "Associate Professor",
    college: "Oxford Institute of Technology",
    status: "Active",
    joinDate: "2016-03-25",
  },
  {
    id: 3,
    name: "Prof. Sanjay Singh",
    email: "sanjay@modernit.edu",
    role: "Assistant Professor",
    college: "Modern Institute of Technology",
    status: "Inactive",
    joinDate: "2017-11-30",
  },
  {
    id: 4,
    name: "Dr. Lata Mukherjee",
    email: "lata@stxaviers.edu",
    role: "Senior Professor",
    college: "St. Xavier’s College",
    status: "Active",
    joinDate: "2020-09-10",
  },
];

const initialStudents: StudentUser[] = [
  {
    id: 1,
    name: "Rohit Gupta",
    email: "rohit@students.aquinas.edu",
    role: "Final Year",
    college: "Aquinas College of Engineering",
    status: "Active",
    joinDate: "2020-09-01",
  },
  {
    id: 2,
    name: "Sneha Reddy",
    email: "sneha@students.oxfordtech.edu",
    role: "Second Year",
    college: "Oxford Institute of Technology",
    status: "Inactive",
    joinDate: "2022-09-01",
  },
  {
    id: 3,
    name: "Aman Yadav",
    email: "aman@students.modernit.edu",
    role: "Third Year",
    college: "Modern Institute of Technology",
    status: "Active",
    joinDate: "2021-08-12",
  },
  {
    id: 4,
    name: "Priya Nair",
    email: "priya@students.stxaviers.edu",
    role: "First Year",
    college: "St. Xavier’s College",
    status: "Active",
    joinDate: "2023-08-20",
  },
  {
    id: 5,
    name: "Karthik Iyer",
    email: "karthik@students.oxfordtech.edu",
    role: "Fourth Year",
    college: "Oxford Institute of Technology",
    status: "Active",
    joinDate: "2020-09-15",
  },
];

// Utility Functions
function mapTypeToKey(type: UserCategory): "admins" | "instructors" | "students" {
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

function mapApiUserToStoreUser<T extends AdminUser | InstructorUser | StudentUser>(
  apiUser: User,
  role: UserRole
): T {
  const baseUser = {
    id: Number(apiUser.id),
    name: apiUser.username,
    email: apiUser.email || "",
    college: apiUser.org_id || "",
    status: "Active" as UserStatus,
    joinDate: new Date().toISOString().split('T')[0],
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

// Store Implementation
export const useAdminStore = create<AdminStoreState>((set) => ({
  // Initial State
  admins: initialAdmins,
  instructors: initialInstructors,
  students: initialStudents,
  search: "",
  collegeFilter: "All Organizations",
  statusFilter: "All",
  loading: false,
  error: null,

  // Filter Actions
  setSearch: (search) => set({ search }),
  setOrgFilter: (org) => set({ collegeFilter: org }),
  setRoleFilter: (role) => set({ statusFilter: role }),

  // User Management Actions
  addUser: async (userData, role) => {
    try {
      set({ loading: true, error: null });
      const response = await userApi.createUser(userData, role);
      const key = mapTypeToKey(roleToCategory(role));
      const mappedUser = mapApiUserToStoreUser(response.user, role);
      set((state) => ({
        [key]: [...(state[key] as any[]), mappedUser],
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
      await userApi.deleteUser(id, role);
      const key = mapTypeToKey(roleToCategory(role));
      set((state) => ({
        [key]: (state[key] as any[]).filter((user) => String(user.id) !== id),
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
        [key]: (state[key] as any[]).map((user) =>
          String(user.id) === id ? mappedUser : user
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
      const response: { users: User[] } = await userApi.getUsers(role);

      if (role === "All") {
        // Filter users based on their roles and map to correct types
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
        const key = mapTypeToKey(roleToCategory(role as UserRole));
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
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      set({ error: `Failed to fetch users: ${errorMessage}`, loading: false });
      throw error;
    }
  },
}));

// Helper Functions
export const getOrgs = () => {
  const { organizations } = useOrganizationStore.getState();
  return organizations.map((org) => ({ id: org.id, name: org.name }));
};

export const getBatches = () => mockBatches;
