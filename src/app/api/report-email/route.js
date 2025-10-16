import { NextResponse } from "next/server";
import { getSupabase } from "../../../lib/supabase";
import { sendEmail } from "../../../lib/mailer";
import { generateInventoryPDF, generateGenericPDF } from "../../../lib/pdf";

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

	// Optional filters when supported by schema
	// if (dateFrom && dateTo) query = query.gte('created_at', dateFrom).lte('created_at', dateTo);

	const { data, error } = await query;
	if (error) throw new Error(error.message);
	return data || [];
}

export async function POST(request) {
	try {
		const body = await request.json();
		const {
			reportId = "inventory-stock",
			dateFrom = "",
			dateTo = "",
			department = "All",
			region = "All",
			email,
			subject = "Automated Report",
		} = body || {};

		if (!email) {
			return NextResponse.json({ error: "Missing email" }, { status: 400 });
		}

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
			subject,
			text: `Please find attached your ${reportId} report`,
			html: `<p>Please find attached your <strong>${reportId}</strong> report.</p>`,
			attachments: [
				{
				filename,
					content: pdfBuffer,
					contentType: "application/pdf",
				}
			]
		});

		return NextResponse.json({ ok: true });
	} catch (err) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}


