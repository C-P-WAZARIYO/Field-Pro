import React, { useState } from 'react';
import {
  BarChart3, TrendingUp, Users, Award, Target, Activity,
  ArrowUp, ArrowDown, Zap, Trophy
} from 'lucide-react';
import ComplianceFooter from '../components/ComplianceFooter';

const AnalyticsSuite = () => {
  const [selectedMonth, setSelectedMonth] = useState(2); // February

  // Mock data for supervisors/team leaders
  const supervisorTeams = [
    {
      id: 1,
      name: 'Raj Kumar (Supervisor)',
      employeeCount: 5,
      teamMembers: [
        { name: 'Emp1', recovery: 75, cases: 48, performance: 85 },
        { name: 'Emp2', recovery: 68, cases: 42, performance: 78 },
        { name: 'Emp3', recovery: 82, cases: 55, performance: 92 },
        { name: 'Emp4', recovery: 71, cases: 45, performance: 80 },
        { name: 'Emp5', recovery: 79, cases: 51, performance: 88 },
      ],
      teamAvgRecovery: 75,
      teamAvgPerformance: 84.6,
    },
    {
      id: 2,
      name: 'Priya Singh (Supervisor)',
      employeeCount: 4,
      teamMembers: [
        { name: 'Emp6', recovery: 72, cases: 46, performance: 82 },
        { name: 'Emp7', recovery: 65, cases: 40, performance: 74 },
        { name: 'Emp8', recovery: 78, cases: 50, performance: 88 },
        { name: 'Emp9', recovery: 68, cases: 42, performance: 76 },
      ],
      teamAvgRecovery: 70.75,
      teamAvgPerformance: 80,
    },
    {
      id: 3,
      name: 'Amit Patel (Supervisor)',
      employeeCount: 3,
      teamMembers: [
        { name: 'Emp10', recovery: 81, cases: 52, performance: 91 },
        { name: 'Emp11', recovery: 76, cases: 48, performance: 86 },
        { name: 'Emp12', recovery: 74, cases: 46, performance: 84 },
      ],
      teamAvgRecovery: 77,
      teamAvgPerformance: 87,
    },
  ];

  // Leaderboard data - sorted by team average performance
  const leaderboard = [...supervisorTeams].sort(
    (a, b) => b.teamAvgPerformance - a.teamAvgPerformance
  );

  // Individual employee performance ranking
  const allEmployees = supervisorTeams.flatMap((team, teamIdx) =>
    team.teamMembers.map((emp, idx) => ({
      ...emp,
      supervisor: team.name,
      rank: 0,
    }))
  );
  const rankedEmployees = allEmployees
    .sort((a, b) => b.performance - a.performance)
    .map((emp, idx) => ({ ...emp, rank: idx + 1 }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Analytics Suite</h1>
          <p className="text-blue-100">Monitor team performance and individual metrics</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* KPI Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-700">Total Teams</h3>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-800">{supervisorTeams.length}</p>
            <p className="text-sm text-gray-500 mt-2">Supervisor-led teams</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-700">Total Employees</h3>
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-800">
              {supervisorTeams.reduce((sum, t) => sum + t.employeeCount, 0)}
            </p>
            <p className="text-sm text-gray-500 mt-2">Across all teams</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-700">Avg Team Performance</h3>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-800">
              {(
                supervisorTeams.reduce((sum, t) => sum + t.teamAvgPerformance, 0) /
                supervisorTeams.length
              ).toFixed(1)}%
            </p>
            <p className="text-sm text-gray-500 mt-2">Overall efficiency</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-700">Avg Recovery Rate</h3>
              <Activity className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-gray-800">
              {(
                supervisorTeams.reduce((sum, t) => sum + t.teamAvgRecovery, 0) /
                supervisorTeams.length
              ).toFixed(1)}%
            </p>
            <p className="text-sm text-gray-500 mt-2">Average recovery</p>
          </div>
        </div>

        {/* Team Health Leaderboard */}
        <div className="bg-white rounded-xl shadow-xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="w-6 h-6 text-yellow-600" />
            <h2 className="text-2xl font-bold text-gray-800">Team Leaderboard</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Supervisor performance calculated as team average efficiency. Higher team average = Higher ranking.
          </p>

          <div className="space-y-4">
            {leaderboard.map((team, idx) => (
              <div
                key={team.id}
                className={`rounded-lg p-6 border-2 transition-all ${
                  idx === 0
                    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300'
                    : idx === 1
                    ? 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-300'
                    : idx === 2
                    ? 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-300'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                      idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-500' : idx === 2 ? 'bg-orange-500' : 'bg-blue-500'
                    }`}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{team.name}</h3>
                      <p className="text-sm text-gray-600">{team.employeeCount} team members</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-blue-600">{team.teamAvgPerformance.toFixed(1)}%</p>
                    <p className="text-sm text-gray-600">Team Average</p>
                  </div>
                </div>

                {/* Team Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex gap-4 text-sm">
                      <span className="text-gray-600">
                        <strong>Recovery:</strong> {team.teamAvgRecovery.toFixed(1)}%
                      </span>
                      <span className="text-gray-600">
                        <strong>Team Score:</strong> {team.teamAvgPerformance.toFixed(1)}/100
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all"
                      style={{ width: `${team.teamAvgPerformance}%` }}
                    ></div>
                  </div>
                </div>

                {/* Team Members Mini View */}
                <div className="flex flex-wrap gap-2">
                  {team.teamMembers.map((member, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-3 py-1 bg-white bg-opacity-60 rounded-full text-xs font-semibold text-gray-700 border border-gray-200"
                    >
                      <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs text-blue-600">
                        {member.performance > 85 ? '⭐' : '✓'}
                      </span>
                      {member.name}: {member.performance}%
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Individual Employee Rankings */}
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Award className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-800">Top Employees</h2>
          </div>
          <p className="text-gray-600 mb-6">Individual performance rankings across all teams.</p>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Rank</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Employee</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Supervisor</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-700">Performance</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-700">Cases Worked</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-700">Recovery Rate</th>
                </tr>
              </thead>
              <tbody>
                {rankedEmployees.slice(0, 10).map((emp, idx) => (
                  <tr
                    key={idx}
                    className={`border-b border-gray-200 transition-all ${
                      emp.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="py-4 px-4 text-center">
                      <div className="flex justify-center">
                        {emp.rank === 1 ? (
                          <span className="text-2xl">🥇</span>
                        ) : emp.rank === 2 ? (
                          <span className="text-2xl">🥈</span>
                        ) : emp.rank === 3 ? (
                          <span className="text-2xl">🥉</span>
                        ) : (
                          <span className="font-bold text-gray-700">#{emp.rank}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 font-semibold text-gray-800">{emp.name}</td>
                    <td className="py-4 px-4 text-gray-600 text-sm">{emp.supervisor}</td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {emp.performance > 85 ? (
                          <ArrowUp className="w-4 h-4 text-green-600" />
                        ) : emp.performance < 75 ? (
                          <ArrowDown className="w-4 h-4 text-red-600" />
                        ) : (
                          <Activity className="w-4 h-4 text-yellow-600" />
                        )}
                        <span className="font-bold text-gray-800">{emp.performance}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center text-gray-700 font-semibold">
                      {emp.cases}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                        {emp.recovery}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Performance Chart Info */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-bold text-blue-900">How Supervisor Performance is Calculated</h3>
            </div>
            <ul className="text-sm text-blue-800 space-y-2">
              <li className="flex gap-2">
                <span>•</span>
                <span><strong>Team Average:</strong> Mean of all team members' performance scores</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span><strong>Real-time Updates:</strong> Backend calculates average in real-time via Prisma</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span><strong>Performance Score:</strong> Based on recovery rate, cases handled, and efficiency</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span><strong>Ranking:</strong> Supervisors ranked by team average descending</span>
              </li>
            </ul>
          </div>

          <div className="bg-purple-50 rounded-xl p-6 border-2 border-purple-200">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-6 h-6 text-purple-600" />
              <h3 className="text-lg font-bold text-purple-900">Key Metrics</h3>
            </div>
            <ul className="text-sm text-purple-800 space-y-2">
              <li className="flex gap-2">
                <span>•</span>
                <span><strong>Performance %:</strong> Overall efficiency rating (0-100)</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span><strong>Recovery Rate:</strong> % of cases with payment/closure</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span><strong>Cases Handled:</strong> Total cases worked in the period</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span><strong>Team Health:</strong> Composite score of team metrics</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Compliance Footer */}
      <ComplianceFooter />
    </div>
  );
};

export default AnalyticsSuite;
