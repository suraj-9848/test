import { create } from "zustand";
import { useOrganizationStore } from "./organizationStore";
import { userApi, CreateUserRequest, UpdateUserRequest } from "@/api/adminApi";
import { fetchAllBatches } from "@/api/batchApi";
import { getBackendJwt } from "@/utils/auth";

// Types
export type UserRole = "student" | "instructor" | "admin" | "recruiter";
export type UserStatus = "Active" | "Inactive";
export type UserCategory = "admins" | "instructors" | "students" | "recruiters";

// Define role types that were missing
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

export interface BaseUser {
  id: string;
  name: string;
  email: string;
  college: string;
  status: UserStatus;
  joinDate: string;
  userRole: UserRole; // Add the actual user role from database
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
export interface RecruiterUser extends BaseUser {
  role: AdminRole; // Recruiters use AdminRole types
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
  recruiters: "recruiters";
};

interface AdminStoreState {
  admins: AdminUser[];
  instructors: InstructorUser[];
  students: StudentUser[];
  recruiters: RecruiterUser[];
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
    role: UserRole,
  ) => Promise<void>;
  fetchUsers: (role?: UserRole | "All") => Promise<void>;
}

const initialAdmins: AdminUser[] = [];
const initialInstructors: InstructorUser[] = [];
const initialStudents: StudentUser[] = [];
const initialRecruiters: RecruiterUser[] = [];

// Utility functions
function mapTypeToKey(
  type: UserCategory | "college-admins",
): "admins" | "instructors" | "students" | "recruiters" {
  const map: StoreKeyMap & { "college-admins": "admins" } = {
    "college-admins": "admins",
    instructors: "instructors",
    students: "students",
    recruiters: "recruiters",
  };
  return map[type as keyof typeof map];
}

function roleToCategory(role: UserRole): UserCategory {
  switch (role) {
    case "admin":
      return "admins";
    case "recruiter":
      return "recruiters";
    case "instructor":
      return "instructors";
    case "student":
      return "students";
    default:
      throw new Error(`Unsupported role: ${role}`);
  }
}

function mapApiUserToStoreUser<
  T extends AdminUser | InstructorUser | StudentUser | RecruiterUser,
>(apiUser: User, role: UserRole): T {
  const userId = apiUser.id;

  // Use orgs from store to validate and map organization name
  const orgs = useOrganizationStore.getState().organizations;
  let college = "Unknown Organization";
  if (apiUser.org_id) {
    const org = orgs.find((o) => o.id === apiUser.org_id);
    if (org) {
      college = org.name;
    }
  }

  const baseUser = {
    id: userId,
    name: apiUser.username || "Unknown User",
    email: apiUser.email || "",
    college: college,
    status: "Active" as UserStatus,
    joinDate: new Date().toISOString().split("T")[0],
    userRole: role,
  };

  switch (role) {
    case "admin":
      return { ...baseUser, role: "Academic Head" as AdminRole } as T;
    case "recruiter":
      return { ...baseUser, role: "Deputy Admin" as AdminRole } as T;
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
  recruiters: initialRecruiters,
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
          ...((state[key] as (
            | AdminUser
            | InstructorUser
            | StudentUser
            | RecruiterUser
          )[]) || []),
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
          (state[key] as (
            | AdminUser
            | InstructorUser
            | StudentUser
            | RecruiterUser
          )[]) || []
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
      // Validate the ID before making the API call
      if (!id || id === "NaN" || id === "undefined" || id === "null") {
        const errorMsg = `Invalid user ID: ${id}`;
        console.error(errorMsg);
        set({ error: errorMsg, loading: false });
        throw new Error(errorMsg);
      }

      set({ loading: true, error: null });
      console.log(`Updating user with ID: ${id}, role: ${role}`, userData);

      try {
        const response = await userApi.updateUser(id, userData, role);
        console.log("Update successful:", response);

        if (!response || !response.user) {
          throw new Error("Invalid response from server");
        }

        const newKey = mapTypeToKey(roleToCategory(role));
        const mappedUser = mapApiUserToStoreUser(response.user, role);

        set((state) => {
          // Find which category the user is currently in
          let currentKey:
            | "admins"
            | "instructors"
            | "students"
            | "recruiters"
            | null = null;

          if (state.admins?.some?.((user) => String(user.id) === id)) {
            currentKey = "admins";
          } else if (
            state.instructors?.some?.((user) => String(user.id) === id)
          ) {
            currentKey = "instructors";
          } else if (state.students?.some?.((user) => String(user.id) === id)) {
            currentKey = "students";
          } else if (
            state.recruiters?.some?.((user) => String(user.id) === id)
          ) {
            currentKey = "recruiters";
          }

          if (!currentKey) {
            console.warn(`User with ID ${id} not found in any category`);
            // If user not found, just add to new category
            return {
              [newKey]: [...(state[newKey] || []), mappedUser],
              loading: false,
            };
          }

          // If user is moving to a different category
          if (currentKey !== newKey) {
            console.log(`Moving user ${id} from ${currentKey} to ${newKey}`);
            return {
              // Remove from current category
              [currentKey]: (state[currentKey] || []).filter(
                (user) => String(user.id) !== id,
              ),
              // Add to new category
              [newKey]: [...(state[newKey] || []), mappedUser],
              loading: false,
            };
          } else {
            // User staying in same category, just update
            return {
              [newKey]: (state[newKey] || []).map((user) =>
                String(user.id) === id ? mappedUser : user,
              ),
              loading: false,
            };
          }
        });
      } catch (apiError) {
        const errorMessage =
          apiError instanceof Error
            ? apiError.message
            : "Failed to update user";
        console.error("API error:", errorMessage);
        set({ error: errorMessage, loading: false });
        throw apiError;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to edit user";
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  fetchUsers: async (role = "All") => {
    try {
      set({ loading: true, error: null });
      console.log(`Fetching users with role: ${role}`);
      const response = await userApi.getAllUsers({ role });
      console.log("API response:", response);

      if (!response.users || !Array.isArray(response.users)) {
        console.error("Invalid response format:", response);
        set({ loading: false, error: "Invalid response from server" });
        return;
      }

      if (role === "All") {
        const collegeAdmins = response.users
          .filter((u: User) => ["admin"].includes(u.userRole))
          .map((u: User) =>
            mapApiUserToStoreUser<AdminUser>(u, u.userRole as UserRole),
          );

        const recruiterUsers = response.users
          .filter((u: User) => u.userRole === "recruiter")
          .map((u: User) =>
            mapApiUserToStoreUser<RecruiterUser>(u, "recruiter"),
          );

        const instructorUsers = response.users
          .filter((u: User) => u.userRole === "instructor")
          .map((u: User) =>
            mapApiUserToStoreUser<InstructorUser>(u, "instructor"),
          );

        const studentUsers = response.users
          .filter((u: User) => u.userRole === "student")
          .map((u: User) => mapApiUserToStoreUser<StudentUser>(u, "student"));

        console.log(
          `Processed ${collegeAdmins.length} admins, ${recruiterUsers.length} recruiters, ${instructorUsers.length} instructors, ${studentUsers.length} students`,
        );

        set({
          admins: collegeAdmins,
          recruiters: recruiterUsers,
          instructors: instructorUsers,
          students: studentUsers,
          loading: false,
        });
      } else {
        const key = mapTypeToKey(roleToCategory(role));
        const mappedUsers = response.users.map((u: User) => {
          switch (role) {
            case "admin":
              return mapApiUserToStoreUser<AdminUser>(u, role);
            case "recruiter":
              return mapApiUserToStoreUser<RecruiterUser>(u, role);
            case "instructor":
              return mapApiUserToStoreUser<InstructorUser>(u, role);
            case "student":
              return mapApiUserToStoreUser<StudentUser>(u, role);
            default:
              throw new Error(`Unsupported role: ${role}`);
          }
        });
        console.log(`Processed ${mappedUsers.length} users with role ${role}`);

        // Update only the specific category, preserve others
        set((state) => ({
          ...state,
          [key]: mappedUsers,
          loading: false,
        }));
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      set({
        error: `Failed to fetch users: ${errorMessage}`,
        loading: false,
      });
      throw error;
    }
  },
}));

// Helpers
export const getOrgs = () => {
  const { organizations } = useOrganizationStore.getState();
  return organizations.map((org) => ({ id: org.id, name: org.name }));
};

export const getBatches = async () => {
  try {
    const jwt = await getBackendJwt();
    const batches = await fetchAllBatches(jwt);
    return batches;
  } catch (error) {
    console.error("Failed to fetch batches:", error);
    return [];
  }
};
