import React, { useState } from 'react';
import ResultsChart from './ResultsChart';
import ResultsSummary from './ResultsSummary';
import ResultsTable from './ResultsTable';
import { TestResult } from '../../types/stress-test';
import { BarChart as ChartBar, Table } from 'lucide-react';

interface ResultsDisplayProps {
  results: TestResult[];
}

type ViewMode = 'summary' | 'detail';

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('summary');

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">Test Results</h2>
          
          <div className="flex space-x-2 p-1 bg-slate-100 rounded-md">
            <button
              onClick={() => setViewMode('summary')}
              className={`flex items-center px-3 py-1.5 text-sm rounded-md ${
                viewMode === 'summary' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ChartBar className="h-4 w-4 mr-1.5" />
              Summary
            </button>
            <button
              onClick={() => setViewMode('detail')}
              className={`flex items-center px-3 py-1.5 text-sm rounded-md ${
                viewMode === 'detail' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="h-4 w-4 mr-1.5" />
              Details
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {viewMode === 'summary' ? (
          <>
            <ResultsSummary results={results} />
            <div className="mt-8">
              <h3 className="text-lg font-medium text-slate-800 mb-4">Performance Comparison</h3>
              <ResultsChart results={results} />
            </div>
          </>
        ) : (
          <ResultsTable results={results} />
        )}
      </div>
    </div>
  );
};

export default ResultsDisplay;