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

export async function POST(request) {
  try {
    const { email, password, role } = await request.json();

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "Email, password, and role are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Validate role - only admin allowed
    if (role.toLowerCase() !== "admin") {
      return NextResponse.json(
        { error: "Invalid role. Only 'admin' is allowed" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("_users")
      .select("email")
      .eq("email", email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // In a real application, you should hash the password before storing
    // TODO: Implement proper password hashing (bcrypt, etc.)
    const { data: newUser, error: insertError } = await supabase
      .from("_users")
      .insert([
        {
          email: email.toLowerCase(),
          password: password, // TODO: Hash this password
          role: role.toLowerCase(),
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Signup error:", insertError);
      return NextResponse.json(
        { error: insertError.message || "Failed to create user" },
        { status: 500 }
      );
    }

    // Return user data (excluding password)
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      message: "Signup successful",
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

