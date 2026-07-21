import { login, selectuser } from "@/Feature/Userslice";
import { ExternalLink, Mail, User, Camera } from "lucide-react";
import Link from "next/link";
import React, { useRef, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { updateProfile } from "firebase/auth";
import { auth } from "@/firebase/firebase";
import { useTranslation } from "react-i18next";
import { getApiBaseUrl, getAuthHeaders } from "@/lib/api";

interface User {
  name: string;
  email: string;
  photo: string;
}

type LoginActivityItem = {
  id: string;
  browser: string;
  browserVersion: string;
  operatingSystem: string;
  deviceType: string;
  ipAddress: string;
  loginMethod: string;
  loginStatus: string;
  createdAt: string;
};

type PaymentItem = {
  _id: string;
  plan: string;
  amount: number;
  razorpayPaymentId: string;
  transactionStatus: string;
  paidAt: string;
  invoiceNumber: string;
};

const index = () => {
  const { t } = useTranslation();
  const user = useSelector(selectuser);
  const dispatch = useDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [resumeData, setResumeData] = useState<any>(null);
  const [friendCount, setFriendCount] = useState(0);
  const [loginHistory, setLoginHistory] = useState<LoginActivityItem[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  
  const [paymentHistory, setPaymentHistory] = useState<PaymentItem[]>([]);
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentTotalPages, setPaymentTotalPages] = useState(1);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);

  const apiBaseUrl = getApiBaseUrl();

  useEffect(() => {
    if (user?.email) {
      axios.get(`${apiBaseUrl}/api/resume/${user.email}`)
        .then(res => setResumeData(res.data))
        .catch(err => console.log("No premium resume found or error fetching."));
    }
  }, [user, apiBaseUrl]);

  useEffect(() => {
    const headers = getAuthHeaders();
    if (!headers.Authorization) return;
    axios.get(`${apiBaseUrl}/api/community/me`, { headers })
      .then((res) => setFriendCount(res.data.user?.friendCount || res.data.friends?.length || 0))
      .catch(() => setFriendCount(0));
  }, [apiBaseUrl]);

  useEffect(() => {
    const headers = getAuthHeaders();
    if (!headers.Authorization) return;

    setIsHistoryLoading(true);
    axios
      .get(`${apiBaseUrl}/api/auth/login-history?page=${historyPage}&limit=10`, {
        headers,
      })
      .then((res) => {
        setLoginHistory(res.data.activities || []);
        setHistoryTotalPages(res.data.pagination?.totalPages || 1);
      })
      .catch(() => setLoginHistory([]))
      .finally(() => setIsHistoryLoading(false));
  }, [apiBaseUrl, historyPage]);

  useEffect(() => {
    const headers = getAuthHeaders();
    if (!headers.Authorization) return;

    setIsPaymentLoading(true);
    axios
      .get(`${apiBaseUrl}/api/subscription/history?page=${paymentPage}&limit=10`, { headers })
      .then((res) => {
        setPaymentHistory(res.data.payments || []);
        setPaymentTotalPages(res.data.pagination?.totalPages || 1);
      })
      .catch(() => setPaymentHistory([]))
      .finally(() => setIsPaymentLoading(false));
  }, [apiBaseUrl, paymentPage]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // 1. Upload to backend
      const res = await axios.post(`${apiBaseUrl}/api/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const newPhotoUrl = res.data.url;

      // 2. Update Firebase Auth Profile
      if (auth?.currentUser) {
        await updateProfile(auth.currentUser, {
          photoURL: newPhotoUrl,
        });
      }

      // 3. Update Redux State
      dispatch(
        login({
          ...user,
          photo: newPhotoUrl,
        })
      );
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("Failed to upload profile photo");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Profile Header */}
          <div className="relative h-32 bg-gradient-to-r from-blue-500 to-blue-600">
            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 relative group">
              {user?.photo ? (
                <img
                  src={user?.photo}
                  alt={user?.name?.charAt(0) || "U"}
                  className={`w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover bg-gray-200 text-gray-500 flex items-center justify-center text-xl font-bold ${isUploading ? 'opacity-50' : ''}`}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "https://cdn-icons-png.flaticon.com/128/149/149071.png";
                  }}
                />
              ) : (
                <div className={`w-24 h-24 rounded-full border-4 border-white shadow-lg bg-gray-200 flex items-center justify-center ${isUploading ? 'opacity-50' : ''}`}>
                  <User className="h-12 w-12 text-gray-400" />
                </div>
              )}
              
              {/* Edit Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full border-2 border-white text-white shadow-md hover:bg-blue-700 transition-colors"
                title="Update Profile Picture"
              >
                <Camera className="w-4 h-4" />
              </button>

              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

          {/* Profile Content */}
          <div className="pt-16 pb-8 px-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
              <div className="mt-2 flex items-center justify-center text-gray-500">
                <Mail className="h-4 w-4 mr-2" />
                <span>{user?.email}</span>
              </div>
            </div>

            {/* Profile Details */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <span className="text-blue-600 font-semibold text-2xl">
                    0
                  </span>
                  <p className="text-blue-600 text-sm mt-1">
                    {t("active_applications")}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <span className="text-green-600 font-semibold text-2xl">
                    {friendCount}
                  </span>
                  <p className="text-green-600 text-sm mt-1">
                    Friends
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-center pt-4">
                <Link
                  href="/userapplication"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  {t("view_applications")}
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </div>

              <div className="pt-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">Login History</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Latest login activity across Google and email/password sign-ins.
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
                      Page {historyPage} of {historyTotalPages}
                    </span>
                  </div>

                  <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    {isHistoryLoading ? (
                      <div className="px-4 py-10 text-center text-sm text-slate-500">
                        Loading login history...
                      </div>
                    ) : loginHistory.length === 0 ? (
                      <div className="px-4 py-10 text-center text-sm text-slate-500">
                        No login history available yet.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                          <thead className="bg-slate-50 text-left text-slate-500">
                            <tr>
                              <th className="px-4 py-3 font-medium">Date & Time</th>
                              <th className="px-4 py-3 font-medium">Browser</th>
                              <th className="px-4 py-3 font-medium">OS</th>
                              <th className="px-4 py-3 font-medium">Device</th>
                              <th className="px-4 py-3 font-medium">IP Address</th>
                              <th className="px-4 py-3 font-medium">Method</th>
                              <th className="px-4 py-3 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {loginHistory.map((entry) => (
                              <tr key={entry.id}>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  {new Date(entry.createdAt).toLocaleString()}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  {[entry.browser, entry.browserVersion].filter(Boolean).join(" ")}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">{entry.operatingSystem || "Unknown"}</td>
                                <td className="px-4 py-3 whitespace-nowrap">{entry.deviceType}</td>
                                <td className="px-4 py-3 whitespace-nowrap">{entry.ipAddress || "Unknown"}</td>
                                <td className="px-4 py-3 whitespace-nowrap">{entry.loginMethod}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span
                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                      entry.loginStatus === "Success"
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-rose-100 text-rose-700"
                                    }`}
                                  >
                                    {entry.loginStatus}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-end gap-3">
                    <button
                      onClick={() => setHistoryPage((prev) => Math.max(prev - 1, 1))}
                      disabled={historyPage === 1 || isHistoryLoading}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        setHistoryPage((prev) =>
                          historyTotalPages > 0 ? Math.min(prev + 1, historyTotalPages) : prev
                        )
                      }
                      disabled={historyPage >= historyTotalPages || isHistoryLoading}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>

              {/* Payment History */}
              <div className="pt-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">Payment History</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        View your subscription payments.
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
                      Page {paymentPage} of {paymentTotalPages}
                    </span>
                  </div>

                  <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    {isPaymentLoading ? (
                      <div className="px-4 py-10 text-center text-sm text-slate-500">
                        Loading payment history...
                      </div>
                    ) : paymentHistory.length === 0 ? (
                      <div className="px-4 py-10 text-center text-sm text-slate-500">
                        No payment history available yet.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                          <thead className="bg-slate-50 text-left text-slate-500">
                            <tr>
                              <th className="px-4 py-3 font-medium">Date</th>
                              <th className="px-4 py-3 font-medium">Invoice</th>
                              <th className="px-4 py-3 font-medium">Plan</th>
                              <th className="px-4 py-3 font-medium">Amount</th>
                              <th className="px-4 py-3 font-medium">Transaction ID</th>
                              <th className="px-4 py-3 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {paymentHistory.map((entry) => (
                              <tr key={entry._id}>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  {new Date(entry.paidAt || Date.now()).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">{entry.invoiceNumber}</td>
                                <td className="px-4 py-3 whitespace-nowrap">{entry.plan}</td>
                                <td className="px-4 py-3 whitespace-nowrap">₹{entry.amount}</td>
                                <td className="px-4 py-3 whitespace-nowrap">{entry.razorpayPaymentId}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span
                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                      entry.transactionStatus === "success"
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-rose-100 text-rose-700"
                                    }`}
                                  >
                                    {entry.transactionStatus}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-end gap-3">
                    <button
                      onClick={() => setPaymentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={paymentPage === 1 || isPaymentLoading}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        setPaymentPage((prev) =>
                          paymentTotalPages > 0 ? Math.min(prev + 1, paymentTotalPages) : prev
                        )
                      }
                      disabled={paymentPage >= paymentTotalPages || isPaymentLoading}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default index;
