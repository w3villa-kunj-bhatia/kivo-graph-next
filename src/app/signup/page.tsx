"use client";

import { useState } from "react";
import { registerUser } from "@/app/actions/authActions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    const res = await registerUser(formData);
    if (res.success) {
      toast.success("Account created! Please log in.");
      router.push("/login");
    } else {
      toast.error(res.message || "Registration failed");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-96 border border-gray-700">
        <h1 className="text-2xl font-bold mb-6 text-blue-500">
          Create Account
        </h1>

        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Full Name
            </label>
            <input
              name="name"
              type="text"
              required
              disabled={isLoading}
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              name="email"
              type="email"
              required
              disabled={isLoading}
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input
              name="password"
              type="password"
              required
              disabled={isLoading}
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none disabled:opacity-50"
            />
            <p className="text-xs text-gray-400 mt-1 ml-1">
              Must be 6+ chars, with 1 number & 1 special char.
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Company Access Code
            </label>
            <input
              name="secretCode"
              type="password"
              required
              disabled={isLoading}
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none disabled:opacity-50"
            />
          </div>

          <button
            disabled={isLoading}
            className={`w-full py-2 rounded font-bold transition ${
              isLoading
                ? "bg-blue-500 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isLoading ? "Signing Up..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-400 hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
