"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/signup";
      const body = isLogin 
        ? { email, password }
        : { email, password, role };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      // Store user info in localStorage
      if (data.user) {
        localStorage.setItem("auth_user", JSON.stringify(data.user));
      }
      if (data.token) {
        localStorage.setItem("auth_token", data.token);
      }

      // Redirect to BI dashboard
      router.push("/bi");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#d4e9e2] p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        {/* Starbucks Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-3">
            <div className="w-16 h-16 rounded-full bg-[#00704A] flex items-center justify-center">
              <svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20 8C15 8 11 11 11 15C11 19 15 22 20 22C25 22 29 19 29 15C29 11 25 8 20 8ZM20 24C13 24 8 27 8 32V34H32V32C32 27 27 24 20 24Z"
                  fill="white"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-xl font-bold text-[#00704A] tracking-wide">STARBUCKS</h1>
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-bold text-[#8B4513] mb-6 text-center">
          {isLogin ? "STARBUCKS LOGIN" : "STARBUCKS SIGNUP"}
        </h2>

        {/* Sign In Using Email Label - only show on login */}
        {isLogin && (
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            SIGN IN USING EMAIL
          </h3>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required={!isLogin}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00704A] focus:border-transparent bg-white text-black"
              >
                <option value="">Select a role</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Email Address"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00704A] focus:border-transparent placeholder-gray-400 bg-white text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00704A] focus:border-transparent placeholder-gray-400 bg-white text-black"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1e8e5e] text-white py-3 rounded-lg font-semibold hover:bg-[#1a7a52] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : isLogin ? "LOGIN" : "SIGNUP"}
          </button>
        </form>

        {/* Signup/Login Toggle */}
        <div className="mt-6 text-center text-sm text-gray-600">
          {isLogin ? (
            <>
              Don't have an account?{" "}
              <button
                onClick={() => setIsLogin(false)}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Signup here at Starbucks!
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => setIsLogin(true)}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Login here
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
