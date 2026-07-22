import React, { useState } from "react";
import logo from "../Assets/logo.png";
import Link from "next/link";
import { auth, provider, firebaseInitError } from "../firebase/firebase";
import { ChevronDown, Search, Globe, UserRound, Crown, Bell, LogOut, Bookmark, FileText, CreditCard, User, Menu } from "lucide-react";
import { signInWithPopup, signOut } from "firebase/auth";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { login, logout, selectuser } from "@/Feature/Userslice";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { clearStoredAuth, setStoredAuth } from "@/lib/authStorage";
import LoginOtpModal from "@/Components/LoginOtpModal";

interface User {
  name: string;
  email: string;
  photo: string;
}

const Navbar = () => {
  const user = useSelector(selectuser);
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showPersonalMenu, setShowPersonalMenu] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [pendingLang, setPendingLang] = useState("");
  const [showLoginOtpModal, setShowLoginOtpModal] = useState(false);
  const [loginOtp, setLoginOtp] = useState("");
  const [loginPendingToken, setLoginPendingToken] = useState("");
  const [loginPendingUser, setLoginPendingUser] = useState<any>(null);
  const [loginResendTimer, setLoginResendTimer] = useState(0);
  const [loginExpireTimer, setLoginExpireTimer] = useState(300);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginOtpLoading, setIsLoginOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [expireTimer, setExpireTimer] = useState(300);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://backend-tau-snowy-58.vercel.app";

  // Timers Effect
  React.useEffect(() => {
    let interval: any;
    if (showOtpModal) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
        setExpireTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showOtpModal]);

  React.useEffect(() => {
    let interval: any;
    if (showLoginOtpModal) {
      interval = setInterval(() => {
        setLoginResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
        setLoginExpireTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showLoginOtpModal]);

  const requestOtp = async (email: string, languageCode: string) => {
    setIsLoading(true);
    try {
      const res = await axios.post(`${apiBaseUrl}/api/language/request-otp`, { email, languageCode });
      toast.success(res.data.message || "OTP sent successfully!");
      if (res.data.previewUrl) {
        console.log("=========================================");
        console.log("📬 View your OTP Email here:");
        console.log(res.data.previewUrl);
        console.log("=========================================");
        toast.info("Check your browser console for the Email Link!");
      }
      setResendTimer(60);
      setExpireTimer(300);
      setShowOtpModal(true);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handlelogin = async () => {
    if (!auth) {
      toast.error(
        firebaseInitError?.message || "Firebase auth is not configured correctly."
      );
      return;
    }

    try {
      const res = await signInWithPopup(auth, provider);
      try {
        const syncRes = await axios.post(`${apiBaseUrl}/api/auth/google-sync`, {
          name: res.user.displayName,
          email: res.user.email,
          photo: res.user.photoURL,
          phoneNumber: res.user.phoneNumber,
        });
        if (syncRes.data.requiresOtp) {
          setLoginPendingToken(syncRes.data.pendingToken);
          setLoginPendingUser({
            uid: res.user.uid,
            email: res.user.email || "",
            name: res.user.displayName || "",
            photo: res.user.photoURL || "",
            phoneNumber: res.user.phoneNumber || "",
            authProvider: "google",
            id: syncRes.data.user?.id,
          });
          setLoginOtp("");
          setLoginResendTimer(syncRes.data.resendAfterSeconds || 60);
          setLoginExpireTimer(syncRes.data.expiresInSeconds || 300);
          setShowLoginOtpModal(true);
          toast.info(syncRes.data.message || "OTP sent to your registered email.");
          return;
        }
        const authUser = {
          uid: res.user.uid,
          id: syncRes.data.user?.id,
          photo: res.user.photoURL || "",
          name: res.user.displayName || "",
          email: res.user.email || "",
          phoneNumber: res.user.phoneNumber || "",
          authProvider: "google",
          token: syncRes.data.token,
        };
        setStoredAuth(authUser);
        dispatch(login(authUser));
      } catch (syncError: any) {
        console.error("Google user sync failed:", syncError);
        await signOut(auth);
        clearStoredAuth();
        dispatch(logout());
        toast.error(
          syncError.response?.data?.error || "Login failed while securing your account."
        );
        return;
      }
      toast.success("logged in successfully");
    } catch (error: any) {
      console.error(error);
      toast.error("Login failed: " + (error.code || error.message));
    }
  };

  const verifyLoginOtp = async () => {
    if (loginOtp.length !== 6 || !loginPendingToken) return;

    try {
      setIsLoginOtpLoading(true);
      const res = await axios.post(`${apiBaseUrl}/api/auth/login-otp/verify`, {
        pendingToken: loginPendingToken,
        otp: loginOtp,
      });

      const authUser = {
        ...loginPendingUser,
        ...res.data.user,
        token: res.data.token,
        authProvider: "google",
      };

      setStoredAuth(authUser);
      dispatch(login(authUser));
      setShowLoginOtpModal(false);
      setLoginPendingToken("");
      setLoginPendingUser(null);
      setLoginOtp("");
      toast.success("Logged in successfully.");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to verify login OTP.");
    } finally {
      setIsLoginOtpLoading(false);
    }
  };

  const resendLoginOtp = async () => {
    if (!loginPendingToken) return;

    try {
      setIsLoginOtpLoading(true);
      const res = await axios.post(`${apiBaseUrl}/api/auth/login-otp/send`, {
        pendingToken: loginPendingToken,
      });
      setLoginResendTimer(res.data.resendAfterSeconds || 60);
      setLoginExpireTimer(res.data.expiresInSeconds || 300);
      toast.success(res.data.message || "OTP sent to your registered email.");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to resend login OTP.");
    } finally {
      setIsLoginOtpLoading(false);
    }
  };

  const handlelogout = () => {
    if (!auth) {
      clearStoredAuth();
      dispatch(logout());
      return;
    }

    signOut(auth);
    clearStoredAuth();
    dispatch(logout());
    toast.success("logged out");
  };

  const handleLanguageChange = async (lang: string) => {
    if (i18n.language === lang) {
      setShowLangMenu(false);
      return;
    }
    if (!user) {
      toast.error("Please login first to switch languages (requires email verification)");
      return;
    }
    try {
      toast.info("Requesting OTP...");
      setPendingLang(lang);
      setShowLangMenu(false);
      await requestOtp(user.email, lang);
    } catch (error) {
      console.error(error);
    }
  };

  const verifyOtpAndSwitch = async () => {
    if (!otp) return;
    setIsLoading(true);
    try {
      await axios.post(`${apiBaseUrl}/api/language/verify-otp`, { email: user?.email, otp, languageCode: pendingLang });
      i18n.changeLanguage(pendingLang);
      setShowOtpModal(false);
      setOtp("");
      toast.success("Language changed successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Invalid or expired OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="relative">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <a href="/" className="flex items-center gap-2 group">
                <span className="text-2xl font-extrabold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                  Intern<span className="text-blue-600">Area</span>
                </span>
              </a>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center space-x-1">
              <Link href={"/internship"} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                {t("internships")}
              </Link>
              <Link href={"/job"} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                {t("jobs")}
              </Link>
              <Link href={"/resume"} className="px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50/50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all flex items-center gap-1.5">
                Resume Builder <span className="text-base">✨</span>
              </Link>
              <Link href={"/subscription"} className="px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all flex items-center gap-1.5 ml-2">
                Premium <Crown size={16} className="text-emerald-500" />
              </Link>
              <Link href={"/community"} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all ml-2">
                Community
              </Link>
              
              {/* Search Bar */}
              <div className="ml-4 flex items-center bg-slate-100 hover:bg-slate-200/80 transition-colors rounded-full px-4 py-2 border border-transparent focus-within:border-blue-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10">
                <Search size={18} className="text-slate-400" />
                <input
                  type="text"
                  placeholder={t("search_opportunities")}
                  className="ml-2 bg-transparent border-none focus:outline-none text-sm w-48 text-slate-700 placeholder-slate-400"
                />
              </div>
            </div>

            {/* Desktop Auth & Language */}
            <div className="hidden lg:flex items-center space-x-3">
              {/* Language Switcher */}
              <div className="relative">
                <button 
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="flex items-center space-x-1.5 text-slate-600 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition-all border border-transparent"
                >
                  <Globe size={18} />
                  <span suppressHydrationWarning className="uppercase text-sm font-semibold">{i18n.language || 'EN'}</span>
                  <ChevronDown size={14} className={`transition-transform duration-200 ${showLangMenu ? 'rotate-180' : ''}`} />
                </button>
                {showLangMenu && (
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] py-2 border border-slate-100 z-50 overflow-hidden transform opacity-100 scale-100 transition-all origin-top-right">
                    <button onClick={() => handleLanguageChange('en')} className={`block w-full text-left px-5 py-2.5 text-sm transition-colors ${i18n.language === 'en' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>🇺🇸 English</button>
                    <button onClick={() => handleLanguageChange('es')} className={`block w-full text-left px-5 py-2.5 text-sm transition-colors ${i18n.language === 'es' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>🇪🇸 Español</button>
                    <button onClick={() => handleLanguageChange('hi')} className={`block w-full text-left px-5 py-2.5 text-sm transition-colors ${i18n.language === 'hi' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>🇮🇳 हिंदी</button>
                    <button onClick={() => handleLanguageChange('pt')} className={`block w-full text-left px-5 py-2.5 text-sm transition-colors ${i18n.language === 'pt' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>🇧🇷 Português</button>
                    <button onClick={() => handleLanguageChange('zh')} className={`block w-full text-left px-5 py-2.5 text-sm transition-colors ${i18n.language === 'zh' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>🇨🇳 中文</button>
                    <button onClick={() => handleLanguageChange('fr')} className={`block w-full text-left px-5 py-2.5 text-sm transition-colors ${i18n.language === 'fr' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>🇫🇷 Français</button>
                  </div>
                )}
              </div>

              <div className="h-6 w-px bg-slate-200 mx-2"></div>

              {user ? (
                <div className="flex items-center gap-4 relative">
                  {/* Notification Bell */}
                  <button className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-all relative">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full border-2 border-white"></span>
                  </button>

                  {/* Profile Dropdown Toggle */}
                  <div className="relative">
                    <button 
                      onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                      className="flex items-center gap-2 focus:outline-none group"
                    >
                      <div className="relative">
                        <div className="absolute inset-0 bg-blue-500 rounded-full blur opacity-25 group-hover:opacity-60 transition-opacity"></div>
                        <img
                          src={user.photo}
                          alt={user.name}
                          className="w-10 h-10 rounded-full border-2 border-white shadow-sm relative z-10 object-cover"
                        />
                      </div>
                      <ChevronDown size={14} className={`text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${showProfileDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showProfileDropdown && (
                      <div className="absolute right-0 mt-3 w-64 rounded-2xl bg-white p-2 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 z-50 origin-top-right transform transition-all duration-200">
                        {/* User Header */}
                        <div className="px-4 py-3 border-b border-slate-50">
                          <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                        
                        <div className="py-1">
                          <Link
                            href="/profile"
                            className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                            onClick={() => setShowProfileDropdown(false)}
                          >
                            <User size={16} />
                            <span>My Profile</span>
                          </Link>
                          <Link
                            href="/userapplication"
                            className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                            onClick={() => setShowProfileDropdown(false)}
                          >
                            <FileText size={16} />
                            <span>My Applications</span>
                          </Link>
                          <Link
                            href="/saved-internships"
                            className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                            onClick={() => setShowProfileDropdown(false)}
                          >
                            <Bookmark size={16} />
                            <span>Saved Internships</span>
                          </Link>
                          <Link
                            href="/saved-jobs"
                            className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                            onClick={() => setShowProfileDropdown(false)}
                          >
                            <Bookmark size={16} />
                            <span>Saved Jobs</span>
                          </Link>
                          <Link
                            href="/resume"
                            className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                            onClick={() => setShowProfileDropdown(false)}
                          >
                            <FileText size={16} />
                            <span>Resume</span>
                          </Link>
                          <Link
                            href="/subscription"
                            className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                            onClick={() => setShowProfileDropdown(false)}
                          >
                            <Crown size={16} className="text-amber-500" />
                            <span>Subscription</span>
                          </Link>
                          <Link
                            href="/profile?tab=billing"
                            className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                            onClick={() => setShowProfileDropdown(false)}
                          >
                            <CreditCard size={16} />
                            <span>Payment History</span>
                          </Link>
                        </div>
                        
                        <div className="my-1 border-t border-slate-50"></div>
                        
                        <button
                          onClick={() => {
                            setShowProfileDropdown(false);
                            handlelogout();
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <LogOut size={16} />
                          <span>Logout</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <button
                      onClick={() => setShowPersonalMenu((prev) => !prev)}
                      className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-slate-50 transition-all"
                    >
                      <UserRound size={16} />
                      <span>Log in</span>
                      <ChevronDown size={14} className={`text-slate-400 transition-transform ${showPersonalMenu ? "rotate-180" : ""}`} />
                    </button>

                    {showPersonalMenu && (
                      <div className="absolute right-0 mt-3 w-64 rounded-2xl bg-white p-2 shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-1 ring-slate-100 z-50 origin-top-right transform transition-all">
                        <Link
                          href="/login"
                          className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                          onClick={() => setShowPersonalMenu(false)}
                        >
                          Email / Phone Login
                        </Link>
                        <Link
                          href="/register"
                          className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                          onClick={() => setShowPersonalMenu(false)}
                        >
                          Create Account
                        </Link>
                        <div className="my-1 h-px bg-slate-100"></div>
                        <button
                          onClick={() => {
                            setShowPersonalMenu(false);
                            handlelogin();
                          }}
                          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                          </svg>
                          <span>{t("continue_with_google")}</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <Link href="/adminlogin" className="px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
                    {t("admin")}
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex lg:hidden items-center gap-4">
              {user && (
                <Link href={"/profile"}>
                  <img src={user.photo} alt={user.name} className="w-8 h-8 rounded-full border border-slate-200" />
                </Link>
              )}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-20 left-0 w-full bg-white border-b border-slate-200 shadow-xl py-4 px-4 flex flex-col gap-2 z-40 animate-in slide-in-from-top-4 duration-200">
            <Link href={"/internship"} onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-xl">Internships</Link>
            <Link href={"/job"} onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-xl">Jobs</Link>
            <Link href={"/resume"} onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-base font-semibold text-blue-700 bg-blue-50 rounded-xl">Resume Builder ✨</Link>
            <Link href={"/subscription"} onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-base font-semibold text-emerald-700 bg-emerald-50 rounded-xl">Premium Subscription 👑</Link>
            <Link href={"/community"} onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-xl">Community</Link>
            
            <div className="h-px bg-slate-100 my-2"></div>
            
            {!user && (
              <>
                <button onClick={() => { setIsMobileMenuOpen(false); handlelogin(); }} className="px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Login with Google
                </button>
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-xl">Email Login</Link>
                <Link href="/adminlogin" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-base font-medium text-rose-700 bg-rose-50 rounded-xl mt-2 text-center">Admin Access</Link>
              </>
            )}
            {user && (
              <button onClick={() => { setIsMobileMenuOpen(false); handlelogout(); }} className="px-4 py-3 text-base font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl text-center w-full mt-2">
                Log Out
              </button>
            )}
          </div>
        )}
      </nav>

      {/* French OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Security Verification</h2>
            <p className="text-gray-600 mb-2">Enter the OTP sent to your email to unlock the {pendingLang.toUpperCase()} language setting.</p>
            
            <div className="flex justify-between text-sm text-gray-500 mb-4">
              <span>Expires in: <span className="font-mono font-semibold text-red-500">{Math.floor(expireTimer / 60)}:{(expireTimer % 60).toString().padStart(2, '0')}</span></span>
              {resendTimer > 0 ? (
                <span>Resend in {resendTimer}s</span>
              ) : (
                <button onClick={() => user && requestOtp(user.email, pendingLang)} disabled={isLoading} className="text-blue-600 hover:underline">Resend OTP</button>
              )}
            </div>

            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              disabled={isLoading || expireTimer === 0}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all mb-4 text-center text-xl tracking-widest text-gray-900 font-bold disabled:bg-gray-100"
            />
            <div className="flex space-x-3">
              <button 
                onClick={() => {
                  setShowOtpModal(false);
                  setOtp("");
                }}
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={verifyOtpAndSwitch}
                disabled={isLoading || otp.length !== 6 || expireTimer === 0}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 flex justify-center items-center"
              >
                {isLoading ? <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span> : 'Verify & Switch'}
              </button>
            </div>
          </div>
        </div>
      )}

      <LoginOtpModal
        isOpen={showLoginOtpModal}
        otp={loginOtp}
        onOtpChange={setLoginOtp}
        onClose={() => {
          setShowLoginOtpModal(false);
          setLoginPendingToken("");
          setLoginPendingUser(null);
          setLoginOtp("");
        }}
        onVerify={verifyLoginOtp}
        onResend={resendLoginOtp}
        isLoading={isLoginOtpLoading}
        resendTimer={loginResendTimer}
        expireTimer={loginExpireTimer}
        email={loginPendingUser?.email}
      />
    </div>
  );
};

export default Navbar;
