import { login, selectuser } from "@/Feature/Userslice";
import { ExternalLink, Mail, User, Camera, Shield, CreditCard, Activity, Users, Settings, ChevronRight } from "lucide-react";
import Link from "next/link";
import React, { useRef, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { updateProfile } from "firebase/auth";
import { auth } from "@/firebase/firebase";
import { useTranslation } from "react-i18next";
import { getApiBaseUrl, getAuthHeaders } from "@/lib/api";

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

const Index = () => {
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

  const [activeTab, setActiveTab] = useState("overview");

  const apiBaseUrl = getApiBaseUrl();

  useEffect(() => {
    if (user?.email) {
      axios.get(`${apiBaseUrl}/api/resume/${user.email}`)
        .then(res => setResumeData(res.data))
        .catch(err => console.log("No premium resume found."));
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
    if (activeTab !== "security") return;
    const headers = getAuthHeaders();
    if (!headers.Authorization) return;

    setIsHistoryLoading(true);
    axios
      .get(`${apiBaseUrl}/api/auth/login-history?page=${historyPage}&limit=5`, { headers })
      .then((res) => {
        setLoginHistory(res.data.activities || []);
        setHistoryTotalPages(res.data.pagination?.totalPages || 1);
      })
      .catch(() => setLoginHistory([]))
      .finally(() => setIsHistoryLoading(false));
  }, [apiBaseUrl, historyPage, activeTab]);

  useEffect(() => {
    if (activeTab !== "billing") return;
    const headers = getAuthHeaders();
    if (!headers.Authorization) return;

    setIsPaymentLoading(true);
    axios
      .get(`${apiBaseUrl}/api/subscription/history?page=${paymentPage}&limit=5`, { headers })
      .then((res) => {
        setPaymentHistory(res.data.payments || []);
        setPaymentTotalPages(res.data.pagination?.totalPages || 1);
      })
      .catch(() => setPaymentHistory([]))
      .finally(() => setIsPaymentLoading(false));
  }, [apiBaseUrl, paymentPage, activeTab]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${apiBaseUrl}/api/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const newPhotoUrl = res.data.url;

      if (auth?.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: newPhotoUrl });
      }

      dispatch(login({ ...user, photo: newPhotoUrl }));
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("Failed to upload profile photo");
    } finally {
      setIsUploading(false);
    }
  };

  const getInitials = (name: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans">
      
      {/* Premium Header Banner */}
      <div className="h-64 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05]"></div>
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center pt-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">My Profile</h1>
          <p className="text-slate-400 max-w-xl">Manage your account settings, track subscriptions, and secure your profile.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Sidebar Profile Card */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden sticky top-28">
              <div className="p-8 text-center border-b border-slate-100">
                <div className="relative inline-block mb-4 group">
                  {user?.photo ? (
                    <img
                      src={user?.photo}
                      alt={user?.name}
                      className={`w-28 h-28 rounded-full border-4 border-white shadow-xl object-cover bg-slate-100 ${isUploading ? 'opacity-50' : ''}`}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "https://cdn-icons-png.flaticon.com/128/149/149071.png";
                      }}
                    />
                  ) : (
                    <div className={`w-28 h-28 rounded-full border-4 border-white shadow-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-3xl font-bold text-blue-600 ${isUploading ? 'opacity-50' : ''}`}>
                      {getInitials(user?.name)}
                    </div>
                  )}
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="absolute bottom-1 right-1 bg-blue-600 p-2.5 rounded-full border-2 border-white text-white shadow-lg hover:bg-blue-700 transition-transform hover:scale-110 disabled:opacity-50"
                    title="Update Profile Picture"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                
                <h2 className="text-xl font-bold text-slate-900 mb-1">{user?.name}</h2>
                <div className="flex items-center justify-center text-sm text-slate-500 bg-slate-50 py-1.5 px-3 rounded-full mx-auto w-fit">
                  <Mail className="h-3.5 w-3.5 mr-1.5" />
                  <span className="truncate max-w-[200px]">{user?.email}</span>
                </div>
              </div>

              <div className="p-4 space-y-1">
                {[
                  { id: 'overview', icon: <User size={18} />, label: 'Overview' },
                  { id: 'security', icon: <Shield size={18} />, label: 'Security & Logins' },
                  { id: 'billing', icon: <CreditCard size={18} />, label: 'Billing & Plans' },
                  { id: 'settings', icon: <Settings size={18} />, label: 'Preferences' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                      activeTab === tab.id 
                      ? "bg-blue-50 text-blue-700" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {tab.icon}
                      {tab.label}
                    </div>
                    {activeTab === tab.id && <ChevronRight size={16} />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Main Content Panel */}
          <div className="flex-1">
            
            {activeTab === "overview" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex items-center gap-6 group hover:border-blue-200 transition-colors">
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Activity size={28} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Active Applications</p>
                      <div className="flex items-end gap-3">
                        <span className="text-4xl font-extrabold text-slate-900">0</span>
                        <Link href="/userapplication" className="text-sm font-semibold text-blue-600 hover:underline mb-1">View all</Link>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex items-center gap-6 group hover:border-emerald-200 transition-colors">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Users size={28} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Connections</p>
                      <div className="flex items-end gap-3">
                        <span className="text-4xl font-extrabold text-slate-900">{friendCount}</span>
                        <Link href="/community" className="text-sm font-semibold text-emerald-600 hover:underline mb-1">Community</Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8">
                  <h3 className="text-xl font-bold text-slate-900 mb-6">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link href="/resume" className="flex items-center justify-between p-5 rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all group">
                      <div>
                        <h4 className="font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">Edit Resume</h4>
                        <p className="text-sm text-slate-500">Update your premium builder resume</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <ExternalLink size={18} />
                      </div>
                    </Link>
                    <Link href="/subscription" className="flex items-center justify-between p-5 rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all group">
                      <div>
                        <h4 className="font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">Upgrade Plan</h4>
                        <p className="text-sm text-slate-500">Unlock more applications and features</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <CreditCard size={18} />
                      </div>
                    </Link>
                  </div>
                </div>

              </div>
            )}

            {activeTab === "security" && (
              <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">Login Activity</h3>
                    <p className="text-sm text-slate-500">Review your recent sign-ins to ensure account security.</p>
                  </div>
                  <div className="px-3 py-1.5 bg-slate-100 text-slate-600 font-semibold text-xs rounded-lg whitespace-nowrap">
                    Page {historyPage} of {historyTotalPages}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date & Time</th>
                        <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Device & Browser</th>
                        <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Location (IP)</th>
                        <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {isHistoryLoading ? (
                        <tr><td colSpan={4} className="py-12 text-center text-sm text-slate-500 animate-pulse">Loading login history...</td></tr>
                      ) : loginHistory.length === 0 ? (
                        <tr><td colSpan={4} className="py-12 text-center text-sm text-slate-500">No recent login activity found.</td></tr>
                      ) : (
                        loginHistory.map((entry) => (
                          <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-4 px-4 whitespace-nowrap text-sm text-slate-600">
                              {new Date(entry.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-sm font-semibold text-slate-800">{entry.deviceType} • {entry.operatingSystem}</p>
                              <p className="text-xs text-slate-500">{entry.browser} {entry.browserVersion}</p>
                            </td>
                            <td className="py-4 px-4 text-sm text-slate-600 font-mono text-xs">
                              {entry.ipAddress || "Unknown"}
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                                entry.loginStatus === "Success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                              }`}>
                                {entry.loginStatus}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
                  <button
                    onClick={() => setHistoryPage((prev) => Math.max(prev - 1, 1))}
                    disabled={historyPage === 1 || isHistoryLoading}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 transition-all shadow-sm"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setHistoryPage((prev) => historyTotalPages > 0 ? Math.min(prev + 1, historyTotalPages) : prev)}
                    disabled={historyPage >= historyTotalPages || isHistoryLoading}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 transition-all shadow-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {activeTab === "billing" && (
              <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">Billing & Invoices</h3>
                    <p className="text-sm text-slate-500">View your subscription plans and payment receipts.</p>
                  </div>
                  <div className="px-3 py-1.5 bg-slate-100 text-slate-600 font-semibold text-xs rounded-lg whitespace-nowrap">
                    Page {paymentPage} of {paymentTotalPages}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Invoice / Date</th>
                        <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Plan</th>
                        <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                        <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {isPaymentLoading ? (
                        <tr><td colSpan={4} className="py-12 text-center text-sm text-slate-500 animate-pulse">Loading billing history...</td></tr>
                      ) : paymentHistory.length === 0 ? (
                        <tr><td colSpan={4} className="py-12 text-center text-sm text-slate-500">No payment history available yet.</td></tr>
                      ) : (
                        paymentHistory.map((entry) => (
                          <tr key={entry._id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-4 px-4">
                              <p className="text-sm font-semibold text-slate-800 font-mono text-xs">{entry.invoiceNumber}</p>
                              <p className="text-xs text-slate-500">{new Date(entry.paidAt || Date.now()).toLocaleDateString([], { dateStyle: 'medium' })}</p>
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap text-sm font-bold text-slate-700 capitalize">
                              {entry.plan} Plan
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap text-sm font-bold text-slate-900">
                              ₹{entry.amount}
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                                entry.transactionStatus === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                              }`}>
                                {entry.transactionStatus === "success" ? "Paid" : "Failed"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
                  <button
                    onClick={() => setPaymentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={paymentPage === 1 || isPaymentLoading}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 transition-all shadow-sm"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPaymentPage((prev) => paymentTotalPages > 0 ? Math.min(prev + 1, paymentTotalPages) : prev)}
                    disabled={paymentPage >= paymentTotalPages || isPaymentLoading}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 transition-all shadow-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Settings className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Preferences</h3>
                <p className="text-slate-500 max-w-sm mx-auto">Notification and account preferences will be available in the next update.</p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
