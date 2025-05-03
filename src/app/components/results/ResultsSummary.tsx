import React from "react";
import { TestResult } from "../../types/stress-test";
import { CheckCircle2, XCircle, Clock, BarChart3 } from "lucide-react";

interface ResultsSummaryProps {
  results: TestResult[];
}

const ResultsSummary: React.FC<ResultsSummaryProps> = ({ results }) => {
  // Calculate overall statistics
  const totalCalls = results.reduce(
    (sum, model) => sum + model.calls.length,
    0
  );
  const successfulCalls = results.reduce(
    (sum, model) => sum + model.calls.filter((call) => call.successful).length,
    0
  );
  const overallSuccessRate = totalCalls > 0 ? successfulCalls / totalCalls : 0;

  // Find fastest and slowest models
  const sortedByTime = [...results].sort(
    (a, b) => a.averageTimeMs - b.averageTimeMs
  );
  const fastestModel = sortedByTime.length > 0 ? sortedByTime[0] : null;
  const slowestModel =
    sortedByTime.length > 0 ? sortedByTime[sortedByTime.length - 1] : null;

  // Find model with highest success rate
  const sortedBySuccess = [...results].sort(
    (a, b) => b.successRate - a.successRate
  );
  const mostReliableModel =
    sortedBySuccess.length > 0 ? sortedBySuccess[0] : null;

  // Format times
  const formatTime = (time: number) => {
    return time < 1000
      ? `${time.toFixed(0)}ms`
      : `${(time / 1000).toFixed(1)}s`;
  };

  return (
    <div>
      <h3 className="text-lg font-medium text-slate-800 mb-4">Key Insights</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Overall Stats */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <h4 className="text-sm font-medium text-slate-600 mb-3">
            Overall Performance
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center text-slate-700">
                <BarChart3 className="h-4 w-4 mr-1.5 text-blue-500" />
                <span className="text-xs">Total Calls</span>
              </div>
              <p className="text-2xl font-semibold text-slate-900 mt-1">
                {totalCalls}
              </p>
            </div>

            <div>
              <div className="flex items-center text-slate-700">
                <CheckCircle2 className="h-4 w-4 mr-1.5 text-emerald-500" />
                <span className="text-xs">Success Rate</span>
              </div>
              <p className="text-2xl font-semibold text-blue-900 mt-1">
                {overallSuccessRate}%
              </p>
            </div>
          </div>
        </div>

        {/* Model Comparison */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <h4 className="text-sm font-medium text-slate-600 mb-3">
            Model Insights
          </h4>

          {results.length > 0 ? (
            <div className="space-y-3">
              {fastestModel && (
                <div className="flex items-start">
                  <Clock className="h-4 w-4 mr-1.5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-600">Fastest Model</p>
                    <p className="text-sm font-medium text-slate-900">
                      {fastestModel.modelName.split("/").pop()} (
                      {formatTime(fastestModel.averageTimeMs)})
                    </p>
                  </div>
                </div>
              )}

              {mostReliableModel && mostReliableModel.successRate > 0 && (
                <div className="flex items-start">
                  <CheckCircle2 className="h-4 w-4 mr-1.5 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-600">Most Reliable</p>
                    <p className="text-sm font-medium text-slate-900">
                      {mostReliableModel.modelName.split("/").pop()} (
                      {mostReliableModel.successRate}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No data available</p>
          )}
        </div>
      </div>

      {/* Models Overview */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-slate-600 mb-3">
          Models Overview
        </h4>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Model
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Avg Time
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Success Rate
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {results.map((result, index) => (
                <tr key={index} className="hover:bg-slate-50">
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-slate-800">
                    {result.modelName.split("/").pop()}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-slate-700">
                    {formatTime(result.averageTimeMs)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-right">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        result.successRate >= 0.9
                          ? "bg-emerald-100 text-emerald-800"
                          : result.successRate >= 0.7
                          ? "bg-amber-100 text-amber-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {result.successRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResultsSummary;
