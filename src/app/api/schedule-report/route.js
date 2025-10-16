import { NextResponse } from "next/server";
import { scheduleReport, cancelSchedule } from "../../../lib/scheduler";

export async function POST(request) {
	try {
		const body = await request.json();
		const { id, reportId, dateFrom, dateTo, department, region, email, frequency, time } = body || {};
		if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });
		if (!reportId) return NextResponse.json({ error: "Missing reportId" }, { status: 400 });
		if (!frequency || !time) return NextResponse.json({ error: "Missing frequency/time" }, { status: 400 });
		const jobId = id || `${reportId}:${email}`;
		const result = scheduleReport({ id: jobId, reportId, dateFrom, dateTo, department, region, email, frequency, time });
		return NextResponse.json({ ok: true, job: result });
	} catch (err) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}

export async function DELETE(request) {
	try {
		const { searchParams } = new URL(request.url);
		const id = searchParams.get("id");
		if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
		const ok = cancelSchedule(id);
		return NextResponse.json({ ok });
	} catch (err) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}


