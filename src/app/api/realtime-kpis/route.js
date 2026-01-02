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
    const range = searchParams.get("range") || "all";

    // Prevent caching to ensure fresh data
    const supabase = getSupabaseClient();

    const now = new Date();
    let fromDate = null;

    // Only apply date window when range is time-based; "all" means no filtering
    if (range === "today") {
      fromDate = new Date(now);
      fromDate.setHours(0, 0, 0, 0);
    } else if (range === "7d") {
      fromDate = new Date(now);
      fromDate.setDate(fromDate.getDate() - 7);
    } else if (range === "30d") {
      fromDate = new Date(now);
      fromDate.setDate(fromDate.getDate() - 30);
    }

    const fromIso = fromDate ? fromDate.toISOString() : null;
    const toIso = now.toISOString();

    let ordersQuery = supabase
      .from("sales_orders")
      .select("id, total_amount, created_at, status")
      .eq("is_deleted", false);

    let receivableQuery = supabase
      .from("accounts_receivable")
      .select("id, amount, invoice_date, due_date, invoice_number, status, sales_order_id");

    if (fromIso) {
      ordersQuery = ordersQuery.gte("created_at", fromIso);
      receivableQuery = receivableQuery.gte("invoice_date", fromIso);
    }

    const [
      { data: orders, error: ordersError },
      { data: receivables, error: receivablesError },
    ] = await Promise.all([ordersQuery, receivableQuery]);

    if (ordersError) {
      return NextResponse.json(
        {
          error: "Failed to fetch sales orders",
          details: ordersError.message,
        },
        { status: 500 }
      );
    }

    if (receivablesError) {
      return NextResponse.json(
        {
          error: "Failed to fetch accounts receivable",
          details: receivablesError.message,
        },
        { status: 500 }
      );
    }

    const totalOrders = orders?.length || 0;
    const totalRevenue = (receivables || []).reduce(
      (sum, r) => sum + (parseFloat(r.amount) || 0),
      0
    );

    const paidReceivables = (receivables || []).filter(
      (r) => (r.status || "").toLowerCase() === "paid"
    );
    const paidRevenue = paidReceivables.reduce(
      (sum, r) => sum + (parseFloat(r.amount) || 0),
      0
    );

    // Join orders with their receivables/invoices
    const ordersWithInvoices = (orders || []).map(order => {
      const relatedReceivables = (receivables || []).filter(
        r => r.sales_order_id === order.id
      );
      return {
        ...order,
        invoices: relatedReceivables
      };
    });

    const payload = {
      kpis: {
        revenue: totalRevenue,
        paidRevenue,
        orders: totalOrders,
        stockAlerts: 0, // placeholder if you later derive this from inventory
      },
      meta: {
        range,
        from: fromIso,
        to: toIso,
        ordersSampleCount: Math.min(totalOrders, 5),
        receivablesSampleCount: Math.min(receivables?.length || 0, 5),
      },
      samples: {
        recentOrders: (orders || [])
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5),
        recentReceivables: (receivables || [])
          .sort((a, b) => new Date(b.invoice_date) - new Date(a.invoice_date))
          .slice(0, 5),
      },
      allOrders: ordersWithInvoices
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
      allReceivables: (receivables || [])
        .sort((a, b) => new Date(b.invoice_date) - new Date(a.invoice_date)),
    };

    // Return response with cache-control headers to prevent stale data
    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Data-Source': 'real-time-api',
        'X-Data-Freshness': 'live'
      }
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        }
      }
    );
  }
}


