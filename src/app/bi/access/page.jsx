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
    <section className="space-y-8">
      <header>
        <h2 className="text-2xl font-bold text-green-900">Role-Based Report Access and Security</h2>
        <p className="text-black/80 mt-1 max-w-3xl">
          Control who can view, edit, or export sensitive reports using roles and departmental scopes. All actions are logged to support privacy and integrity.
        </p>
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Policy builder */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-black/10 p-5">
            <h3 className="text-lg font-semibold text-orange-900">Roles & Scopes</h3>
            <div className="mt-4 grid sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-sm text-black/70">Role</span>
                <select value={roleId} onChange={(e) => setRoleId(e.target.value)} className="rounded-md border border-black/15 px-3 py-2">
                  {ROLES.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-black/70">User Department</span>
                <select value={userDepartment} onChange={(e) => setUserDepartment(e.target.value)} className="rounded-md border border-black/15 px-3 py-2">
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-black/70">Department Scope (policy)</span>
                <select value={departmentScope} onChange={(e) => setDepartmentScope(e.target.value)} className="rounded-md border border-black/15 px-3 py-2">
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="rounded-lg border border-black/10 p-5">
            <h3 className="text-lg font-semibold text-orange-900">Report & Permissions</h3>
            <div className="mt-4 grid sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-sm text-black/70">Report</span>
                <select value={selectedReportId} onChange={(e) => setSelectedReportId(e.target.value)} className="rounded-md border border-black/15 px-3 py-2">
                  {REPORTS.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </label>
              <div className="flex items-end gap-3">
                <button onClick={viewReport} className="rounded-md border border-black/10 bg-white px-4 py-2 text-green-900 hover:bg-black/[.03]">View</button>
                <button onClick={editReport} className="rounded-md border border-black/10 bg-white px-4 py-2 text-orange-900 hover:bg-black/[.03]">Edit</button>
                <button onClick={exportReport} className="rounded-md border border-black/10 bg-white px-4 py-2 text-green-900 hover:bg-black/[.03]">Export</button>
              </div>
            </div>

            <div className="mt-4 rounded-md border border-black/10 bg-white p-3 text-sm">
              <div className="font-medium">Access result: {allowed ? <span className="text-green-900">Allowed</span> : <span className="text-orange-900">Denied</span>}</div>
              <p className="text-black/70 mt-1">Sensitive reports (salary/revenue) require elevated roles and appropriate department alignment.</p>
            </div>

            <div className="mt-4 flex items-center gap-2 text-sm">
              <input id="wm" type="checkbox" checked={watermark} onChange={(e) => setWatermark(e.target.checked)} />
              <label htmlFor="wm" className="text-black/80">Apply export watermark and checksum (privacy & integrity)</label>
            </div>
          </div>
        </div>

        {/* Logs & Privacy */}
        <div className="space-y-6">
          <div className="rounded-lg border border-black/10 p-5">
            <h3 className="text-lg font-semibold text-green-900">Access Logs</h3>
            <ul className="mt-3 space-y-2">
              {logs.length === 0 && (
                <li className="text-sm text-black/60">No access yet. Choose a role/report and attempt an action to log it.</li>
              )}
              {logs.map((e) => (
                <li key={e.id} className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-black/80">
                      <span className="font-medium text-green-900">{e.user}</span> attempted <span className="font-medium">{e.action}</span> on <span className="font-medium">{e.report}</span>
                    </div>
                    <div className={`text-xs ${e.outcome === "granted" ? "text-green-900" : "text-orange-900"}`}>{e.outcome} • {e.at}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-black/10 p-5">
            <h3 className="text-lg font-semibold text-green-900">Privacy & Integrity</h3>
            <ul className="list-disc ml-5 mt-2 text-black/90 space-y-1">
              <li>PII masking during view for non-admin roles</li>
              <li>Watermark + checksum on exports</li>
              <li>Least-privilege enforcement via roles and departments</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}


