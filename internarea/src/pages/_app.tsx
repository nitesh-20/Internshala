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
import { clearStoredAuth, getStoredAuth } from "@/lib/authStorage";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
export default function App({ Component, pageProps }: AppProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function AuthListener() {
    const dispatch = useDispatch();

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
          dispatch(
            login({
              uid: authuser.uid,
              photo: authuser.photoURL,
              name: authuser.displayName,
              email: authuser.email,
              phoneNumber: authuser.phoneNumber,
              authProvider: "google",
            })
          );
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
    }, [dispatch]);
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
