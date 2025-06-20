'use client'

import React, { useMemo } from 'react';
import { FaEye, FaFileInvoice } from 'react-icons/fa';
import { usePaymentStore, Payment, PaymentStatus } from '@/store/paymentStore';

const PaymentApproval: React.FC = () => {
  const {
    payments,
    search,
    branchFilter,
    facultyFilter,
    courseFilter,
    batchFilter,
    paymentTypeFilter,
    statusFilter,
    setSearch,
    setBranchFilter,
    setFacultyFilter,
    setCourseFilter,
    setBatchFilter,
    setPaymentTypeFilter,
    setStatusFilter,
    deletePayment,
  } = usePaymentStore();

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const matchesSearch =
        search.trim() === '' ||
        payment.studentName.toLowerCase().includes(search.toLowerCase());
      // Add other filters here when data supports them
      const matchesStatus =
        statusFilter === 'All' || payment.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [payments, search, statusFilter]);

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="px-3 py-1 text-xs font-medium bg-yellow-200 text-yellow-800 rounded-full">
            PENDING
          </span>
        );
      case 'APPROVED':
        return (
          <span className="px-3 py-1 text-xs font-medium bg-gray-200 text-gray-800 rounded-full">
            APPROVED
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-3 py-1 text-xs font-medium bg-red-200 text-red-800 rounded-full">
            REJECTED
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-6 mb-4">
          <button className="px-6 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
            Payment Details
          </button>
          <button className="px-6 py-2 text-sm font-medium bg-gray-200 text-gray-800 rounded-lg">
            Payment Approval
          </button>
          <button className="px-6 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
            Invoice Approval
          </button>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
          <span>Payment Details</span>
          <span>/</span>
          <span className="text-gray-700">Payment Approval</span>
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500">
            <option>Select Branch</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Faculty</label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500">
            <option>Select Faculty</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500">
            <option>Select Course</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Batch</label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500">
            <option>Select Batch</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type</label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500">
            <option>Payment Type</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | 'All')}
          >
            <option value="All">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
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
            {filteredPayments.map((payment, index) => (
              <tr key={payment.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{payment.receiptNo}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.amount.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.studentName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.paymentType}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.paidDate}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button className="text-gray-500 hover:text-gray-700">
                    <FaFileInvoice className="w-4 h-4" />
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(payment.status)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-gray-500 hover:text-gray-700">
                    <FaEye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentApproval;
