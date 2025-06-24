import React, { useState, useEffect } from 'react';
import { FaBuilding, FaMapMarkerAlt, FaFileAlt, FaSave, FaTimes } from 'react-icons/fa';
import { Organization } from '@/store/organizationStore';

interface OrganizationFormProps {
  organization?: Organization | null;
  onSubmit: (org: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  isEdit?: boolean;
}

const OrganizationForm: React.FC<OrganizationFormProps> = ({ 
  organization, 
  onSubmit, 
  onCancel, 
  isEdit = false 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name,
        address: organization.address,
        description: organization.description,
      });
    }
  }, [organization]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Organization name is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Organization Name */}
      <div>
        <label className="flex items-center space-x-2 text-sm font-medium text-black mb-1">
          <FaBuilding className="w-3 h-3 text-blue-600" />
          <span>Organization Name *</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-black text-sm ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter organization name"
          required
        />
        {errors.name && (
          <p className="text-red-500 text-xs mt-1">{errors.name}</p>
        )}
      </div>

      {/* Address */}
      <div>
        <label className="flex items-center space-x-2 text-sm font-medium text-black mb-1">
          <FaMapMarkerAlt className="w-3 h-3 text-blue-600" />
          <span>Address *</span>
        </label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-black text-sm ${
            errors.address ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter address (e.g., City, State)"
          required
        />
        {errors.address && (
          <p className="text-red-500 text-xs mt-1">{errors.address}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="flex items-center space-x-2 text-sm font-medium text-black mb-1">
          <FaFileAlt className="w-3 h-3 text-blue-600" />
          <span>Description *</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={4}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-black text-sm resize-none ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter organization description"
          required
        />
        {errors.description && (
          <p className="text-red-500 text-xs mt-1">{errors.description}</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <FaTimes className="w-4 h-4" />
          <span>Cancel</span>
        </button>
        <button
          type="submit"
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <FaSave className="w-4 h-4" />
          <span>{isEdit ? 'Update' : 'Create'} Organization</span>
        </button>
      </div>
    </form>
  );
};

export default OrganizationForm; 