import cron from "node-cron";
import { sendEmail } from "./mailer";
import { generateInventoryPDF, generateGenericPDF } from "./pdf";
import { getSupabase } from "./supabase";

// In-memory job registry (reset on server restart)
const jobs = new Map();

async function fetchInventory({ dateFrom, dateTo, department, region }) {
	const supabase = getSupabase();
	let query = supabase
		.from("inventory")
		.select(`
			id,
			qty,
			inventory_item:inventory_item_id (
				skuid, name, category, unit_measurement, cost
			),
			branch:branch_id (
				name, location
			),
			warehouse:warehouse_id (
				name, location, status
			)
		`)
		.eq("is_deleted", false);
	const { data, error } = await query;
	if (error) throw new Error(error.message);
	return data || [];
}

function toCron({ frequency, time }) {
	// time format: HH:mm (24h)
	const [h, m] = (time || "09:00").split(":").map((v) => parseInt(v, 10));
	if (Number.isNaN(h) || Number.isNaN(m)) throw new Error("Invalid time format");
	// cron: m h dom mon dow
	switch ((frequency || "daily").toLowerCase()) {
		case "daily":
			return `${m} ${h} * * *`;
		case "weekly":
			// run on Monday by default
			return `${m} ${h} * * 1`;
		case "monthly":
			// run on the 1st of each month
			return `${m} ${h} 1 * *`;
		default:
			throw new Error("Invalid frequency");
	}
}

export function scheduleReport({ id, reportId, dateFrom, dateTo, department, region, email, frequency, time }) {
	const cronExpr = toCron({ frequency, time });
	if (jobs.has(id)) {
		jobs.get(id).stop();
		jobs.delete(id);
	}
	const task = cron.schedule(cronExpr, async () => {
		const meta = {
			generatedAt: new Date().toISOString(),
			dateFrom,
			dateTo,
			department,
			region,
		};
		let pdfBuffer;
		let filename = `report-${new Date().toISOString().slice(0,10)}.pdf`;
		if (reportId === "inventory-stock") {
			const rows = await fetchInventory({ dateFrom, dateTo, department, region });
			pdfBuffer = await generateInventoryPDF({ meta, rows });
			filename = `inventory-report-${new Date().toISOString().slice(0,10)}.pdf`;
		} else {
			const titleMap = {
				"sales-summary": "Sales Summary Report",
				"profit-loss": "Profit & Loss Report",
			};
			pdfBuffer = await generateGenericPDF({ title: titleMap[reportId] || "Custom Report", meta });
		}
		await sendEmail({
			to: email,
			subject: "Scheduled Report",
			text: `Your scheduled ${reportId} report is attached`,
			html: `<p>Your scheduled <strong>${reportId}</strong> report is attached.</p>`,
			attachments: [{ filename, content: pdfBuffer, contentType: "application/pdf" }]
		});
	});
	jobs.set(id, task);
	return { id, cron: cronExpr };
}

export function cancelSchedule(id) {
	const job = jobs.get(id);
	if (job) {
		job.stop();
		jobs.delete(id);
		return true;
	}
	return false;
}


