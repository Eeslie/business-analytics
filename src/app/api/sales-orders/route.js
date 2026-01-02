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

    // Fetch sales orders and accounts receivable separately, then join
    let ordersQuery = supabase
      .from("sales_orders")
      .select("*")
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    let receivableQuery = supabase
      .from("accounts_receivable")
      .select("id, amount, invoice_date, due_date, invoice_number, status, sales_order_id");

    // Apply date filtering if provided
    if (dateFrom && dateFrom !== "") {
      ordersQuery = ordersQuery.gte("created_at", `${dateFrom}T00:00:00`);
      receivableQuery = receivableQuery.gte("invoice_date", `${dateFrom}T00:00:00`);
    }
    if (dateTo && dateTo !== "") {
      ordersQuery = ordersQuery.lte("created_at", `${dateTo}T23:59:59`);
      receivableQuery = receivableQuery.lte("invoice_date", `${dateTo}T23:59:59`);
    }

    const [
      { data: orders, error: ordersError },
      { data: receivables, error: receivablesError }
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

    // Calculate totals for profit & loss
    const totalRevenue = (orders || []).reduce(
      (sum, order) => sum + (parseFloat(order.total_amount) || 0),
      0
    );

    // Calculate paid vs unpaid revenue from invoices
    let paidRevenue = 0;
    let unpaidRevenue = 0;
    
    ordersWithInvoices.forEach(order => {
      const invoices = order.invoices || [];
      invoices.forEach(invoice => {
        const amount = parseFloat(invoice.amount) || 0;
        if ((invoice.status || "").toLowerCase() === "paid") {
          paidRevenue += amount;
        } else {
          unpaidRevenue += amount;
        }
      });
      
      // If no invoices, consider order amount as unpaid
      if (invoices.length === 0) {
        unpaidRevenue += parseFloat(order.total_amount) || 0;
      }
    });

    const totalOrders = orders?.length || 0;
    const paidOrders = (orders || []).filter(
      (o) => (o.status || "").toLowerCase() === "paid" || (o.status || "").toLowerCase() === "completed"
    ).length;
    const pendingOrders = totalOrders - paidOrders;

    const payload = {
      orders: ordersWithInvoices,
      summary: {
        totalOrders,
        paidOrders,
        pendingOrders,
        totalRevenue,
        paidRevenue,
        unpaidRevenue,
        netProfit: paidRevenue, // Assuming paid revenue is profit for now
      },
    };

    return NextResponse.json(payload);
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}

