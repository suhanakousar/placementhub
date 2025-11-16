import React from 'react';
import { FaCheckCircle, FaCircle, FaClock } from 'react-icons/fa';

const Progress = ({ studentData }) => {
  const stages = [
    { key: 'profile_created', label: 'Profile Created', icon: FaCheckCircle },
    { key: 'resume_verified', label: 'Resume Verified', icon: FaCheckCircle },
    { key: 'shortlisted', label: 'Shortlisted', icon: FaCircle },
    { key: 'interview_scheduled', label: 'Interview Scheduled', icon: FaCircle },
    { key: 'selected', label: 'Selected', icon: FaCircle }
  ];

  const getStageStatus = (stageKey) => {
    const status = studentData?.placementStatus;
    if (!status) return 'pending';

    switch (stageKey) {
      case 'profile_created':
        return status.profileCompleted ? 'completed' : 'pending';
      case 'resume_verified':
        return status.resumeVerified ? 'completed' : 'pending';
      case 'shortlisted':
        return status.shortlisted ? 'completed' : status.resumeVerified ? 'pending' : 'locked';
      case 'interview_scheduled':
        return status.interviewScheduled ? 'completed' : status.shortlisted ? 'pending' : 'locked';
      case 'selected':
        return status.selected ? 'completed' : status.interviewScheduled ? 'pending' : 'locked';
      default:
        return 'pending';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-500 bg-green-100 dark:bg-green-900/20';
      case 'pending':
        return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/20';
      case 'locked':
        return 'text-gray-400 bg-gray-100 dark:bg-gray-700';
      default:
        return 'text-gray-400 bg-gray-100 dark:bg-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Placement Progress Tracker</h2>
        
        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-1 bg-gray-200 dark:bg-gray-700"></div>
          <div className="space-y-8">
            {stages.map((stage, index) => {
              const status = getStageStatus(stage.key);
              const Icon = stage.icon;
              const isCompleted = status === 'completed';
              const isPending = status === 'pending';
              const isLocked = status === 'locked';

              return (
                <div key={stage.key} className="relative flex items-start">
                  <div className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full ${getStatusColor(status)}`}>
                    {isCompleted ? (
                      <FaCheckCircle className="text-2xl" />
                    ) : isPending ? (
                      <FaClock className="text-2xl" />
                    ) : (
                      <FaCircle className="text-2xl" />
                    )}
                  </div>
                  <div className="ml-6 flex-1">
                    <h3 className={`text-lg font-semibold ${isLocked ? 'text-gray-400' : 'text-gray-800 dark:text-white'}`}>
                      {stage.label}
                    </h3>
                    {isCompleted && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">Completed</p>
                    )}
                    {isPending && (
                      <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">In Progress</p>
                    )}
                    {isLocked && (
                      <p className="text-sm text-gray-500 mt-1">Locked - Complete previous steps</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {studentData?.placementStatus?.offers && studentData.placementStatus.offers.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Job Offers</h3>
          <div className="space-y-4">
            {studentData.placementStatus.offers.map((offer, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 dark:text-white">{offer.company}</h4>
                <p className="text-gray-600 dark:text-gray-400">{offer.role}</p>
                <p className="text-gray-600 dark:text-gray-400">Package: {offer.package}</p>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm ${
                  offer.status === 'accepted' ? 'bg-green-100 text-green-800' :
                  offer.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {offer.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Progress;

