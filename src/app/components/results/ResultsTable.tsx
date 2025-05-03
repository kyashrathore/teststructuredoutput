import React, { useState } from "react";
import { TestResult, ModelCall } from "../../types/stress-test";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface ResultsTableProps {
  results: TestResult[];
}

const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => {
  const [expandedModel, setExpandedModel] = useState<string | null>(null);
  const [expandedCall, setExpandedCall] = useState<number | null>(null);

  const toggleModelExpand = (modelName: string) => {
    setExpandedModel(expandedModel === modelName ? null : modelName);
    setExpandedCall(null); // Close any expanded call when toggling model
  };

  const toggleCallExpand = (index: number) => {
    setExpandedCall(expandedCall === index ? null : index);
  };

  const formatTime = (time: number) => {
    return time < 1000
      ? `${time.toFixed(0)}ms`
      : `${(time / 1000).toFixed(1)}s`;
  };

  return (
    <div className="space-y-4">
      {results.map((result) => (
        <div
          key={result.modelName}
          className="border border-slate-200 rounded-lg overflow-hidden"
        >
          {/* Model Header */}
          <div
            className={`flex items-center justify-between p-4 cursor-pointer ${
              expandedModel === result.modelName ? "bg-slate-100" : "bg-white"
            }`}
            onClick={() => toggleModelExpand(result.modelName)}
          >
            <div className="flex items-center space-x-3">
              <div className="text-lg font-medium text-slate-800">
                {result.modelName.split("/").pop()}
              </div>
              <div className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">
                {result.calls.length} calls
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-blue-500 mr-1.5" />
                <span className="text-sm font-medium text-slate-900">
                  {formatTime(result.averageTimeMs)}
                </span>
              </div>

              <div className="flex items-center">
                <span
                  className={`h-2 w-2 rounded-full mr-1.5 ${
                    result.successRate >= 0.9 * 100
                      ? "bg-emerald-500"
                      : result.successRate >= 0.7 * 100
                      ? "bg-amber-500"
                      : "bg-red-500"
                  }`}
                />
                <span className="text-sm font-medium text-slate-800">
                  {result.successRate}
                </span>
              </div>

              {expandedModel === result.modelName ? (
                <ChevronUp className="h-5 w-5 text-slate-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-500" />
              )}
            </div>
          </div>

          {/* Call Details */}
          {expandedModel === result.modelName && (
            <div className="bg-white border-t border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Call #
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {result.calls.map((call, index) => (
                      <React.Fragment key={index}>
                        <tr className="hover:bg-slate-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                            Call {index + 1}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {call.successful ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Success
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <XCircle className="h-3 w-3 mr-1" />
                                Failed
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                            {formatTime(call.timeMs)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCallExpand(index);
                              }}
                              className="text-blue-600 hover:text-blue-800 font-medium text-xs flex items-center"
                            >
                              {expandedCall === index
                                ? "Hide Details"
                                : "View Details"}
                              {expandedCall === index ? (
                                <ChevronUp className="h-3 w-3 ml-1" />
                              ) : (
                                <ChevronDown className="h-3 w-3 ml-1" />
                              )}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Call Data */}
                        {expandedCall === index && (
                          <tr>
                            <td colSpan={4} className="px-4 py-3 bg-slate-50">
                              <div className="text-sm">
                                {call.successful ? (
                                  <>
                                    <h4 className="font-medium text-slate-700 mb-2">
                                      Output:
                                    </h4>
                                    <pre className="bg-slate-700 p-3 rounded-md overflow-x-auto text-xs">
                                      {JSON.stringify(call.output, null, 2)}
                                    </pre>
                                  </>
                                ) : (
                                  <div>
                                    <pre className="bg-red-50 p-3 rounded-md overflow-x-auto text-xs text-red-700">
                                      {JSON.stringify(call.output, null, 2)}
                                    </pre>
                                    {call.output && call.error ? (
                                      <>
                                        <h3 className="text-red-600">Error:</h3>
                                        <pre className="bg-red-50 p-3 rounded-md overflow-x-auto text-xs text-red-700">
                                          {JSON.stringify(call.error, null, 2)}
                                        </pre>
                                      </>
                                    ) : null}
                                    {typeof call.error === "string"
                                      ? call.error
                                      : call.error && call.output
                                      ? null
                                      : "Unknown error"}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ResultsTable;
