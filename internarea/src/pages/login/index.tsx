import AuthLayout from "@/Components/AuthLayout";
import LoginOtpModal from "@/Components/LoginOtpModal";
import { login } from "@/Feature/Userslice";
import { setStoredAuth } from "@/lib/authStorage";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

const LoginPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const router = useRouter();
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://backend-tau-snowy-58.vercel.app";
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [pendingToken, setPendingToken] = useState("");
  const [pendingUser, setPendingUser] = useState<any>(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [expireTimer, setExpireTimer] = useState(300);
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  useEffect(() => {
    if (!showOtpModal) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      setExpireTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [showOtpModal]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.identifier || !formData.password) {
      toast.error(t("auth.identifier_password_required", { defaultValue: "Identifier and password are required." }));
      return;
    }

    try {
      setIsLoading(true);
      const res = await axios.post(`${apiBaseUrl}/api/auth/login`, formData);
      if (res.data.requiresOtp) {
        setPendingToken(res.data.pendingToken);
        setPendingUser(res.data.user);
        setResendTimer(res.data.resendAfterSeconds || 60);
        setExpireTimer(res.data.expiresInSeconds || 300);
        setOtp("");
        setShowOtpModal(true);
        toast.info(res.data.message || t("auth.otp_sent", { defaultValue: "OTP sent to your registered email." }));
        return;
      }
      const authUser = { ...res.data.user, token: res.data.token, authProvider: "local" };
      setStoredAuth(authUser);
      dispatch(login(authUser));
      toast.success(t("auth.login_success", { defaultValue: "Logged in successfully." }));
      await router.push("/");
    } catch (error: any) {
      toast.error(error.response?.data?.error || t("auth.failed_login", { defaultValue: "Failed to login." }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6 || !pendingToken) return;

    try {
      setIsOtpLoading(true);
      const res = await axios.post(`${apiBaseUrl}/api/auth/login-otp/verify`, {
        pendingToken,
        otp,
      });
      const authUser = { ...res.data.user, token: res.data.token, authProvider: "local" };
      setStoredAuth(authUser);
      dispatch(login(authUser));
      setShowOtpModal(false);
      setPendingToken("");
      setPendingUser(null);
      setOtp("");
      toast.success(t("auth.login_success", { defaultValue: "Logged in successfully." }));
      await router.push("/");
    } catch (error: any) {
      toast.error(error.response?.data?.error || t("auth.failed_verify_otp", { defaultValue: "Failed to verify login OTP." }));
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!pendingToken) return;

    try {
      setIsOtpLoading(true);
      const res = await axios.post(`${apiBaseUrl}/api/auth/login-otp/send`, {
        pendingToken,
      });
      setResendTimer(res.data.resendAfterSeconds || 60);
      setExpireTimer(res.data.expiresInSeconds || 300);
      toast.success(res.data.message || t("auth.otp_sent", { defaultValue: "OTP sent to your registered email." }));
    } catch (error: any) {
      toast.error(error.response?.data?.error || t("auth.failed_resend_otp", { defaultValue: "Failed to resend OTP." }));
    } finally {
      setIsOtpLoading(false);
    }
  };

  return (
    <>
      <AuthLayout
        title={t("auth.signin_title", { defaultValue: "Sign in to your account" })}
        subtitle={t("auth.signin_desc", { defaultValue: "Use your registered email or phone number with your password. Google sign-in continues to work from the homepage." })}
        footer={
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-700">
              {t("auth.create_account", { defaultValue: "Create account" })}
            </Link>
            <span className="text-slate-300">|</span>
            <Link href="/forgot-password" className="font-semibold text-blue-600 hover:text-blue-700">
              {t("auth.forgot_password_link", { defaultValue: "Forgot password?" })}
            </Link>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input name="identifier" value={formData.identifier} onChange={handleChange} placeholder={t("auth.identifier_placeholder", { defaultValue: "Email address or phone number" })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-500" />
          <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder={t("auth.password_placeholder", { defaultValue: "Password" })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-500" />
          <button type="submit" disabled={isLoading} className="w-full rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">
            {isLoading ? t("auth.signing_in", { defaultValue: "Signing in..." }) : t("auth.signin_btn", { defaultValue: "Sign in" })}
          </button>
        </form>
      </AuthLayout>

      <LoginOtpModal
        isOpen={showOtpModal}
        otp={otp}
        onOtpChange={setOtp}
        onClose={() => {
          setShowOtpModal(false);
          setPendingToken("");
          setPendingUser(null);
          setOtp("");
        }}
        onVerify={handleVerifyOtp}
        onResend={handleResendOtp}
        isLoading={isOtpLoading}
        resendTimer={resendTimer}
        expireTimer={expireTimer}
        email={pendingUser?.email}
      />
    </>
  );
};

export default LoginPage;
