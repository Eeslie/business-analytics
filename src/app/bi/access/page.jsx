"use client";

import { useMemo, useState } from "react";

const REPORTS = [
  { id: "sales-summary", name: "Sales Summary", sensitivity: "normal" },
  { id: "revenue-detail", name: "Revenue Detail", sensitivity: "sensitive" },
  { id: "salary-roll", name: "Salary Roll", sensitivity: "high" },
];

const ROLES = [
  { id: "viewer", name: "Viewer", view: true, edit: false, export: false },
  { id: "editor", name: "Editor", view: true, edit: true, export: false },
  { id: "auditor", name: "Auditor", view: true, edit: false, export: true },
  { id: "admin", name: "Admin", view: true, edit: true, export: true },
];

const DEPARTMENTS = ["All", "Sales", "Finance", "HR"];

function canAccess(report, role, departmentScope, userDepartment) {
  // Restrict sensitive reports to appropriate roles and departments
  const sensitivity = report.sensitivity;
  if (sensitivity === "high" && role.id !== "admin" && userDepartment !== "HR") return false;
  if (sensitivity === "sensitive" && !(role.id === "admin" || role.id === "auditor" || role.id === "editor")) return false;
  if (departmentScope !== "All" && departmentScope !== userDepartment) return false;
  return true;
}

export default function AccessSecurityReportsPage() {
  const [roleId, setRoleId] = useState("viewer");
  const [userDepartment, setUserDepartment] = useState("Sales");
  const [departmentScope, setDepartmentScope] = useState("All");
  const [selectedReportId, setSelectedReportId] = useState("sales-summary");
  const [watermark, setWatermark] = useState(true);
  const [logs, setLogs] = useState([]);

  const role = useMemo(() => ROLES.find((r) => r.id === roleId), [roleId]);
  const report = useMemo(() => REPORTS.find((r) => r.id === selectedReportId), [selectedReportId]);
  const allowed = useMemo(() => canAccess(report, role, departmentScope, userDepartment), [report, role, departmentScope, userDepartment]);

  function log(action, outcome) {
    setLogs((prev) => [{
      id: Math.random().toString(36).slice(2),
      at: new Date().toLocaleString(),
      user: `${role.name} (${userDepartment})`,
      action,
      report: report.name,
      outcome,
    }, ...prev].slice(0, 12));
  }

  function attempt(action) {
    if (!allowed || (action === "view" && !role.view) || (action === "edit" && !role.edit) || (action === "export" && !role.export)) {
      log(action, "denied");
      alert("Access denied: insufficient permissions or scope.");
      return false;
    }
    log(action, "granted");
    return true;
  }

  function viewReport() {
    if (!attempt("view")) return;
    alert("Viewing report with privacy guard (PII masked).");
  }

  function editReport() {
    if (!attempt("edit")) return;
    alert("Editing report layout/filters.");
  }

  function exportReport() {
    if (!attempt("export")) return;
    const msg = watermark ? "Exported with watermark and checksum." : "Exported.";
    alert(msg);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full text-sm font-medium text-green-800">
          <span className="w-2 h-2 bg-green-800 rounded-full"></span>
          <span>Access & Security</span>
        </div>
        
        <h1 className="text-4xl font-bold tracking-tight text-green-800">
          Role-Based Access & Security
        </h1>
        
        <p className="text-xl text-black/80 max-w-3xl mx-auto">
          Control who can view, edit, or export sensitive reports using roles and departmental scopes. 
          All actions are logged to support privacy and integrity.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Role Configuration */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-green-800 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">👥</span>
              </div>
              <h2 className="text-2xl font-bold text-green-800">Roles & Scopes</h2>
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">User Role</label>
                <select
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                >
                  {ROLES.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">User Department</label>
                <select
                  value={userDepartment}
                  onChange={(e) => setUserDepartment(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">Department Scope</label>
                <select
                  value={departmentScope}
                  onChange={(e) => setDepartmentScope(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Role Permissions Display */}
            <div className="mt-6 p-4 bg-slate-50 rounded-xl">
              <h3 className="text-sm font-semibold text-green-800 mb-3">Current Role Permissions</h3>
              <div className="flex space-x-6">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${role?.view ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                  <span className="text-sm text-black">View</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${role?.edit ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                  <span className="text-sm text-black">Edit</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${role?.export ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                  <span className="text-sm text-black">Export</span>
                </div>
              </div>
            </div>
          </div>

          {/* Report & Actions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-green-800 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">📊</span>
              </div>
              <h2 className="text-2xl font-bold text-green-800">Report & Actions</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Select Report</label>
                <select
                  value={selectedReportId}
                  onChange={(e) => setSelectedReportId(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                >
                  {REPORTS.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-end space-x-3">
                <button
                  onClick={viewReport}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200"
                >
                  <span>👁️</span>
                  <span>View</span>
                </button>
                <button
                  onClick={editReport}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-medium rounded-lg hover:from-orange-700 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200"
                >
                  <span>✏️</span>
                  <span>Edit</span>
                </button>
                <button
                  onClick={exportReport}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                >
                  <span>📥</span>
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* Access Status */}
            <div className="mt-6 p-4 rounded-xl border-2 border-dashed">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-green-800">Access Status</h3>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  allowed 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-red-100 text-red-900 border border-red-200'
                }`}>
                  {allowed ? '✓ Allowed' : '✗ Denied'}
                </div>
              </div>
              <p className="text-sm text-black">
                {allowed 
                  ? 'User has appropriate permissions and department access for this report.'
                  : 'Access denied due to insufficient permissions or department scope restrictions.'
                }
              </p>
            </div>

            {/* Security Options */}
            <div className="mt-6 p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <input
                  id="watermark"
                  type="checkbox"
                  checked={watermark}
                  onChange={(e) => setWatermark(e.target.checked)}
                  className="w-4 h-4 text-green-600 border-slate-300 rounded focus:ring-green-500"
                />
                <label htmlFor="watermark" className="text-sm font-medium text-black">
                  Apply export watermark and checksum (privacy & integrity)
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Access Logs */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-green-800 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">📋</span>
              </div>
              <h3 className="text-lg font-semibold text-green-800">Access Logs</h3>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-slate-400 text-lg">📝</span>
                  </div>
                  <p className="text-sm text-black/70">No access attempts yet</p>
                  <p className="text-xs text-black/50 mt-1">Try an action to see logs</p>
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          log.outcome === 'granted' ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <span className="text-sm font-medium text-black">{log.user}</span>
                      </div>
                      <span className="text-xs text-black/70">{log.at}</span>
                    </div>
                    <div className="text-sm text-black">
                      <span className="font-medium">{log.action}</span> on <span className="font-medium">{log.report}</span>
                    </div>
                    <div className={`text-xs mt-1 ${
                      log.outcome === 'granted' ? 'text-green-900' : 'text-red-900'
                    }`}>
                      {log.outcome === 'granted' ? '✓ Granted' : '✗ Denied'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Security Features */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-green-800 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">🛡️</span>
              </div>
              <h3 className="text-lg font-semibold text-green-800">Security Features</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-xs">✓</span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-black">PII Masking</h4>
                  <p className="text-xs text-black/70">Sensitive data hidden for non-admin roles</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-xs">✓</span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-black">Watermark & Checksum</h4>
                  <p className="text-xs text-black/70">Export integrity verification</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-xs">✓</span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-black">Least Privilege</h4>
                  <p className="text-xs text-black/70">Role and department-based access control</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


