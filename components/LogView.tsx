import React from 'react';
import type { ApplicationLog } from '../types';

interface LogViewProps {
  logs: ApplicationLog[];
  onStartNew: () => void;
}

export const LogView: React.FC<LogViewProps> = ({ logs, onStartNew }) => {

  const exportToCSV = () => {
    const headers = "Position,Company,Applied Date,Status,URL\n";
    const rows = logs.map(log => 
        `"${log.job.title}","${log.job.company}","${log.appliedDate}","${log.status}","${log.job.url || ''}"`
    ).join("\n");
    const csvContent = headers + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "jobright-application-log.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-gray-medium p-8 rounded-lg shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white">Application Log</h2>
        <button
            onClick={exportToCSV}
            disabled={logs.length === 0}
            className="py-2 px-4 rounded-md text-sm font-medium text-white bg-gray-600 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Export to CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-600">
              <th className="p-3 text-sm font-semibold text-gray-300">Position</th>
              <th className="p-3 text-sm font-semibold text-gray-300">Company</th>
              <th className="p-3 text-sm font-semibold text-gray-300 hidden md:table-cell">Date Applied</th>
              <th className="p-3 text-sm font-semibold text-gray-300">Status</th>
              <th className="p-3 text-sm font-semibold text-gray-300">Link</th>
            </tr>
          </thead>
          <tbody>
            {logs.length > 0 ? logs.map((log, index) => (
              <tr key={index} className="border-b border-gray-700 hover:bg-gray-700/50">
                <td className="p-3 text-white font-medium">
                    <div>{log.job.title}</div>
                </td>
                <td className="p-3 text-gray-300">{log.job.company}</td>
                <td className="p-3 text-gray-300 hidden md:table-cell">{log.appliedDate}</td>
                <td className="p-3">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-900 text-green-200">{log.status}</span>
                </td>
                <td className="p-3">
                    {log.job.url ? (
                        <a href={log.job.url} target="_blank" rel="noopener noreferrer" className="text-brand-secondary hover:underline">
                            View
                        </a>
                    ) : (
                        <span className="text-gray-500">N/A</span>
                    )}
                </td>
              </tr>
            )) : (
                <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-400">You haven't logged any applications yet.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-8 text-center">
        <button onClick={onStartNew} className="py-2 px-6 rounded-md text-sm font-medium text-white bg-brand-primary hover:bg-blue-800">
          Analyze Another Job
        </button>
      </div>
    </div>
  );
};