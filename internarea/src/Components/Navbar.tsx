import React, { useState } from "react";
import logo from "../Assets/logo.png";
import Link from "next/link";
import { auth, provider } from "../firebase/firebase";
import { ChevronDown, Search, Globe } from "lucide-react";
import { signInWithPopup, signOut } from "firebase/auth";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { login, logout, selectuser } from "@/Feature/Userslice";
import { useTranslation } from "react-i18next";
import axios from "axios";

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
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [pendingLang, setPendingLang] = useState("");

  const handlelogin = async () => {
    try {
      const res = await signInWithPopup(auth, provider);
      dispatch(
        login({
          uid: res.user.uid,
          photo: res.user.photoURL,
          name: res.user.displayName,
          email: res.user.email,
          phoneNumber: res.user.phoneNumber,
        })
      );
      toast.success("logged in successfully");
    } catch (error: any) {
      console.error(error);
      toast.error("Login failed: " + (error.code || error.message));
    }
  };

  const handlelogout = () => {
    signOut(auth);
    dispatch(logout());
    toast.success("logged out");
  };

  const handleLanguageChange = async (lang: string) => {
    if (lang === "fr") {
      if (!user) {
        toast.error("Please login first to switch to French (requires email verification)");
        return;
      }
      try {
        toast.info("Sending OTP to your email...");
        await axios.post("http://localhost:5001/api/language/request-otp", { email: user.email });
        setPendingLang(lang);
        setShowOtpModal(true);
        setShowLangMenu(false);
      } catch (error) {
        toast.error("Failed to send OTP");
      }
    } else {
      i18n.changeLanguage(lang);
      setShowLangMenu(false);
    }
  };

  const verifyOtpAndSwitch = async () => {
    try {
      await axios.post("http://localhost:5001/api/language/verify-otp", { email: user?.email, otp });
      i18n.changeLanguage(pendingLang);
      setShowOtpModal(false);
      toast.success("Language changed successfully!");
    } catch (error) {
      toast.error("Invalid or expired OTP");
    }
  };

  return (
    <div className="relative">
      <nav className="bg-white shadow-md relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <div className="flex-shrink-0">
              <a href="/" className="text-xl font-bold text-blue-600">
                <img src={"/logo.png"} alt="" className="h-16" />
              </a>
            </div>
            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <button className="flex items-center space-x-1 text-gray-700 hover:text-blue-600">
                <Link href={"/internship"}>
                  <span>{t("internships")}</span>
                </Link>
              </button>
              <button className="flex items-center space-x-1 text-gray-700 hover:text-blue-600">
                <Link href={"/job"}>
                  <span>{t("jobs")}</span>
                </Link>
              </button>
              <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
                <Search size={16} className="text-gray-400" />
                <input
                  type="text"
                  placeholder={t("search_opportunities")}
                  className="ml-2 bg-transparent focus:outline-none text-sm w-48"
                />
              </div>
            </div>

            {/* Auth & Language */}
            <div className="flex items-center space-x-4">
              {/* Language Switcher */}
              <div className="relative">
                <button 
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md transition-colors"
                >
                  <Globe size={20} />
                  <span suppressHydrationWarning className="uppercase text-sm font-medium">{i18n.language || 'EN'}</span>
                  <ChevronDown size={16} className={`transition-transform duration-200 ${showLangMenu ? 'rotate-180' : ''}`} />
                </button>
                {showLangMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-2 border border-gray-100 z-50">
                    <button onClick={() => handleLanguageChange('en')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">English</button>
                    <button onClick={() => handleLanguageChange('es')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">Español</button>
                    <button onClick={() => handleLanguageChange('hi')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">हिंदी</button>
                    <button onClick={() => handleLanguageChange('pt')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">Português</button>
                    <button onClick={() => handleLanguageChange('zh')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">中文</button>
                    <button onClick={() => handleLanguageChange('fr')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-semibold text-blue-600">Français (Secure)</button>
                  </div>
                )}
              </div>

              {user ? (
                <div className="relative flex">
                  <button className="flex items-center space-x-2">
                    <Link href={"/profile"}>
                      <img
                        src={user.photo}
                        alt=""
                        className="w-8 h-8 rounded-full border-2 border-blue-100"
                      />
                    </Link>
                  </button>
                  <button
                    className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors font-medium ml-2"
                    onClick={handlelogout}
                  >
                    {t("logout")}
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={handlelogin}
                    className="w-full bg-white border border-gray-300 shadow-sm rounded-lg px-4 py-2 flex items-center justify-center space-x-2 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span className="text-gray-700 font-medium">{t("continue_with_google")}</span>
                  </button>
                  <a href="/adminlogin" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">
                    {t("admin")}
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* French OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Security Verification</h2>
            <p className="text-gray-600 mb-6">Enter the OTP sent to your email to unlock the French language setting.</p>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit OTP"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all mb-4 text-center text-xl tracking-widest"
            />
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowOtpModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={verifyOtpAndSwitch}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
              >
                Verify & Switch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
