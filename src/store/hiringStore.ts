import { create } from 'zustand';

export type JobStatus = 'Active' | 'Closed' | 'Draft';
export type JobType = 'Full-time' | 'Part-time' | 'Contract';

export interface Job {
  id: number;
  title: string;
  department: string;
  location: string;
  type: JobType;
  postedDate: string;
  deadline: string;
  applicants: number;
  status: JobStatus;
}

interface HiringStoreState {
  jobs: Job[];
  search: string;
  departmentFilter: string;
  typeFilter: JobType | 'All';
  statusFilter: JobStatus | 'All';
  setSearch: (search: string) => void;
  setDepartmentFilter: (department: string) => void;
  setTypeFilter: (type: JobType | 'All') => void;
  setStatusFilter: (status: JobStatus | 'All') => void;
  addJob: (job: Job) => void;
  deleteJob: (id: number) => void;
  editJob: (job: Job) => void;
}

export const useHiringStore = create<HiringStoreState>((set, get) => ({
  jobs: [
    {
      id: 1,
      title: 'Computer Science Professor',
      department: 'Computer Science',
      location: 'Main Campus',
      type: 'Full-time',
      postedDate: '2023-11-01',
      deadline: '2023-12-01',
      applicants: 25,
      status: 'Active',
    },
    {
      id: 2,
      title: 'Mathematics Lecturer',
      department: 'Mathematics',
      location: 'Main Campus',
      type: 'Full-time',
      postedDate: '2023-10-15',
      deadline: '2023-11-15',
      applicants: 18,
      status: 'Active',
    },
    {
      id: 3,
      title: 'Physics Lab Assistant',
      department: 'Physics',
      location: 'Science Block',
      type: 'Part-time',
      postedDate: '2023-10-20',
      deadline: '2023-11-20',
      applicants: 12,
      status: 'Active',
    },
    {
      id: 4,
      title: 'English Professor',
      department: 'English',
      location: 'Arts Block',
      type: 'Full-time',
      postedDate: '2023-09-15',
      deadline: '2023-10-15',
      applicants: 8,
      status: 'Closed',
    },
  ],
  search: '',
  departmentFilter: 'All Departments',
  typeFilter: 'All',
  statusFilter: 'All',
  setSearch: (search) => set({ search }),
  setDepartmentFilter: (department) => set({ departmentFilter: department }),
  setTypeFilter: (type) => set({ typeFilter: type }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  addJob: (job) => set((state) => ({ jobs: [...state.jobs, job] })),
  deleteJob: (id) => set((state) => ({ jobs: state.jobs.filter((j) => j.id !== id) })),
  editJob: (job) => set((state) => ({ jobs: state.jobs.map((j) => j.id === job.id ? job : j) })),
})); 