import AuthLayout from "@/Components/AuthLayout";
import { login } from "@/Feature/Userslice";
import { setStoredAuth } from "@/lib/authStorage";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";

const LoginPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001";
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.identifier || !formData.password) {
      toast.error("Identifier and password are required.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await axios.post(`${apiBaseUrl}/api/auth/login`, formData);
      const authUser = { ...res.data.user, token: res.data.token, authProvider: "local" };
      setStoredAuth(authUser);
      dispatch(login(authUser));
      toast.success("Logged in successfully.");
      await router.push("/");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to login.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Sign in to your account"
      subtitle="Use your registered email or phone number with your password. Google sign-in continues to work from the homepage."
      footer={
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-700">
            Create account
          </Link>
          <span className="text-slate-300">|</span>
          <Link href="/forgot-password" className="font-semibold text-blue-600 hover:text-blue-700">
            Forgot password?
          </Link>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <input name="identifier" value={formData.identifier} onChange={handleChange} placeholder="Email address or phone number" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-500" />
        <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Password" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-500" />
        <button type="submit" disabled={isLoading} className="w-full rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">
          {isLoading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
