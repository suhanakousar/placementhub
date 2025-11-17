import React, { useState } from 'react';
import { FaPlus, FaGithub, FaExternalLinkAlt, FaTrash, FaEdit } from 'react-icons/fa';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const Projects = ({ studentData, onUpdate }) => {
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddInternship, setShowAddInternship] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    technologies: '',
    githubLink: '',
    demoLink: '',
    startDate: '',
    endDate: '',
    status: 'completed'
  });
  const [internshipData, setInternshipData] = useState({
    companyName: '',
    role: '',
    description: '',
    startDate: '',
    endDate: '',
    mentor: '',
    status: 'completed'
  });

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/students/projects', {
        ...formData,
        technologies: formData.technologies.split(',').map(t => t.trim())
      });
      toast.success('Project added successfully');
      setShowAddProject(false);
      setFormData({
        title: '',
        description: '',
        technologies: '',
        githubLink: '',
        demoLink: '',
        startDate: '',
        endDate: '',
        status: 'completed'
      });
      onUpdate();
    } catch (error) {
      toast.error('Failed to add project');
    }
  };

  const handleInternshipSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/students/internships', internshipData);
      toast.success('Internship added successfully');
      setShowAddInternship(false);
      setInternshipData({
        companyName: '',
        role: '',
        description: '',
        startDate: '',
        endDate: '',
        mentor: '',
        status: 'completed'
      });
      onUpdate();
    } catch (error) {
      toast.error('Failed to add internship');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await api.delete(`/students/projects/${projectId}`);
        toast.success('Project deleted successfully');
        onUpdate();
      } catch (error) {
        toast.error('Failed to delete project');
      }
    }
  };

  const handleDeleteInternship = async (internshipId) => {
    if (window.confirm('Are you sure you want to delete this internship?')) {
      try {
        await api.delete(`/students/internships/${internshipId}`);
        toast.success('Internship deleted successfully');
        onUpdate();
      } catch (error) {
        toast.error('Failed to delete internship');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Projects Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Projects</h2>
          <button
            onClick={() => setShowAddProject(!showAddProject)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <FaPlus />
            <span>Add Project</span>
          </button>
        </div>

        {showAddProject && (
          <form onSubmit={handleProjectSubmit} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Technologies (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.technologies}
                  onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                  placeholder="React, Node.js, MongoDB"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  GitHub Link
                </label>
                <input
                  type="url"
                  value={formData.githubLink}
                  onChange={(e) => setFormData({ ...formData, githubLink: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Demo Link
                </label>
                <input
                  type="url"
                  value={formData.demoLink}
                  onChange={(e) => setFormData({ ...formData, demoLink: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                  rows="3"
                  required
                />
              </div>
            </div>
            <div className="mt-4 flex space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Add Project
              </button>
              <button
                type="button"
                onClick={() => setShowAddProject(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {studentData?.projects?.map((project, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{project.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">{project.description}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {project.technologies?.map((tech, i) => (
                      <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                        {tech}
                      </span>
                    ))}
                  </div>
                  <div className="flex space-x-4 mt-4">
                    {project.githubLink && (
                      <a href={project.githubLink} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 text-primary-600 hover:text-primary-700">
                        <FaGithub />
                        <span>GitHub</span>
                      </a>
                    )}
                    {project.demoLink && (
                      <a href={project.demoLink} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 text-primary-600 hover:text-primary-700">
                        <FaExternalLinkAlt />
                        <span>Demo</span>
                      </a>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteProject(project._id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
          {(!studentData?.projects || studentData.projects.length === 0) && (
            <p className="text-gray-500 text-center py-8">No projects added yet</p>
          )}
        </div>
      </div>

      {/* Internships Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Internships</h2>
          <button
            onClick={() => setShowAddInternship(!showAddInternship)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <FaPlus />
            <span>Add Internship</span>
          </button>
        </div>

        {showAddInternship && (
          <form onSubmit={handleInternshipSubmit} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={internshipData.companyName}
                  onChange={(e) => setInternshipData({ ...internshipData, companyName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role
                </label>
                <input
                  type="text"
                  value={internshipData.role}
                  onChange={(e) => setInternshipData({ ...internshipData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={internshipData.startDate}
                  onChange={(e) => setInternshipData({ ...internshipData, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={internshipData.endDate}
                  onChange={(e) => setInternshipData({ ...internshipData, endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={internshipData.description}
                  onChange={(e) => setInternshipData({ ...internshipData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                  rows="3"
                />
              </div>
            </div>
            <div className="mt-4 flex space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Add Internship
              </button>
              <button
                type="button"
                onClick={() => setShowAddInternship(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {studentData?.internships?.map((internship, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{internship.companyName}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{internship.role}</p>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">{internship.description}</p>
                  {internship.startDate && internship.endDate && (
                    <p className="text-sm text-gray-500 mt-2">
                      {new Date(internship.startDate).toLocaleDateString()} - {new Date(internship.endDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteInternship(internship._id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
          {(!studentData?.internships || studentData.internships.length === 0) && (
            <p className="text-gray-500 text-center py-8">No internships added yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Projects;

