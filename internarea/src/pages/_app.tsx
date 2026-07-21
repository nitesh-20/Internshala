import Footer from "@/Components/Fotter";
import Navbar from "@/Components/Navbar";
import "@/styles/globals.css";
import "../i18n";
import type { AppProps } from "next/app";
import { store } from "../store/store";
import { Provider, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { auth } from "@/firebase/firebase";
import { login, logout } from "@/Feature/Userslice";
import { clearStoredAuth, getStoredAuth, setStoredAuth } from "@/lib/authStorage";
import { getApiBaseUrl } from "@/lib/api";
import axios from "axios";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
export default function App({ Component, pageProps }: AppProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function AuthListener() {
    const dispatch = useDispatch();
    const apiBaseUrl = getApiBaseUrl();

    useEffect(() => {
      const storedUser = getStoredAuth();
      if (storedUser && storedUser.authProvider === "local") {
        dispatch(login(storedUser));
      }

      if (!auth) {
        if (!storedUser) {
          dispatch(logout());
        }
        return;
      }

      const unsubscribe = auth.onAuthStateChanged(async (authuser) => {
        if (authuser) {
          const fallbackGoogleUser = {
            uid: authuser.uid,
            photo: authuser.photoURL || "",
            name: authuser.displayName || "",
            email: authuser.email || "",
            phoneNumber: authuser.phoneNumber || "",
            authProvider: "google",
          };

          try {
            const syncRes = await axios.post(`${apiBaseUrl}/api/auth/google-sync`, {
              name: authuser.displayName,
              email: authuser.email,
              photo: authuser.photoURL,
              phoneNumber: authuser.phoneNumber,
            });

            const syncedGoogleUser = {
              ...fallbackGoogleUser,
              id: syncRes.data.user?.id,
              token: syncRes.data.token,
            };

            setStoredAuth(syncedGoogleUser);
            dispatch(login(syncedGoogleUser));
          } catch (error) {
            console.error("Failed to sync persisted Google auth:", error);
            setStoredAuth(fallbackGoogleUser);
            dispatch(login(fallbackGoogleUser));
          }
        } else {
          const latestStoredUser = getStoredAuth();
          if (latestStoredUser?.authProvider === "local") {
            dispatch(login(latestStoredUser));
          } else {
            clearStoredAuth();
            dispatch(logout());
          }
        }
      });

      return unsubscribe;
    }, [apiBaseUrl, dispatch]);
    return null;
  }

  return (
    <Provider store={store}>
      <AuthListener />
      {mounted ? (
        <div className="bg-white">
          <ToastContainer/>
          <Navbar />
          <Component {...pageProps} />
          <Footer />
        </div>
      ) : null}
    </Provider>
  );
}
