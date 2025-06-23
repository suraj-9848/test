import { create } from 'zustand';

export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Payment {
  id: number;
  receiptNo: string;
  amount: number;
  studentName: string;
  paymentType: string;
  paidDate: string;
  status: PaymentStatus;
}

interface PaymentStoreState {
  payments: Payment[];
  search: string;
  branchFilter: string;
  facultyFilter: string;
  courseFilter: string;
  batchFilter: string;
  paymentTypeFilter: string;
  statusFilter: PaymentStatus | 'All';
  setSearch: (search: string) => void;
  setBranchFilter: (branch: string) => void;
  setFacultyFilter: (faculty: string) => void;
  setCourseFilter: (course: string) => void;
  setBatchFilter: (batch: string) => void;
  setPaymentTypeFilter: (type: string) => void;
  setStatusFilter: (status: PaymentStatus | 'All') => void;
  addPayment: (payment: Payment) => void;
  deletePayment: (id: number) => void;
  editPayment: (payment: Payment) => void;
}

export const usePaymentStore = create<PaymentStoreState>((set) => ({
  payments: [
    {
      id: 1,
      receiptNo: 'REC-23-0001',
      amount: 125000.00,
      studentName: 'John Doe',
      paymentType: 'Course Fee',
      paidDate: '2023-10-26',
      status: 'PENDING',
    },
    {
      id: 2,
      receiptNo: 'REC-23-0002',
      amount: 75000.00,
      studentName: 'Jane Smith',
      paymentType: 'Exam Fee',
      paidDate: '2023-11-12',
      status: 'PENDING',
    },
    {
      id: 3,
      receiptNo: 'REC-23-0003',
      amount: 25000.00,
      studentName: 'Mike Johnson',
      paymentType: 'Course Fee',
      paidDate: '2023-11-26',
      status: 'PENDING',
    },
    {
      id: 4,
      receiptNo: 'REC-23-0004',
      amount: 100000.00,
      studentName: 'Sarah Wilson',
      paymentType: 'Course Fee',
      paidDate: '2023-10-26',
      status: 'PENDING',
    },
    {
      id: 5,
      receiptNo: 'REC-23-0005',
      amount: 50000.00,
      studentName: 'David Brown',
      paymentType: 'Course Fee',
      paidDate: '2023-10-26',
      status: 'APPROVED',
    },
  ],
  search: '',
  branchFilter: '',
  facultyFilter: '',
  courseFilter: '',
  batchFilter: '',
  paymentTypeFilter: '',
  statusFilter: 'All',
  setSearch: (search) => set({ search }),
  setBranchFilter: (branch) => set({ branchFilter: branch }),
  setFacultyFilter: (faculty) => set({ facultyFilter: faculty }),
  setCourseFilter: (course) => set({ courseFilter: course }),
  setBatchFilter: (batch) => set({ batchFilter: batch }),
  setPaymentTypeFilter: (type) => set({ paymentTypeFilter: type }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  addPayment: (payment) => set((state) => ({ payments: [...state.payments, payment] })),
  deletePayment: (id) => set((state) => ({ payments: state.payments.filter((p) => p.id !== id) })),
  editPayment: (payment) => set((state) => ({ payments: state.payments.map((p) => p.id === payment.id ? payment : p) })),
})); 