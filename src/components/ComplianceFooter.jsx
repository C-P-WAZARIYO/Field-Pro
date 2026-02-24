import React from 'react';
import { AlertTriangle } from 'lucide-react';

const ComplianceFooter = () => {
  return (
    <footer className="bg-red-50 border-t-2 border-red-200 py-4 px-6 mt-8">
      <div className="max-w-6xl mx-auto flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-red-800 mb-1">
            PROJECT ONLY: DO NOT UPLOAD REAL DATA
          </p>
          <p className="text-xs text-red-700">
            This application is in development phase. Do not enter real customer data, 
            financial information, or sensitive business data. All data in this system is 
            for testing purposes only.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default ComplianceFooter;
