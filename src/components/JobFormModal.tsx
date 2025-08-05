"use client";

import React, { useState, useEffect } from "react";
import { FaTimes, FaPlus, FaTrash } from "react-icons/fa";

interface Job {
  id?: string;
  title: string;
  companyName: string;
  location: string;
  description: string;
  skills: string[];
  eligibleBranches: string[];
  status: "open" | "closed";
}

interface JobFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (job: Job) => void;
  initialData?: Job;
  isEditing?: boolean;
}

const JobFormModal: React.FC<JobFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditing = false,
}) => {
  const [job, setJob] = useState<Job>({
    title: "",
    companyName: "",
    location: "",
    description: "",
    skills: [],
    eligibleBranches: [],
    status: "open",
  });
  const [skill, setSkill] = useState("");
  const [branch, setBranch] = useState("");

  useEffect(() => {
    if (initialData) {
      setJob(initialData);
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setJob({ ...job, [name]: value });
  };

  const handleAddSkill = () => {
    if (skill.trim() && !job.skills.includes(skill)) {
      setJob({ ...job, skills: [...job.skills, skill] });
      setSkill("");
    }
  };

  const handleRemoveSkill = (index: number) => {
    const updatedSkills = [...job.skills];
    updatedSkills.splice(index, 1);
    setJob({ ...job, skills: updatedSkills });
  };

  const handleAddBranch = () => {
    if (branch.trim() && !job.eligibleBranches.includes(branch)) {
      setJob({
        ...job,
        eligibleBranches: [...job.eligibleBranches, branch],
      });
      setBranch("");
    }
  };

  const handleRemoveBranch = (index: number) => {
    const updatedBranches = [...job.eligibleBranches];
    updatedBranches.splice(index, 1);
    setJob({ ...job, eligibleBranches: updatedBranches });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(job);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">
            {isEditing ? "Edit Job Listing" : "Create New Job Listing"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Job Title*
              </label>
              <input
                type="text"
                name="title"
                value={job.title}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Full Stack Developer"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Company Name*
              </label>
              <input
                type="text"
                name="companyName"
                value={job.companyName}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Tech Innovations"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Location*
              </label>
              <input
                type="text"
                name="location"
                value={job.location}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Remote, Bangalore, Hybrid"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Status
              </label>
              <select
                name="status"
                value={job.status}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Job Description*
            </label>
            <textarea
              name="description"
              value={job.description}
              onChange={handleChange}
              rows={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the job responsibilities, requirements, and benefits..."
              required
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Required Skills
              </label>
              <div className="flex mb-2">
                <input
                  type="text"
                  value={skill}
                  onChange={(e) => setSkill(e.target.value)}
                  className="flex-grow border border-gray-300 rounded-l-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. React, JavaScript"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600 focus:outline-none"
                >
                  <FaPlus />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {job.skills.map((s, index) => (
                  <div
                    key={index}
                    className="flex items-center bg-gray-100 rounded-full px-3 py-1"
                  >
                    <span className="text-gray-800 text-sm mr-2">{s}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(index)}
                      className="text-red-500 hover:text-red-700 focus:outline-none"
                    >
                      <FaTrash size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Eligible Branches
              </label>
              <div className="flex mb-2">
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="flex-grow border border-gray-300 rounded-l-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Computer Science"
                />
                <button
                  type="button"
                  onClick={handleAddBranch}
                  className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600 focus:outline-none"
                >
                  <FaPlus />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {job.eligibleBranches.map((b, index) => (
                  <div
                    key={index}
                    className="flex items-center bg-gray-100 rounded-full px-3 py-1"
                  >
                    <span className="text-gray-800 text-sm mr-2">{b}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBranch(index)}
                      className="text-red-500 hover:text-red-700 focus:outline-none"
                    >
                      <FaTrash size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-8 gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none"
            >
              {isEditing ? "Update Job" : "Create Job"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobFormModal;
