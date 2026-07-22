import AuthLayout from "@/Components/AuthLayout";
import { login } from "@/Feature/Userslice";
import { setStoredAuth } from "@/lib/authStorage";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

const RegisterPage = () => {
  const { t } = useTranslation();
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
      toast.error(t("auth.name_password_required", { defaultValue: "Name and password are required." }));
      return;
    }
    if (!formData.email && !formData.phone) {
      toast.error(t("auth.provide_email_phone", { defaultValue: "Provide an email or phone number." }));
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error(t("auth.passwords_dont_match", { defaultValue: "Passwords do not match." }));
      return;
    }

    try {
      setIsLoading(true);
      const res = await axios.post(`${apiBaseUrl}/api/auth/register`, formData);
      const authUser = { ...res.data.user, token: res.data.token, authProvider: "local" };
      setStoredAuth(authUser);
      dispatch(login(authUser));
      toast.success(t("auth.register_success", { defaultValue: "Registration successful." }));
      await router.push("/");
    } catch (error: any) {
      toast.error(error.response?.data?.error || t("auth.register_failed", { defaultValue: "Failed to register." }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t("auth.create_account_title", { defaultValue: "Create your account" })}
      subtitle={t("auth.create_account_desc", { defaultValue: "Register with email/password while keeping Google sign-in available for users who prefer it." })}
      footer={
        <p>
          {t("auth.already_have_account", { defaultValue: "Already have an account?" })}{" "}
          <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700">
            {t("auth.signin_here", { defaultValue: "Sign in here" })}
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <input name="name" value={formData.name} onChange={handleChange} placeholder={t("auth.fullname_placeholder", { defaultValue: "Full name" })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-500" />
        <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder={t("auth.email_placeholder", { defaultValue: "Email address" })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-500" />
        <input name="phone" value={formData.phone} onChange={handleChange} placeholder={t("auth.phone_placeholder", { defaultValue: "Phone number" })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-500" />
        <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder={t("auth.password_placeholder", { defaultValue: "Password" })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-500" />
        <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder={t("auth.confirm_password_placeholder", { defaultValue: "Confirm password" })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-500" />
        <button type="submit" disabled={isLoading} className="w-full rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">
          {isLoading ? t("auth.creating_account", { defaultValue: "Creating account..." }) : t("auth.create_account_btn", { defaultValue: "Create account" })}
        </button>
      </form>
    </AuthLayout>
  );
};

export default RegisterPage;
