// server.js
require("dotenv").config(); // MUST be at the very top

const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseKey) {
  console.error("❌ ERROR: Missing environment variables!");
  console.log("SUPABASE_URL:", supabaseUrl ? "✓ Set" : "✗ Missing");
  console.log("SUPABASE_KEY:", supabaseKey ? "✓ Set" : "✗ Missing");
  console.log("\nMake sure your .env file is in the same directory as server.js");
  process.exit(1);
}

console.log("✓ Environment variables loaded successfully");
console.log("✓ Supabase URL:", supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware - CORS MUST come before other middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'], 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log("Query params:", req.query);
  next();
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    supabaseConfigured: !!supabaseUrl && !!supabaseKey,
    supabaseUrl: supabaseUrl,
    port: PORT
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Backend API is running",
    endpoints: [
      "GET /api/health",
      "GET /api/test-connection",
      "GET /api/inventory-stocks",
      "GET /api/realtime-kpis"
    ]
  });
});

// INVENTORY STOCKS ENDPOINT - WITH FLEXIBLE DATE FILTERING
app.get("/api/inventory-stocks", async (req, res) => {
  try {
    console.log("\n📊 === INVENTORY STOCKS REQUEST ===");
    console.log("Query params:", req.query);

    const { dateFrom, dateTo, department, region } = req.query;

    // Start with base inventory query
    let query = supabase
      .from("inventory")
      .select(`
        id,
        qty,
        inventory_item_id,
        inventory_item:inventory_item_id (
          skuid,
          name,
          category,
          unit_measurement,
          cost
        ),
        branch:branch_id (
          name,
          location
        ),
        warehouse:warehouse_id (
          name,
          location,
          status
        )
      `)
      .eq("is_deleted", false)
      .order('id', { ascending: true });

    let inventoryIds = null;

    // Apply date filtering based on transaction dates
    if (dateFrom || dateTo) {
      console.log("🔍 Filtering by transaction dates...");
      
      let transactionQuery = supabase
        .from("inventory_transaction")
        .select("inventory_id, created_at, type, changed_quantity, source");

      if (dateFrom && dateFrom !== "") {
        console.log(`📅 Transaction from date: ${dateFrom}`);
        transactionQuery = transactionQuery.gte("created_at", `${dateFrom}T00:00:00`);
      }
      
      if (dateTo && dateTo !== "") {
        console.log(`📅 Transaction to date: ${dateTo}`);
        transactionQuery = transactionQuery.lte("created_at", `${dateTo}T23:59:59`);
      }

      const { data: transactions, error: transError } = await transactionQuery;

      if (transError) {
        console.error("❌ Transaction query error:", transError);
        return res.status(500).json({ 
          error: transError.message,
          details: transError.details,
          hint: transError.hint 
        });
      }

      console.log(`📦 Found ${transactions?.length || 0} transactions in date range`);

      // Get unique inventory IDs from transactions
      inventoryIds = [...new Set(transactions.map(t => t.inventory_id))];
      console.log(`🔍 Unique inventory IDs with transactions: ${inventoryIds.length}`);

      if (inventoryIds.length > 0) {
        query = query.in("id", inventoryIds);
      } else {
        // No transactions found in date range, return empty result
        console.log("⚠️  No inventory items had transactions in this date range");
        return res.json([]);
      }
    }

    // Apply other filters (department, region) if your schema supports them
    // Uncomment and adjust based on your actual schema:
    // if (department && department !== "All") {
    //   query = query.eq('branch.department', department);
    // }
    // if (region && region !== "All") {
    //   query = query.eq('branch.region', region);
    // }

    const { data, error, status, statusText } = await query;

    console.log("\n📦 Supabase Response:");
    console.log("Status:", status, statusText);
    console.log("Error:", error);
    console.log("Data count:", data?.length || 0);
    
    if (error) {
      console.error("❌ Supabase error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      return res.status(500).json({ 
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    }

    if (!data) {
      console.log("⚠️  No data returned from Supabase");
      return res.json([]);
    }

    // Enrich data with transaction information AND transfer information
    let enrichedData = data;
    
    if (data.length > 0) {
      console.log("🔄 Enriching data with transaction and transfer details...");
      
      // Fetch transaction details for the filtered inventory items
      let transQuery = supabase
        .from("inventory_transaction")
        .select("inventory_id, created_at, type, changed_quantity, source")
        .in("inventory_id", data.map(d => d.id));

      // Apply date filters to transactions if provided
      if (dateFrom && dateFrom !== "") {
        transQuery = transQuery.gte("created_at", `${dateFrom}T00:00:00`);
      }
      if (dateTo && dateTo !== "") {
        transQuery = transQuery.lte("created_at", `${dateTo}T23:59:59`);
      }

      const { data: allTransactions, error: transError } = await transQuery;

      // Fetch all transfer items with their transfer request details
      let transferItemQuery = supabase
        .from("transfer_item")
        .select(`
          id,
          inventory_item_id,
          quantity,
          cost,
          transfer_request:transfer_request_id (
            id,
            created_at,
            status,
            from_warehouse,
            to_warehouse
          )
        `)
        .in("inventory_item_id", [...new Set(data.map(d => d.inventory_item_id).filter(Boolean))]);

      const { data: allTransferItems, error: transferError } = await transferItemQuery;

      // Filter transfer items by date if provided
      let filteredTransferItems = allTransferItems || [];
      if ((dateFrom || dateTo) && filteredTransferItems.length > 0) {
        filteredTransferItems = filteredTransferItems.filter(item => {
          if (!item.transfer_request?.created_at) return false;
          const itemDate = new Date(item.transfer_request.created_at);
          if (dateFrom && itemDate < new Date(`${dateFrom}T00:00:00`)) return false;
          if (dateTo && itemDate > new Date(`${dateTo}T23:59:59`)) return false;
          return true;
        });
      }

      if (transError) {
        console.error("❌ Error fetching transactions:", transError);
      }
      if (transferError) {
        console.error("❌ Error fetching transfers:", transferError);
      }

      console.log(`📦 Found ${allTransactions?.length || 0} related transactions`);
      console.log(`📦 Found ${filteredTransferItems.length} related transfer items`);
      
      enrichedData = data.map(inventory => {
        const relatedTransactions = allTransactions?.filter(t => t.inventory_id === inventory.id) || [];
        const latestTransaction = relatedTransactions.length > 0
          ? relatedTransactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
          : null;

        // Find transfer items related to this inventory's item
        const relatedTransferItems = filteredTransferItems.filter(
          item => item.inventory_item_id === inventory.inventory_item_id
        );

        // Get unique transfer requests
        const uniqueTransfers = [...new Set(relatedTransferItems.map(item => item.transfer_request?.id))].filter(Boolean);

        return {
          ...inventory,
          transaction_count: relatedTransactions.length,
          transfer_count: uniqueTransfers.length,
          total_activity_count: relatedTransactions.length + uniqueTransfers.length,
          latest_transaction: latestTransaction,
          latest_transaction_date: latestTransaction?.created_at || null,
          total_quantity_change: relatedTransactions.reduce((sum, t) => sum + (parseFloat(t.changed_quantity) || 0), 0),
          transfer_items: relatedTransferItems
        };
      });
    }

    console.log(`✓ Successfully fetched ${enrichedData.length} inventory records`);
    if (enrichedData.length > 0) {
      console.log("Sample record:", enrichedData[0]);
    }
    console.log("=== END REQUEST ===\n");
    
    res.json(enrichedData);
  } catch (err) {
    console.error("❌ Server error:", err);
    console.error("Stack trace:", err.stack);
    res.status(500).json({ 
      error: "Internal server error",
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// REAL-TIME KPIs ENDPOINT - SALES ORDERS + ACCOUNTS RECEIVABLE
app.get("/api/realtime-kpis", async (req, res) => {
  try {
    console.log("\n⚡ === REAL-TIME KPIS REQUEST ===");
    console.log("Query params:", req.query);

    const { range = "today" } = req.query;

    const now = new Date();
    let fromDate;

    // Basic time-window handling for "today", "7d", "30d"
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

    // Build base queries
    let ordersQuery = supabase
      .from("sales_orders")
      .select("id, total_amount, created_at, status")
      .eq("is_deleted", false);

    let receivableQuery = supabase
      .from("accounts_receivable")
      .select("id, amount, invoice_date, status, sales_order_id");

    if (fromIso) {
      ordersQuery = ordersQuery.gte("created_at", fromIso);
      receivableQuery = receivableQuery.gte("invoice_date", fromIso);
    }

    // Execute in parallel
    const [{ data: orders, error: ordersError }, { data: receivables, error: receivablesError }] =
      await Promise.all([ordersQuery, receivableQuery]);

    if (ordersError) {
      console.error("❌ Error fetching sales orders:", ordersError);
      return res.status(500).json({
        error: "Failed to fetch sales orders",
        details: ordersError.message,
      });
    }

    if (receivablesError) {
      console.error("❌ Error fetching accounts receivable:", receivablesError);
      return res.status(500).json({
        error: "Failed to fetch accounts receivable",
        details: receivablesError.message,
      });
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
    };

    console.log("✅ Real-time KPIs calculated:", {
      orders: payload.kpis.orders,
      revenue: payload.kpis.revenue,
      paidRevenue: payload.kpis.paidRevenue,
    });
    console.log("=== END REAL-TIME KPIS REQUEST ===\n");

    res.json(payload);
  } catch (err) {
    console.error("❌ Server error (realtime-kpis):", err);
    res.status(500).json({
      error: "Internal server error",
      message: err.message,
    });
  }
});

// Test endpoint to verify Supabase connection
app.get("/api/test-connection", async (req, res) => {
  try {
    console.log("🧪 Testing Supabase connection...");
    
    // Try to count records in inventory table
    const { count, error } = await supabase
      .from("inventory")
      .select("*", { count: 'exact', head: true });
    
    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        details: error
      });
    }
    
    res.json({
      success: true,
      message: "Supabase connection successful",
      inventoryCount: count,
      supabaseUrl: supabaseUrl
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  console.log(`⚠️  404 - Not Found: ${req.method} ${req.url}`);
  res.status(404).json({ 
    error: "Not Found",
    message: `Cannot ${req.method} ${req.url}`,
    availableEndpoints: [
      "GET /",
      "GET /api/health",
      "GET /api/test-connection",
      "GET /api/inventory-stocks",
      "GET /api/realtime-kpis"
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err);
  res.status(500).json({ 
    error: "Internal Server Error",
    message: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log("\n" + "=".repeat(70));
  console.log("🚀 SERVER STARTED SUCCESSFULLY");
  console.log("=".repeat(70));
  console.log(`✓ Server running:           http://localhost:${PORT}`);
  console.log(`✓ Health check:             http://localhost:${PORT}/api/health`);
  console.log(`✓ Test connection:          http://localhost:${PORT}/api/test-connection`);
  console.log(`✓ Inventory stocks:         http://localhost:${PORT}/api/inventory-stocks`);
  console.log(`✓ Supabase URL:             ${supabaseUrl}`);
  console.log("=".repeat(70));
  console.log("\n📝 Waiting for requests...\n");
  console.log("💡 TIP: Try visiting http://localhost:3001/api/test-connection first\n");
});