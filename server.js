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
      "GET /api/inventory-stocks"
    ]
  });
});

// INVENTORY STOCKS ENDPOINT - WITH FLEXIBLE DATE FILTERING
app.get("/api/inventory-stocks", async (req, res) => {
  try {
    console.log("\n📊 === INVENTORY STOCKS REQUEST ===");
    console.log("Query params:", req.query);

    const { dateFrom, dateTo, department, region, dateFilter = "transaction" } = req.query;

    // Start with base inventory query
    let query = supabase
      .from("inventory")
      .select(`
        id,
        qty,
        created_at,
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

    // Apply date filtering based on the dateFilter parameter
    if (dateFrom || dateTo) {
      if (dateFilter === "transaction") {
        // Filter by transaction dates
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

      } else if (dateFilter === "created") {
        // Filter by inventory creation date
        console.log("🔍 Filtering by inventory creation dates...");
        
        if (dateFrom && dateFrom !== "") {
          console.log(`📅 Inventory created from: ${dateFrom}`);
          query = query.gte("created_at", `${dateFrom}T00:00:00`);
        }
        
        if (dateTo && dateTo !== "") {
          console.log(`📅 Inventory created to: ${dateTo}`);
          query = query.lte("created_at", `${dateTo}T23:59:59`);
        }
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

    // Enrich data with transaction information if we filtered by transactions
    let enrichedData = data;
    
    if (dateFilter === "transaction" && (dateFrom || dateTo)) {
      console.log("🔄 Enriching data with transaction details...");
      
      // Fetch transaction details for the filtered inventory items
      let transQuery = supabase
        .from("inventory_transaction")
        .select("inventory_id, created_at, type, changed_quantity, source")
        .in("id", data.map(d => d.id));

      if (dateFrom) transQuery = transQuery.gte("created_at", `${dateFrom}T00:00:00`);
      if (dateTo) transQuery = transQuery.lte("created_at", `${dateTo}T23:59:59`);

      const { data: allTransactions } = await transQuery;

      enrichedData = data.map(inventory => {
        const relatedTransactions = allTransactions?.filter(t => t.inventory_id === inventory.id) || [];
        const latestTransaction = relatedTransactions.length > 0
          ? relatedTransactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
          : null;

        return {
          ...inventory,
          transaction_count: relatedTransactions.length,
          latest_transaction: latestTransaction,
          total_quantity_change: relatedTransactions.reduce((sum, t) => sum + (parseFloat(t.changed_quantity) || 0), 0)
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
      "GET /api/inventory-stocks"
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