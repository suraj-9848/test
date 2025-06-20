import { create } from 'zustand';

export type AdminRole = 'College Admin' | 'Deputy Admin' | 'Academic Head';
export type InstructorRole = 'Senior Professor' | 'Associate Professor' | 'Assistant Professor';
export type StudentRole = 'First Year' | 'Second Year' | 'Third Year' | 'Fourth Year' | 'Final Year';

export type UserRole = AdminRole | InstructorRole | StudentRole;
export type UserStatus = 'Active' | 'Inactive';

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

type UserCategory = 'college-admins' | 'instructors' | 'students';

type StoreKeyMap = {
  'college-admins': 'admins';
  'instructors': 'instructors';
  'students': 'students';
};

interface AdminStoreState {
  admins: AdminUser[];
  instructors: InstructorUser[];
  students: StudentUser[];
  search: string;
  collegeFilter: string;
  statusFilter: UserStatus | 'All';

  setSearch: (search: string) => void;
  setCollegeFilter: (college: string) => void;
  setStatusFilter: (status: UserStatus | 'All') => void;

  addUser: (type: UserCategory, user: AdminUser | InstructorUser | StudentUser) => void;
  deleteUser: (type: UserCategory, id: number) => void;
  editUser: (type: UserCategory, user: AdminUser | InstructorUser | StudentUser) => void;
}

function mapTypeToKey(type: UserCategory): keyof AdminStoreState {
  const map: StoreKeyMap = {
    'college-admins': 'admins',
    'instructors': 'instructors',
    'students': 'students',
  };
  return map[type];
}

export const useAdminStore = create<AdminStoreState>((set, get) => ({
  admins: [
    {
      id: 1,
      name: 'Dr. Rajesh Kumar',
      email: 'rajesh@aquinas.edu',
      role: 'College Admin',
      college: 'Aquinas College of Engineering',
      status: 'Active',
      joinDate: '2020-01-15',
    },
    {
      id: 2,
      name: 'Prof. Neha Verma',
      email: 'neha@oxfordtech.edu',
      role: 'Deputy Admin',
      college: 'Oxford Institute of Technology',
      status: 'Active',
      joinDate: '2021-07-10',
    },
    {
      id: 3,
      name: 'Dr. Anil Joshi',
      email: 'anil@modernit.edu',
      role: 'Academic Head',
      college: 'Modern Institute of Technology',
      status: 'Inactive',
      joinDate: '2018-06-05',
    },
    {
      id: 4,
      name: 'Dr. Fatima Khan',
      email: 'fatima@stxaviers.edu',
      role: 'College Admin',
      college: 'St. Xavier’s College',
      status: 'Active',
      joinDate: '2019-12-01',
    },
  ],
  instructors: [
    {
      id: 1,
      name: 'Prof. Amit Sharma',
      email: 'amit@aquinas.edu',
      role: 'Senior Professor',
      college: 'Aquinas College of Engineering',
      status: 'Active',
      joinDate: '2015-01-12',
    },
    {
      id: 2,
      name: 'Dr. Meena Rao',
      email: 'meena@oxfordtech.edu',
      role: 'Associate Professor',
      college: 'Oxford Institute of Technology',
      status: 'Active',
      joinDate: '2016-03-25',
    },
    {
      id: 3,
      name: 'Prof. Sanjay Singh',
      email: 'sanjay@modernit.edu',
      role: 'Assistant Professor',
      college: 'Modern Institute of Technology',
      status: 'Inactive',
      joinDate: '2017-11-30',
    },
    {
      id: 4,
      name: 'Dr. Lata Mukherjee',
      email: 'lata@stxaviers.edu',
      role: 'Senior Professor',
      college: 'St. Xavier’s College',
      status: 'Active',
      joinDate: '2020-09-10',
    },
  ],
  students: [
    {
      id: 1,
      name: 'Rohit Gupta',
      email: 'rohit@students.aquinas.edu',
      role: 'Final Year',
      college: 'Aquinas College of Engineering',
      status: 'Active',
      joinDate: '2020-09-01',
    },
    {
      id: 2,
      name: 'Sneha Reddy',
      email: 'sneha@students.oxfordtech.edu',
      role: 'Second Year',
      college: 'Oxford Institute of Technology',
      status: 'Inactive',
      joinDate: '2022-09-01',
    },
    {
      id: 3,
      name: 'Aman Yadav',
      email: 'aman@students.modernit.edu',
      role: 'Third Year',
      college: 'Modern Institute of Technology',
      status: 'Active',
      joinDate: '2021-08-12',
    },
    {
      id: 4,
      name: 'Priya Nair',
      email: 'priya@students.stxaviers.edu',
      role: 'First Year',
      college: 'St. Xavier’s College',
      status: 'Active',
      joinDate: '2023-08-20',
    },
    {
      id: 5,
      name: 'Karthik Iyer',
      email: 'karthik@students.oxfordtech.edu',
      role: 'Fourth Year',
      college: 'Oxford Institute of Technology',
      status: 'Active',
      joinDate: '2020-09-15',
    },
  ],
  search: '',
  collegeFilter: 'All Colleges',
  statusFilter: 'All',

  setSearch: (search) => set({ search }),
  setCollegeFilter: (college) => set({ collegeFilter: college }),
  setStatusFilter: (status) => set({ statusFilter: status }),

  addUser: (type, user) => {
    const key = mapTypeToKey(type);
    set((state) => ({
      [key]: [...state[key] as any[], user],
    }));
  },

  deleteUser: (type, id) => {
    const key = mapTypeToKey(type);
    set((state) => ({
      [key]: (state[key] as any[]).filter((u) => u.id !== id),
    }));
  },

  editUser: (type, user) => {
    const key = mapTypeToKey(type);
    set((state) => ({
      [key]: (state[key] as any[]).map((u) => u.id === user.id ? user : u),
    }));
  },
}));
