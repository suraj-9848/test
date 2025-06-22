import React from 'react';
import { FaExclamationTriangle, FaTrash, FaTimes } from 'react-icons/fa';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  type = 'danger'
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: 'text-red-500',
          button: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
          iconBg: 'bg-red-100'
        };
      case 'warning':
        return {
          icon: 'text-yellow-500',
          button: 'bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700',
          iconBg: 'bg-yellow-100'
        };
      case 'info':
        return {
          icon: 'text-blue-500',
          button: 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700',
          iconBg: 'bg-blue-100'
        };
      default:
        return {
          icon: 'text-red-500',
          button: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
          iconBg: 'bg-red-100'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-red-50 to-orange-50">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 ${styles.iconBg} rounded-lg flex items-center justify-center`}>
              <FaExclamationTriangle className={`w-4 h-4 ${styles.icon}`} />
            </div>
            <h3 className="text-lg font-semibold text-black">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4">
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            {message}
          </p>
          
          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onConfirm}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${styles.button}`}
            >
              <FaTrash className="w-4 h-4" />
              <span>{confirmText}</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border-2 border-gray-300 text-black rounded-lg font-medium hover:bg-gray-50 transition-all duration-200"
            >
              <FaTimes className="w-4 h-4" />
              <span>{cancelText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal; 