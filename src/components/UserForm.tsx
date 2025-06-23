import React, { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaUniversity, FaUsers, FaSave, FaTimes, FaPlus } from 'react-icons/fa';
import { User, UserRole } from '@/store/adminStore';

interface UserFormProps {
  user?: User | null;
  onSubmit: (user: Omit<User, 'id'>) => void;
  onCancel: () => void;
  isEdit?: boolean;
}

const UserForm: React.FC<UserFormProps> = ({ user, onSubmit, onCancel, isEdit = false }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: 'Password@123',
    org_id: '',
    batch_id: [] as string[],
    userRole: UserRole.STUDENT,
  });

  const [newBatch, setNewBatch] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email || '',
        password: user.password || 'Password@123',
        org_id: user.org_id || '',
        batch_id: user.batch_id,
        userRole: user.userRole,
      });
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newUser = {
      ...formData,
      email: formData.email || null,
      password: formData.password || null,
      org_id: formData.org_id || null,
    };

    onSubmit(newUser);
  };

  const handleInputChange = (field: string, value: string | UserRole) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddBatch = () => {
    if (newBatch.trim() && !formData.batch_id.includes(newBatch.trim())) {
      setFormData(prev => ({
        ...prev,
        batch_id: [...prev.batch_id, newBatch.trim()]
      }));
      setNewBatch('');
    }
  };

  const handleRemoveBatch = (batchToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      batch_id: prev.batch_id.filter(batch => batch !== batchToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddBatch();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Username */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-black mb-1">
            <FaUser className="w-3 h-3 text-blue-600" />
            <span>Username *</span>
          </label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-black text-sm"
            placeholder="Enter username"
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-black mb-1">
            <FaEnvelope className="w-3 h-3 text-blue-600" />
            <span>Email *</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-black text-sm"
            placeholder="Enter email"
            required
          />
        </div>

        {/* Password */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-black mb-1">
            <FaUser className="w-3 h-3 text-blue-600" />
            <span>Password *</span>
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-black text-sm"
            placeholder="Enter password"
            required
          />
        </div>

        {/* Organization */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-black mb-1">
            <FaUniversity className="w-3 h-3 text-blue-600" />
            <span>Organization *</span>
          </label>
          <input
            type="text"
            value={formData.org_id}
            onChange={(e) => handleInputChange('org_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-black text-sm"
            placeholder="Enter organization"
            required
          />
        </div>
      </div>

      {/* User Role */}
      <div>
        <label className="flex items-center space-x-2 text-sm font-medium text-black mb-1">
          <FaUsers className="w-3 h-3 text-blue-600" />
          <span>User Role *</span>
        </label>
        <select
          value={formData.userRole}
          onChange={(e) => handleInputChange('userRole', e.target.value as UserRole)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-black text-sm"
          required
        >
          <option value={UserRole.STUDENT}>Student</option>
          <option value={UserRole.INSTRUCTOR}>Instructor</option>
          <option value={UserRole.COLLEGE_ADMIN}>College Admin</option>
          <option value={UserRole.ADMIN}>Admin</option>
        </select>
      </div>

      {/* Batch Selection */}
      <div>
        <label className="flex items-center space-x-2 text-sm font-medium text-black mb-2">
          <FaUsers className="w-3 h-3 text-blue-600" />
          <span>Batches *</span>
        </label>
        
        {/* Add New Batch */}
        <div className="flex space-x-2 mb-3">
          <input
            type="text"
            value={newBatch}
            onChange={(e) => setNewBatch(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-black text-sm"
            placeholder="Add new batch"
          />
          <button
            type="button"
            onClick={handleAddBatch}
            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
          >
            <FaPlus className="w-3 h-3" />
          </button>
        </div>

        {/* Batch Chips */}
        <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border border-gray-300 rounded-lg bg-white">
          {formData.batch_id.length === 0 ? (
            <span className="text-gray-400 text-sm">No batches added</span>
          ) : (
            formData.batch_id.map((batch) => (
              <span
                key={batch}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border border-blue-200"
              >
                {batch}
                <button
                  type="button"
                  onClick={() => handleRemoveBatch(batch)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <FaTimes className="w-2 h-2" />
                </button>
              </span>
            ))
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3 pt-4">
        <button
          type="submit"
          className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl text-sm"
        >
          <FaSave className="w-4 h-4" />
          <span>{isEdit ? 'Update' : 'Create'}</span>
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border-2 border-gray-300 text-black rounded-lg font-medium hover:bg-gray-50 transition-all duration-200 text-sm"
        >
          <FaTimes className="w-4 h-4" />
          <span>Cancel</span>
        </button>
      </div>
    </form>
  );
};

export default UserForm; 