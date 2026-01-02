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

		const supabase = getSupabaseClient();

		// Start with base inventory query
		let query = supabase
			.from("inventory")
			.select(`
				id,
				qty,
				inventory_item_id,
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
			.eq("is_deleted", false)
			.order('id', { ascending: true });

		let inventoryIds = null;

		// Apply date filtering based on transaction dates
		if (dateFrom || dateTo) {
			let transactionQuery = supabase
				.from("inventory_transaction")
				.select("inventory_id, created_at, type, changed_quantity, source");

			if (dateFrom && dateFrom !== "") {
				transactionQuery = transactionQuery.gte("created_at", `${dateFrom}T00:00:00`);
			}
			
			if (dateTo && dateTo !== "") {
				transactionQuery = transactionQuery.lte("created_at", `${dateTo}T23:59:59`);
			}

			const { data: transactions, error: transError } = await transactionQuery;

			if (transError) {
				return NextResponse.json(
					{ error: transError.message, details: transError.details, hint: transError.hint },
					{ status: 500 }
				);
			}

			// Get unique inventory IDs from transactions
			inventoryIds = [...new Set(transactions.map(t => t.inventory_id))];

			if (inventoryIds.length > 0) {
				query = query.in("id", inventoryIds);
			} else {
				// No transactions found in date range, return empty result
				return NextResponse.json([]);
			}
		}

		const { data, error } = await query;
		
		if (error) {
			return NextResponse.json(
				{ error: error.message, details: error.details, hint: error.hint },
				{ status: 500 }
			);
		}

		// Count transactions for each inventory item
		// If date filtering was applied, count only transactions in the date range
		let countQuery = supabase
			.from("inventory_transaction")
			.select("inventory_id");

		if (dateFrom || dateTo) {
			if (dateFrom && dateFrom !== "") {
				countQuery = countQuery.gte("created_at", `${dateFrom}T00:00:00`);
			}
			if (dateTo && dateTo !== "") {
				countQuery = countQuery.lte("created_at", `${dateTo}T23:59:59`);
			}
		}

		const { data: allTransactions } = await countQuery;

		const transactionCounts = {};
		allTransactions?.forEach(t => {
			transactionCounts[t.inventory_id] = (transactionCounts[t.inventory_id] || 0) + 1;
		});

		// Add transaction_count to each inventory item
		const dataWithCounts = data.map(item => ({
			...item,
			transaction_count: transactionCounts[item.id] || 0
		}));

		return NextResponse.json(dataWithCounts || []);
	} catch (err) {
		return NextResponse.json(
			{ error: "Internal server error", message: err.message },
			{ status: 500 }
		);
	}
}


