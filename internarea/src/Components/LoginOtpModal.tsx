import React from "react";

type LoginOtpModalProps = {
  isOpen: boolean;
  otp: string;
  onOtpChange: (value: string) => void;
  onClose: () => void;
  onVerify: () => void;
  onResend: () => void;
  isLoading: boolean;
  resendTimer: number;
  expireTimer: number;
  email?: string;
};

const LoginOtpModal = ({
  isOpen,
  otp,
  onOtpChange,
  onClose,
  onVerify,
  onResend,
  isLoading,
  resendTimer,
  expireTimer,
  email,
}: LoginOtpModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-slate-900">Login Verification</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Chrome login requires a one-time password. Enter the 6-digit OTP sent to{" "}
          <span className="font-semibold text-slate-900">{email || "your registered email"}</span>.
        </p>

        <div className="mt-5 flex items-center justify-between text-sm text-slate-500">
          <span>
            Expires in{" "}
            <span className="font-mono font-semibold text-rose-500">
              {Math.floor(expireTimer / 60)}:{(expireTimer % 60).toString().padStart(2, "0")}
            </span>
          </span>
          {resendTimer > 0 ? (
            <span>Resend in {resendTimer}s</span>
          ) : (
            <button
              onClick={onResend}
              disabled={isLoading || expireTimer === 0}
              className="font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
            >
              Resend OTP
            </button>
          )}
        </div>

        <input
          type="text"
          value={otp}
          onChange={(e) => onOtpChange(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
          placeholder="Enter 6-digit OTP"
          disabled={isLoading || expireTimer === 0}
          className="mt-5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-center text-xl font-bold tracking-[0.35em] text-slate-900 outline-none transition focus:border-blue-500 disabled:bg-slate-100"
        />

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 rounded-2xl bg-slate-100 px-4 py-3 font-medium text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onVerify}
            disabled={isLoading || otp.length !== 6 || expireTimer === 0}
            className="flex flex-1 items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-b-2 border-white" />
            ) : (
              "Verify Login"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginOtpModal;
