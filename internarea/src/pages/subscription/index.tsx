import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectuser } from '@/Feature/Userslice';
import { toast } from 'react-toastify';
import axios from 'axios';
import Script from 'next/script';
import { CheckCircle2, Crown, Zap, Shield, Loader2 } from 'lucide-react';
import { useRouter } from 'next/router';
import { getAuthHeaders } from '@/lib/api';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const SubscriptionPage = () => {
  const user = useSelector(selectuser);
  const router = useRouter();
  
  const [plans, setPlans] = useState<any>(null);
  const [currentSub, setCurrentSub] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [isRazorpayReady, setIsRazorpayReady] = useState(false);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://backend-tau-snowy-58.vercel.app';
  const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

  useEffect(() => {
    if (user) {
      fetchSubscriptionData();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchSubscriptionData = async () => {
    try {
      setIsLoading(true);
      const [plansRes, currentRes] = await Promise.all([
        axios.get(`${apiBaseUrl}/api/subscription/plans`),
        axios.get(`${apiBaseUrl}/api/subscription/current`, { headers: getAuthHeaders() })
      ]);
      setPlans(plansRes.data);
      setCurrentSub(currentRes.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load subscription details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgradeClick = async (planName: string) => {
    if (!user) {
      toast.info("Please login to subscribe");
      return router.push("/");
    }

    if (planName === "Free") return;

    if (!isRazorpayReady || !window.Razorpay) {
      if (typeof window !== "undefined" && window.Razorpay) {
        setIsRazorpayReady(true);
      } else {
        toast.error("Payment gateway is loading. Please try again.");
        return;
      }
    }

    setIsCheckoutLoading(true);
    try {
      // 1. Create Order
      const orderRes = await axios.post(`${apiBaseUrl}/api/subscription/create-order`, { plan: planName }, { headers: getAuthHeaders() });
      const order = orderRes.data;

      // 2. Open Razorpay
      const options = {
        key: razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: "InternArea Subscription",
        description: `${planName} Plan`,
        order_id: order.id,
        handler: async function (response: any) {
          toast.info("Verifying payment...");
          try {
            const verifyRes = await axios.post(`${apiBaseUrl}/api/subscription/verify-payment`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: planName
            }, { headers: getAuthHeaders() });
            
            toast.success("Subscription upgraded successfully! Invoice sent to your email.");
            setCurrentSub(verifyRes.data.subscription);
          } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to verify payment");
          } finally {
            setIsCheckoutLoading(false);
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        modal: {
          ondismiss: function () {
            setIsCheckoutLoading(false);
            toast.info("Payment cancelled.");
          }
        },
        theme: { color: "#2563EB" }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setIsCheckoutLoading(false);
        toast.error(response.error?.description || "Payment failed.");
      });
      rzp.open();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to initiate payment");
      setIsCheckoutLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  const getPlanIcon = (name: string) => {
    switch(name) {
      case 'Gold': return <Crown className="w-8 h-8 text-yellow-500 mb-4" />;
      case 'Silver': return <Zap className="w-8 h-8 text-gray-400 mb-4" />;
      case 'Bronze': return <Shield className="w-8 h-8 text-orange-600 mb-4" />;
      default: return <CheckCircle2 className="w-8 h-8 text-blue-500 mb-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setIsRazorpayReady(true)}
      />

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Choose Your Subscription Plan
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Unlock more internship opportunities. Upgrade your plan today.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans && Object.entries(plans).map(([name, details]: any) => {
            const isCurrent = currentSub?.plan === name;
            return (
              <div key={name} className={`relative bg-white rounded-2xl shadow-xl overflow-hidden border-2 ${isCurrent ? 'border-blue-600 scale-105' : 'border-transparent hover:border-gray-200'} transition-all duration-300 flex flex-col`}>
                {isCurrent && (
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    CURRENT PLAN
                  </div>
                )}
                
                <div className="p-8 flex-1">
                  {getPlanIcon(name)}
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{name}</h3>
                  <div className="flex items-baseline mb-6">
                    <span className="text-4xl font-extrabold text-gray-900">₹{details.price}</span>
                    <span className="text-gray-500 ml-2">/ month</span>
                  </div>
                  
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center text-gray-600">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 shrink-0" />
                      <span>{details.limit === -1 ? 'Unlimited' : details.limit} Internship Applications per month</span>
                    </li>
                    <li className="flex items-center text-gray-600">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 shrink-0" />
                      <span>Valid for 30 Days</span>
                    </li>
                  </ul>
                </div>
                
                <div className="p-8 bg-gray-50 mt-auto">
                  <button
                    onClick={() => handleUpgradeClick(name)}
                    disabled={isCurrent || name === "Free" || isCheckoutLoading}
                    className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-colors ${
                      isCurrent 
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                        : name === 'Free' 
                          ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                    }`}
                  >
                    {isCheckoutLoading ? 'Processing...' : isCurrent ? 'Active' : name === 'Free' ? 'Free Default' : 'Upgrade Now'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
