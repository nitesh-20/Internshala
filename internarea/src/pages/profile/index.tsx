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

const index = () => {
  const { t } = useTranslation();
  const user = useSelector(selectuser);
  const dispatch = useDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [resumeData, setResumeData] = useState<any>(null);
  const [friendCount, setFriendCount] = useState(0);
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default index;
