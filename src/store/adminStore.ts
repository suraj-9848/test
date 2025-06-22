import { create } from 'zustand';

export enum UserRole {
  STUDENT = "student",
  ADMIN = "admin",
  COLLEGE_ADMIN = "college_admin",
  INSTRUCTOR = "instructor",
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

interface AdminStoreState {
  users: User[];
  search: string;
  orgFilter: string;
  roleFilter: UserRole | 'All';
  selectedOrg: string | null;

  setSearch: (search: string) => void;
  setOrgFilter: (org: string) => void;
  setRoleFilter: (role: UserRole | 'All') => void;
  setSelectedOrg: (org: string | null) => void;

  addUser: (user: Omit<User, 'id'>) => void;
  deleteUser: (id: string) => void;
  editUser: (user: User) => void;
}

// Mock organizations data
const mockOrgs = [
  { id: '1', name: 'Aquinas College of Engineering' },
  { id: '2', name: 'Oxford Institute of Technology' },
  { id: '3', name: 'Modern Institute of Technology' },
  { id: '4', name: 'St. Xavier\'s College' },
  { id: '5', name: 'Delhi Technical University' },
  { id: '6', name: 'IIT Delhi' },
  { id: '7', name: 'BITS Pilani' }
];

// Mock batch data
const mockBatches = [
  '2024-Batch-A',
  '2024-Batch-B', 
  '2023-Batch-A',
  '2023-Batch-B',
  '2022-Batch-A',
  '2022-Batch-B'
];

export const useAdminStore = create<AdminStoreState>((set) => ({
  users: [
    {
      id: '1',
      username: 'Dr. Rajesh Kumar',
      email: 'rajesh@aquinas.edu',
      password: null,
      org_id: '1',
      batch_id: ['2024-Batch-A'],
      userRole: UserRole.COLLEGE_ADMIN,
    },
    {
      id: '2',
      username: 'Prof. Neha Verma',
      email: 'neha@oxfordtech.edu',
      password: null,
      org_id: '2',
      batch_id: ['2024-Batch-B'],
      userRole: UserRole.COLLEGE_ADMIN,
    },
    {
      id: '3',
      username: 'Prof. Amit Sharma',
      email: 'amit@aquinas.edu',
      password: null,
      org_id: '1',
      batch_id: ['2024-Batch-A', '2023-Batch-A'],
      userRole: UserRole.INSTRUCTOR,
    },
    {
      id: '4',
      username: 'Dr. Meena Rao',
      email: 'meena@oxfordtech.edu',
      password: null,
      org_id: '2',
      batch_id: ['2024-Batch-B'],
      userRole: UserRole.INSTRUCTOR,
    },
    {
      id: '5',
      username: 'Rohit Gupta',
      email: 'rohit@students.aquinas.edu',
      password: null,
      org_id: '1',
      batch_id: ['2024-Batch-A'],
      userRole: UserRole.STUDENT,
    },
    {
      id: '6',
      username: 'Sneha Reddy',
      email: 'sneha@students.oxfordtech.edu',
      password: null,
      org_id: '2',
      batch_id: ['2023-Batch-B'],
      userRole: UserRole.STUDENT,
    },
    {
      id: '7',
      username: 'Aman Yadav',
      email: 'aman@students.modernit.edu',
      password: null,
      org_id: '3',
      batch_id: ['2022-Batch-A'],
      userRole: UserRole.STUDENT,
    },
    {
      id: '8',
      username: 'Priya Nair',
      email: 'priya@students.stxaviers.edu',
      password: null,
      org_id: '4',
      batch_id: ['2024-Batch-A'],
      userRole: UserRole.STUDENT,
    },
  ],
  search: '',
  orgFilter: 'All Organizations',
  roleFilter: 'All',
  selectedOrg: null,

  setSearch: (search) => set({ search }),
  setOrgFilter: (org) => set({ orgFilter: org }),
  setRoleFilter: (role) => set({ roleFilter: role }),
  setSelectedOrg: (org) => set({ selectedOrg: org }),

  addUser: (user) => {
    const newUser: User = {
      ...user,
      id: crypto.randomUUID(),
    };
    set((state) => ({
      users: [...state.users, newUser],
    }));
  },

  deleteUser: (id) => {
    set((state) => ({
      users: state.users.filter((u) => u.id !== id),
    }));
  },

  editUser: (user) => {
    set((state) => ({
      users: state.users.map((u) => u.id === user.id ? user : u),
    }));
  },
}));

// Export helper functions
export const getOrgs = () => mockOrgs;
export const getBatches = () => mockBatches; 