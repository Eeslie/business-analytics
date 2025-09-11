    "use client";

import { useMemo, useState } from "react";

const LEAVE_TYPES = [
  { id: "sick", name: "Sick" },
  { id: "vacation", name: "Vacation" },
  { id: "emergency", name: "Emergency" },
];

export default function TimeAttendanceLeavePage() {
  const [clockedIn, setClockedIn] = useState(false);
  const [timeLog, setTimeLog] = useState([]);
  const [biometricOk, setBiometricOk] = useState(true);

  const [leaveBalances, setLeaveBalances] = useState({ sick: 5, vacation: 10, emergency: 3 });
  const [leaveReq, setLeaveReq] = useState({ type: "sick", days: 1, note: "" });
  const [leaveQueue, setLeaveQueue] = useState([]);

  const workedHours = useMemo(() => {
    // naive calc for demo
    const ms = timeLog.reduce((sum, e) => sum + (e.out && e.in ? e.out - e.in : 0), 0);
    return (ms / 3600000).toFixed(2);
  }, [timeLog]);

  function clockIn() {
    if (!biometricOk) {
      alert("Biometric verification failed. Cannot clock in.");
      return;
    }
    setClockedIn(true);
    setTimeLog((prev) => [{ in: Date.now(), out: null }, ...prev]);
  }

  function clockOut() {
    if (!clockedIn) return;
    setClockedIn(false);
    setTimeLog((prev) => {
      const [last, ...rest] = prev;
      return [{ ...last, out: Date.now() }, ...rest];
    });
  }

  function requestLeave() {
    const available = leaveBalances[leaveReq.type] ?? 0;
    if (leaveReq.days <= 0) return alert("Days must be positive");
    if (leaveReq.days > available) return alert("Insufficient balance");
    const item = { id: Math.random().toString(36).slice(2), ...leaveReq, status: "Pending" };
    setLeaveQueue((q) => [item, ...q]);
  }

  function approveLeave(id) {
    setLeaveQueue((q) => q.map((i) => (i.id === id ? { ...i, status: "Approved" } : i)));
    // accrual/consumption logic: subtract approved days
    const item = leaveQueue.find((i) => i.id === id);
    if (item) {
      setLeaveBalances((b) => ({ ...b, [item.type]: Math.max(0, (b[item.type] ?? 0) - item.days) }));
    }
  }

  function rejectLeave(id) {
    setLeaveQueue((q) => q.map((i) => (i.id === id ? { ...i, status: "Rejected" } : i)));
  }

  function accrueMonthly() {
    // simple demo accrual: +1 vacation per call
    setLeaveBalances((b) => ({ ...b, vacation: (b.vacation ?? 0) + 1 }));
    alert("Accrual applied: +1 vacation day");
  }

  function generateAttendanceReport() {
    const report = {
      period: new Date().toLocaleDateString(),
      totalHours: workedHours,
      entries: timeLog,
      leaveBalances,
      leaveQueue,
    };
    alert("Attendance report ready (stub). Integrate with payroll API to export.");
    console.log("ATTENDANCE_REPORT", report);
  }

  return (
    <section className="space-y-8">
      <header className="space-y-1">
        <h2 className="text-2xl font-bold text-green-900">Time, Attendance, and Leave Management</h2>
        <p className="text-black/80 max-w-3xl">Monitor attendance, working hours, and leave balances for accurate payroll and compliance.</p>
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-black/10 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-orange-900">Record Time</h3>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={biometricOk} onChange={(e) => setBiometricOk(e.target.checked)} /> Biometric verified
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={clockIn} disabled={clockedIn} className="rounded-md border border-black/10 bg-white px-4 py-2 text-green-900 hover:bg-black/[.03] disabled:opacity-60">Time In</button>
              <button onClick={clockOut} disabled={!clockedIn} className="rounded-md border border-black/10 bg-white px-4 py-2 text-orange-900 hover:bg-black/[.03] disabled:opacity-60">Time Out</button>
              <div className="text-sm text-black/70">Worked hours (today): <span className="font-semibold text-green-900">{workedHours}</span></div>
            </div>

            <ul className="mt-4 space-y-2">
              {timeLog.length === 0 && <li className="text-sm text-black/60">No records yet.</li>}
              {timeLog.map((e, idx) => (
                <li key={idx} className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm flex items-center justify-between">
                  <span className="text-black/80">In: {new Date(e.in).toLocaleTimeString()}</span>
                  <span className="text-black/80">Out: {e.out ? new Date(e.out).toLocaleTimeString() : "—"}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-black/10 p-5">
            <h3 className="text-lg font-semibold text-orange-900">Attendance Report & Payroll</h3>
            <p className="text-black/70 text-sm mt-1">Generate an attendance summary ready to be sent to payroll.</p>
            <div className="mt-3 flex gap-3">
              <button onClick={generateAttendanceReport} className="rounded-md border border-black/10 bg-white px-4 py-2 text-green-900 hover:bg-black/[.03]">Generate report</button>
              <button onClick={() => alert("Payroll integration stub. Connect to payroll API to submit.")} className="rounded-md border border-black/10 bg-white px-4 py-2 text-orange-900 hover:bg-black/[.03]">Send to payroll</button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-black/10 p-5">
            <h3 className="text-lg font-semibold text-green-900">Leave Management</h3>
            <div className="mt-3 grid gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-sm text-black/70">Type</span>
                <select value={leaveReq.type} onChange={(e) => setLeaveReq({ ...leaveReq, type: e.target.value })} className="rounded-md border border-black/15 px-3 py-2">
                  {LEAVE_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-black/70">Days</span>
                <input type="number" min="1" value={leaveReq.days} onChange={(e) => setLeaveReq({ ...leaveReq, days: Number(e.target.value) })} className="rounded-md border border-black/15 px-3 py-2" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-black/70">Note</span>
                <input value={leaveReq.note} onChange={(e) => setLeaveReq({ ...leaveReq, note: e.target.value })} placeholder="Reason (optional)" className="rounded-md border border-black/15 px-3 py-2" />
              </label>
              <div>
                <button onClick={requestLeave} className="rounded-md border border-black/10 bg-white px-4 py-2 text-green-900 hover:bg-black/[.03]">Request leave</button>
                <button onClick={accrueMonthly} className="ml-3 rounded-md border border-black/10 bg-white px-4 py-2 text-orange-900 hover:bg-black/[.03]">Apply accrual</button>
              </div>
            </div>
            <div className="mt-4 text-sm text-black/80">
              Balances: Sick <span className="text-green-900 font-medium">{leaveBalances.sick}</span> · Vacation <span className="text-green-900 font-medium">{leaveBalances.vacation}</span> · Emergency <span className="text-green-900 font-medium">{leaveBalances.emergency}</span>
            </div>
          </div>

          <div className="rounded-lg border border-black/10 p-5">
            <h3 className="text-lg font-semibold text-green-900">Approvals</h3>
            <ul className="mt-3 space-y-2">
              {leaveQueue.length === 0 && (
                <li className="text-sm text-black/60">No pending requests.</li>
              )}
              {leaveQueue.map((r) => (
                <li key={r.id} className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-green-900 capitalize">{r.type}</div>
                      <div className="text-black/70">{r.days} day(s) – {r.note || "(no note)"}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-black/60">{r.status}</span>
                      <button onClick={() => approveLeave(r.id)} className="rounded-md border border-black/10 bg-white px-3 py-1 text-green-900 hover:bg-black/[.03]">Approve</button>
                      <button onClick={() => rejectLeave(r.id)} className="rounded-md border border-black/10 bg-white px-3 py-1 text-orange-900 hover:bg-black/[.03]">Reject</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}


