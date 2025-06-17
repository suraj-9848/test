'use client'

import React, { useState } from 'react';
import { FaEye, FaFileInvoice } from 'react-icons/fa';

interface Payment {
  id: number;
  receiptNo: string;
  amount: number;
  studentName: string;
  paymentType: string;
  paidDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

const PaymentApproval: React.FC = () => {
  const [payments] = useState<Payment[]>([
    {
      id: 1,
      receiptNo: 'REC-23-0001',
      amount: 125000.00,
      studentName: 'John Doe',
      paymentType: 'Course Fee',
      paidDate: '2023-10-26',
      status: 'PENDING'
    },
    {
      id: 2,
      receiptNo: 'REC-23-0002',
      amount: 75000.00,
      studentName: 'Jane Smith',
      paymentType: 'Exam Fee',
      paidDate: '2023-11-12',
      status: 'PENDING'
    },
    {
      id: 3,
      receiptNo: 'REC-23-0003',
      amount: 25000.00,
      studentName: 'Mike Johnson',
      paymentType: 'Course Fee',
      paidDate: '2023-11-26',
      status: 'PENDING'
    },
    {
      id: 4,
      receiptNo: 'REC-23-0004',
      amount: 100000.00,
      studentName: 'Sarah Wilson',
      paymentType: 'Course Fee',
      paidDate: '2023-10-26',
      status: 'PENDING'
    },
    {
      id: 5,
      receiptNo: 'REC-23-0005',
      amount: 50000.00,
      studentName: 'David Brown',
      paymentType: 'Course Fee',
      paidDate: '2023-10-26',
      status: 'APPROVED'
    }
  ]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="px-3 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
            PENDING
          </span>
        );
      case 'APPROVED':
        return (
          <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
            APPROVED
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
            REJECTED
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-6 mb-4">
          <button className="px-6 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
            Payment Details
          </button>
          <button className="px-6 py-2 text-sm font-medium bg-teal-100 text-teal-700 rounded-lg">
            Payment Approval
          </button>
          <button className="px-6 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
            Invoice Approval
          </button>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
          <span>Payment Details</span>
          <span>/</span>
          <span className="text-gray-700">Create Invoice</span>
        </div>
        
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Payment Approval</h2>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
          <input
            type="text"
            placeholder="Student's Name, Student's ID"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
            <option>Select Branch</option>
            <option>Computer Science</option>
            <option>Electronics</option>
            <option>Mechanical</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Faculty</label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
            <option>Select Faculty</option>
            <option>Engineering</option>
            <option>Management</option>
            <option>Arts</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
            <option>Select Course</option>
            <option>B.Tech</option>
            <option>M.Tech</option>
            <option>MBA</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Batch</label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
            <option>Select Batch</option>
            <option>2020-2024</option>
            <option>2021-2025</option>
            <option>2022-2026</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type</label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
            <option>Payment Type</option>
            <option>Course Fee</option>
            <option>Exam Fee</option>
            <option>Library Fee</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
            <option>Pending/Approved</option>
            <option>Pending</option>
            <option>Approved</option>
            <option>Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (Rs)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Slip</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.map((payment, index) => (
              <tr key={payment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.receiptNo}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.amount.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.studentName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.paymentType}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.paidDate}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                    <FaEye className="w-4 h-4 text-gray-600" />
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(payment.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                    <FaFileInvoice className="w-4 h-4 text-gray-600" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">Showing</span>
          <select className="px-2 py-1 border border-gray-300 rounded text-sm">
            <option>5</option>
            <option>10</option>
            <option>25</option>
          </select>
          <span className="text-sm text-gray-700">of 50 entries</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
            &lt;
          </button>
          <button className="px-3 py-1 bg-teal-500 text-white rounded text-sm">
            1
          </button>
          <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentApproval;
