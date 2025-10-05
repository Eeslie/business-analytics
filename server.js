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
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for testing
  credentials: true
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    supabaseConfigured: true,
    port: PORT
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Backend API is running",
    endpoints: [
      "GET /api/health",
      "GET /api/inventory-stocks"
    ]
  });
});

// INVENTORY STOCKS ENDPOINT
app.get("/api/inventory-stocks", async (req, res) => {
  try {
    console.log("📊 Fetching inventory stocks with query:", req.query);

    const { dateFrom, dateTo, department, region } = req.query;

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

    // Apply filters if provided
    // Uncomment and adjust these based on your actual schema:
    // if (dateFrom && dateTo) {
    //   query = query.gte('created_at', dateFrom).lte('created_at', dateTo);
    // }
    // if (department && department !== "All") {
    //   query = query.eq('branch.department', department);
    // }
    // if (region && region !== "All") {
    //   query = query.eq('branch.region', region);
    // }

    const { data, error } = await query;
    
    if (error) {
      console.error("❌ Supabase error:", error);
      return res.status(500).json({ 
        error: error.message,
        details: error.details,
        hint: error.hint 
      });
    }

    console.log(`✓ Successfully fetched ${data?.length || 0} inventory records`);
    res.json(data || []);
  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({ 
      error: "Internal server error",
      message: err.message 
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
  console.log("🛠️ API Base URL is:", `http://localhost:${PORT}`);
  console.log("\n" + "=".repeat(60));
  console.log("🚀 SERVER STARTED SUCCESSFULLY");
  console.log("=".repeat(60));
  console.log(`✓ Server running on:        http://localhost:${PORT}`);
  console.log(`✓ Health check:             http://localhost:${PORT}/api/health`);
  console.log(`✓ Inventory stocks:         http://localhost:${PORT}/api/inventory-stocks`);
  console.log(`✓ Supabase connected:       ${supabaseUrl}`);
  console.log("=".repeat(60) + "\n");
  console.log("📝 Waiting for requests...\n");
});