import { login, selectuser } from "@/Feature/Userslice";
import { 
  ExternalLink, Mail, User, Camera, Shield, CreditCard, Activity, Users, Settings, 
  ChevronRight, Bookmark, FileText, Crown, CheckCircle2, Clock, CheckSquare, PlusCircle
} from "lucide-react";
import Link from "next/link";
import React, { useRef, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { updateProfile } from "firebase/auth";
import { auth } from "@/firebase/firebase";
import { useTranslation } from "react-i18next";
import { getApiBaseUrl, getAuthHeaders } from "@/lib/api";
import { useRouter } from "next/router";

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
  const router = useRouter();
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

  const [userApps, setUserApps] = useState<any[]>([]);
  const [savedInternshipsCount, setSavedInternshipsCount] = useState(0);
  const [savedJobsCount, setSavedJobsCount] = useState(0);
  const [currentSub, setCurrentSub] = useState<any>(null);

  const apiBaseUrl = getApiBaseUrl();

  useEffect(() => {
    if (router.query.tab) {
      setActiveTab(router.query.tab as string);
    }
  }, [router.query.tab]);

  useEffect(() => {
    if (user?.email) {
      axios.get(`${apiBaseUrl}/api/resume/${user.email}`)
        .then(res => setResumeData(res.data))
        .catch(() => console.log("No premium resume found."));
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
    if (user?.email) {
      axios.get(`${apiBaseUrl}/api/application`)
        .then(res => {
          const myApps = res.data.filter((app: any) => app.user?.name === user?.name || app.user?.email === user?.email);
          setUserApps(myApps);
        }).catch(err => console.log(err));
    }
  }, [user, apiBaseUrl]);

  useEffect(() => {
    const saved = localStorage.getItem("saved_opportunities");
    if (saved) {
      const ids = JSON.parse(saved);
      Promise.all([
        axios.get(`${apiBaseUrl}/api/internship`).catch(() => ({ data: [] })),
        axios.get(`${apiBaseUrl}/api/job`).catch(() => ({ data: [] }))
      ]).then(([intRes, jobRes]) => {
        const intIds = intRes.data.map((i: any) => i._id);
        const jobIds = jobRes.data.map((j: any) => j._id);
        setSavedInternshipsCount(ids.filter((id: string) => intIds.includes(id)).length);
        setSavedJobsCount(ids.filter((id: string) => jobIds.includes(id)).length);
      }).catch(() => {
        setSavedInternshipsCount(ids.length);
      });
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    const headers = getAuthHeaders();
    if (!headers.Authorization) return;
    axios.get(`${apiBaseUrl}/api/subscription/current`, { headers })
      .then(res => setCurrentSub(res.data))
      .catch(() => setCurrentSub(null));
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

  const calculateCompletion = () => {
    let score = 20; // base for email registration
    if (user?.name) score += 20;
    if (user?.photo && !user.photo.includes("flaticon")) score += 20;
    if (resumeData) score += 20;
    if (userApps.length > 0) score += 20;
    return Math.min(score, 100);
  };

  const profileCompletion = calculateCompletion();

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans">
      
      {/* Premium Header Banner */}
      <div className="h-64 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05]"></div>
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center pt-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">My Profile Dashboard</h1>
          <p className="text-slate-400 max-w-xl font-medium">Track your application stats, saved bookmarks, subscription billing, and security history.</p>
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
                
                {/* Metric Summary Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Applications card */}
                  <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex items-center gap-5 hover:border-blue-200 transition-colors">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Activity size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Applications</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900">{userApps.length}</span>
                        <Link href="/userapplication" className="text-xs font-bold text-blue-600 hover:underline">Track</Link>
                      </div>
                    </div>
                  </div>

                  {/* Saved Internships card */}
                  <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex items-center gap-5 hover:border-amber-200 transition-colors">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Bookmark size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Saved Internships</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900">{savedInternshipsCount}</span>
                        <Link href="/saved-internships" className="text-xs font-bold text-amber-600 hover:underline">View</Link>
                      </div>
                    </div>
                  </div>

                  {/* Saved Jobs card */}
                  <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex items-center gap-5 hover:border-indigo-200 transition-colors">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Bookmark size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Saved Jobs</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900">{savedJobsCount}</span>
                        <Link href="/saved-jobs" className="text-xs font-bold text-indigo-600 hover:underline">View</Link>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Second row overview info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Subscription and Resume status */}
                  <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 space-y-6">
                    <h3 className="text-lg font-bold text-slate-900 border-b pb-4">Subscription & Services</h3>
                    
                    {/* Subscription info */}
                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border">
                      <div className="flex items-center gap-3">
                        <Crown className="text-amber-500 fill-amber-500/20" size={24} />
                        <div>
                          <p className="text-sm font-extrabold text-slate-950 capitalize">{currentSub?.plan || 'Free'} Plan</p>
                          <p className="text-xs text-slate-500">Usage: {currentSub?.applicationsUsed || 0} / {currentSub?.applicationLimit === -1 ? 'Unlimited' : currentSub?.applicationLimit || 1}</p>
                        </div>
                      </div>
                      <Link href="/subscription" className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow transition-colors">Upgrade</Link>
                    </div>

                    {/* Resume info */}
                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border">
                      <div className="flex items-center gap-3">
                        <FileText className="text-blue-600" size={24} />
                        <div>
                          <p className="text-sm font-extrabold text-slate-950">Premium ATS Resume</p>
                          <p className="text-xs text-slate-500">Status: {resumeData?.isPaid ? "Generated successfully" : "Not generated yet"}</p>
                        </div>
                      </div>
                      <Link href="/resume" className="text-xs font-bold bg-slate-800 hover:bg-slate-950 text-white px-4 py-2 rounded-xl shadow transition-colors">
                        {resumeData?.isPaid ? "Download" : "Create"}
                      </Link>
                    </div>
                  </div>

                  {/* Profile Completion and Community info */}
                  <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 space-y-6">
                    <h3 className="text-lg font-bold text-slate-900 border-b pb-4">Account Status</h3>
                    
                    {/* Completion bar */}
                    <div>
                      <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
                        <span>Profile Completion</span>
                        <span className="text-blue-600">{profileCompletion}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${profileCompletion}%` }}></div>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2 font-medium">Complete your profile to stand out to recruiters.</p>
                    </div>

                    {/* Community activity */}
                    <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border">
                      <div className="flex items-center gap-3">
                        <Users className="text-emerald-600" size={24} />
                        <div>
                          <p className="text-sm font-extrabold text-slate-950">Community Friends</p>
                          <p className="text-xs text-slate-500">{friendCount} active connections</p>
                        </div>
                      </div>
                      <Link href="/community" className="text-xs font-bold text-emerald-600 hover:underline">Open Forum</Link>
                    </div>

                  </div>

                </div>

                {/* Recent Activity Timeline */}
                <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8">
                  <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Activity Timeline</h3>
                  <div className="relative border-l-2 border-slate-100 pl-6 space-y-6 ml-2">
                    
                    <div className="relative">
                      <span className="absolute -left-9 top-1.5 w-6.5 h-6.5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center border border-white">
                        <Clock size={12} />
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">Signed into Dashboard</h4>
                      <p className="text-xs text-slate-400">Today</p>
                    </div>

                    {userApps.map((app, index) => (
                      <div key={app._id || index} className="relative">
                        <span className="absolute -left-9 top-1.5 w-6.5 h-6.5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center border border-white">
                          <CheckSquare size={12} />
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">Applied to {app.company}</h4>
                        <p className="text-xs text-slate-500 mb-1">Role: {app.category} • Status: <span className="capitalize font-semibold text-slate-600">{app.status}</span></p>
                        <p className="text-[10px] text-slate-400">{new Date(app.createdAt || Date.now()).toLocaleDateString()}</p>
                      </div>
                    ))}

                    {userApps.length === 0 && (
                      <div className="relative text-slate-400 text-sm italic">
                        No recent submission activities found. Explore and apply to internships today!
                      </div>
                    )}

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
