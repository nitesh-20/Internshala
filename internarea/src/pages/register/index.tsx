import AuthLayout from "@/Components/AuthLayout";
import { login } from "@/Feature/Userslice";
import { setStoredAuth } from "@/lib/authStorage";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";

const RegisterPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://backend-tau-snowy-58.vercel.app";
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.password) {
      toast.error("Name and password are required.");
      return;
    }
    if (!formData.email && !formData.phone) {
      toast.error("Provide an email or phone number.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await axios.post(`${apiBaseUrl}/api/auth/register`, formData);
      const authUser = { ...res.data.user, token: res.data.token, authProvider: "local" };
      setStoredAuth(authUser);
      dispatch(login(authUser));
      toast.success("Registration successful.");
      await router.push("/");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to register.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Register with email/password while keeping Google sign-in available for users who prefer it."
      footer={
        <p>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700">
            Sign in here
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <input name="name" value={formData.name} onChange={handleChange} placeholder="Full name" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-500" />
        <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email address" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-500" />
        <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone number" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-500" />
        <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Password" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-500" />
        <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm password" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-500" />
        <button type="submit" disabled={isLoading} className="w-full rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">
          {isLoading ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
};

export default RegisterPage;
