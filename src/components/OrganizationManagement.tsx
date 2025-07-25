"use client";
import React, { useMemo, useState, useEffect } from "react";
import {
  FaTrash,
  FaEdit,
  FaPlus,
  FaSearch,
  FaBuilding,
  FaMapMarkerAlt,
  FaSpinner,
} from "react-icons/fa";
import { useOrganizationStore, Organization } from "@/store/organizationStore";
import { useToast } from "./ToastContext";
import OrganizationModal from "./OrganizationModal";
import OrganizationForm from "./OrganizationForm";
import ConfirmModal from "./ConfirmModal";

const OrganizationManagement: React.FC = () => {
  const {
    organizations,
    search,
    loading,
    setSearch,
    fetchOrganizations,
    addOrganization,
    deleteOrganization,
    editOrganization,
  } = useOrganizationStore();

  const { showToast } = useToast();

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedOrganization, setSelectedOrganization] =
    useState<Organization | null>(null);

  // Fetch organizations on component mount
  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        await fetchOrganizations();
      } catch (err) {
        console.log(err);
        showToast("error", "Failed to load organizations");
      }
    };
    loadOrganizations();
  }, [fetchOrganizations, showToast]);

  const filteredOrganizations = useMemo(() => {
    return organizations.filter((org) => {
      const matchesSearch =
        search.trim() === "" ||
        (org.name && org.name.toLowerCase().includes(search.toLowerCase()));

      // Add other filter conditions as needed
      return matchesSearch;
    });
  }, [organizations, search]);

  const handleAddOrganization = () => {
    setIsAddModalOpen(true);
  };

  const handleEditOrganization = (org: Organization) => {
    setSelectedOrganization(org);
    setIsEditModalOpen(true);
  };

  const handleDeleteOrganization = (org: Organization) => {
    setSelectedOrganization(org);
    setIsDeleteModalOpen(true);
  };

  const handleSubmitOrganization = async (
    orgData: Omit<Organization, "id" | "createdAt" | "updatedAt">,
  ) => {
    try {
      if (selectedOrganization) {
        // Edit mode
        await editOrganization(selectedOrganization.id, orgData);
        showToast("success", "Organization updated successfully");
        setIsEditModalOpen(false);
      } else {
        // Add mode
        await addOrganization(orgData);
        showToast("success", "Organization created successfully");
        setIsAddModalOpen(false);
      }
      setSelectedOrganization(null);
    } catch (err) {
      console.log(err);
      // Error is already handled by the store and shown via toast
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedOrganization) {
      try {
        await deleteOrganization(selectedOrganization.id);
        showToast("success", "Organization deleted successfully");
        setIsDeleteModalOpen(false);
        setSelectedOrganization(null);
      } catch (error) {
        // Error is already handled by the store and shown via toast
        console.log(error);
      }
    }
  };

  const closeModals = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedOrganization(null);
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <FaBuilding className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-black">
              Organization Management
            </h2>
            <p className="text-gray-600">
              Manage all organizations in the system
            </p>
          </div>
        </div>
        <button
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleAddOrganization}
          disabled={loading}
        >
          {loading ? (
            <FaSpinner className="w-4 h-4 animate-spin" />
          ) : (
            <FaPlus className="w-4 h-4" />
          )}
          <span className="font-medium">Add Organization</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <FaSearch className="w-4 h-4 text-blue-600" />
          <h3 className="text-lg font-semibold text-black">
            Search Organizations
          </h3>
        </div>
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, address, or description..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-black"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && organizations.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <FaSpinner className="w-8 h-8 text-blue-500 animate-spin" />
            <span className="text-lg font-medium text-gray-600">
              Loading organizations...
            </span>
          </div>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-50 to-purple-50">
                <tr>
                  {[
                    "#",
                    "Organization",
                    "Address",
                    "Description",
                    "Actions",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrganizations.map((org, index) => (
                  <tr
                    key={org.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-black">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {org.name?.charAt(0)?.toUpperCase() || "?"}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-black">
                          {org.name || "Unknown Organization"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <FaMapMarkerAlt className="w-3 h-3 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {org.address}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p
                        className="text-sm text-gray-600 max-w-xs truncate"
                        title={org.description}
                      >
                        {org.description}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditOrganization(org)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Edit Organization"
                          disabled={loading}
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteOrganization(org)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete Organization"
                          disabled={loading}
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredOrganizations.length === 0 && !loading && (
            <div className="text-center py-12">
              <FaBuilding className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No organizations found
              </h3>
              <p className="text-gray-500">
                {search
                  ? "Try adjusting your search terms."
                  : "Get started by adding your first organization."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {isAddModalOpen && (
        <OrganizationModal
          isOpen={isAddModalOpen}
          onClose={closeModals}
          title="Add Organization"
        >
          <OrganizationForm
            onSubmit={handleSubmitOrganization}
            onCancel={closeModals}
            isEdit={false}
          />
        </OrganizationModal>
      )}

      {isEditModalOpen && selectedOrganization && (
        <OrganizationModal
          isOpen={isEditModalOpen}
          onClose={closeModals}
          title="Edit Organization"
        >
          <OrganizationForm
            organization={selectedOrganization}
            onSubmit={handleSubmitOrganization}
            onCancel={closeModals}
            isEdit={true}
          />
        </OrganizationModal>
      )}

      {isDeleteModalOpen && selectedOrganization && (
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={closeModals}
          onConfirm={handleConfirmDelete}
          title="Delete Organization"
          message={`Are you sure you want to delete "${selectedOrganization.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
        />
      )}
    </div>
  );
};

export default OrganizationManagement;
