import AuthLayout from "@/Components/AuthLayout";
import axios from "axios";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";

const ForgotPasswordPage = () => {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001";
  const [mode, setMode] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [serverMessage, setServerMessage] = useState("");

  const currentValue = useMemo(() => (mode === "email" ? email : phone), [mode, email, phone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentValue.trim()) {
      toast.error(mode === "email" ? "Email is required." : "Phone number is required.");
      return;
    }

    try {
      setIsLoading(true);
      setServerMessage("");
      const payload = mode === "email" ? { email } : { phone };
      const res = await axios.post(`${apiBaseUrl}/api/auth/forgot-password/${mode}`, payload);
      setServerMessage(res.data.message);
      toast.success(res.data.message);
    } catch (error: any) {
      const message = error.response?.data?.error || "Failed to process password reset.";
      setServerMessage(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Recover access using your registered email or phone number. For security, password reset is allowed only once every 24 hours."
      footer={
        <p>
          Remembered it?{" "}
          <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700">
            Go back to login
          </Link>
        </p>
      }
    >
      <div className="mb-6 flex rounded-2xl bg-slate-100 p-1">
        <button type="button" onClick={() => setMode("email")} className={`flex-1 rounded-2xl px-4 py-3 text-sm font-medium transition ${mode === "email" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600"}`}>
          Registered Email
        </button>
        <button type="button" onClick={() => setMode("phone")} className={`flex-1 rounded-2xl px-4 py-3 text-sm font-medium transition ${mode === "phone" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600"}`}>
          Registered Phone
        </button>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {mode === "email" ? (
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your registered email" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-500" />
        ) : (
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter your registered phone number" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-500" />
        )}

        <button type="submit" disabled={isLoading} className="w-full rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">
          {isLoading ? "Processing..." : "Reset password"}
        </button>
      </form>

      {serverMessage ? (
        <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {serverMessage}
        </div>
      ) : null}
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
