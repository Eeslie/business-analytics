import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
	const supabaseUrl = process.env.SUPABASE_URL;
	const supabaseKey = process.env.SUPABASE_KEY;
	if (!supabaseUrl || !supabaseKey) {
		throw new Error("Missing SUPABASE_URL or SUPABASE_KEY environment variables");
	}
	return createClient(supabaseUrl, supabaseKey);
}

export async function GET(request) {
	try {
		const { searchParams } = new URL(request.url);
		const dateFrom = searchParams.get("dateFrom") || "";
		const dateTo = searchParams.get("dateTo") || "";
		const department = searchParams.get("department") || "All";
		const region = searchParams.get("region") || "All";

		const supabase = getSupabaseClient();

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

		// Optionally apply filters when your schema supports them
		// if (dateFrom && dateTo) {
		// 	query = query.gte('created_at', dateFrom).lte('created_at', dateTo);
		// }
		// if (department && department !== 'All') {
		// 	query = query.eq('branch.department', department);
		// }
		// if (region && region !== 'All') {
		// 	query = query.eq('branch.region', region);
		// }

		const { data, error } = await query;
		if (error) {
			return NextResponse.json(
				{ error: error.message, details: error.details, hint: error.hint },
				{ status: 500 }
			);
		}

		return NextResponse.json(data || []);
	} catch (err) {
		return NextResponse.json(
			{ error: "Internal server error", message: err.message },
			{ status: 500 }
		);
	}
}


