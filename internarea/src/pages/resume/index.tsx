import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectuser } from '@/Feature/Userslice';
import { toast } from 'react-toastify';
import axios from 'axios';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const ResumeBuilder = () => {
  const user = useSelector(selectuser);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    qualifications: '',
    experience: '',
    personalInformation: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [expireTimer, setExpireTimer] = useState(0);

  React.useEffect(() => {
    let interval: any;
    if (showOtpModal) {
      interval = setInterval(() => {
        setExpireTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showOtpModal]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGenerateClick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to create a premium resume");
      return;
    }
    if (!formData.name || !formData.qualifications || !formData.experience || !formData.personalInformation) {
      toast.error("Please fill all fields");
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post("http://localhost:5001/api/language/request-otp", { 
        email: user.email, 
        purpose: 'RESUME_PAYMENT' 
      });
      toast.success(res.data.message || "OTP sent for payment verification!");
      if (res.data.previewUrl) {
        console.log("📬 View your OTP Email here:", res.data.previewUrl);
      }
      setExpireTimer(300);
      setShowOtpModal(true);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtpAndPay = async () => {
    if (!otp) return;
    setIsLoading(true);
    try {
      // 1. Verify OTP
      await axios.post("http://localhost:5001/api/language/verify-otp", { 
        email: user.email, 
        otp, 
        purpose: 'RESUME_PAYMENT' 
      });
      setShowOtpModal(false);
      setOtp("");
      
      // 2. Initiate Razorpay Payment
      initiateRazorpay();

    } catch (error: any) {
      toast.error(error.response?.data?.error || "Invalid OTP");
      setIsLoading(false);
    }
  };

  const initiateRazorpay = async () => {
    try {
      // Create order
      const orderRes = await axios.post("http://localhost:5001/api/resume/create-order", { email: user.email });
      const order = orderRes.data;

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_dummy_key_id', 
        amount: order.amount,
        currency: order.currency,
        name: "Internshala Premium",
        description: "Premium Resume Generation",
        order_id: order.id,
        handler: async function (response: any) {
          toast.info("Payment successful, generating resume...");
          try {
            const verifyRes = await axios.post("http://localhost:5001/api/resume/verify-and-generate", {
              email: user.email,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              resumeData: formData
            });
            toast.success("Resume generated successfully!");
            window.location.href = "/profile"; // Redirect to profile to see the resume
          } catch (err: any) {
            toast.error("Failed to generate resume after payment.");
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: "#2563EB"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        toast.error("Payment failed. " + response.error.description);
      });
      rzp.open();

    } catch (error) {
      toast.error("Failed to initiate payment");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Load Razorpay Script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>

      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-blue-600 px-8 py-6 text-white text-center">
          <h1 className="text-3xl font-bold">Premium Resume Builder</h1>
          <p className="mt-2 text-blue-100">Create a professional resume for just ₹50 and stand out to recruiters.</p>
        </div>

        <form onSubmit={handleGenerateClick} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input 
              type="text" 
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="e.g. John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Personal Information (Email, Phone, LinkedIn, etc.)</label>
            <textarea 
              name="personalInformation"
              value={formData.personalInformation}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="e.g. Email: john@example.com, Phone: +91-9876543210"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Educational Qualifications</label>
            <textarea 
              name="qualifications"
              value={formData.qualifications}
              onChange={handleChange}
              rows={4}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="e.g. B.Tech in Computer Science from XYZ University (2020-2024)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Work Experience & Projects</label>
            <textarea 
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              rows={4}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="e.g. Frontend Developer Intern at TechCorp (3 months)"
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
          >
            {isLoading ? 'Processing...' : 'Pay ₹50 & Generate Premium Resume'}
          </button>
        </form>
      </div>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Security Verification</h2>
            <p className="text-gray-600 mb-2">Enter the OTP sent to your email to securely proceed with the payment.</p>
            
            <div className="flex justify-between text-sm text-gray-500 mb-4">
              <span>Expires in: <span className="font-mono font-semibold text-red-500">{Math.floor(expireTimer / 60)}:{(expireTimer % 60).toString().padStart(2, '0')}</span></span>
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
                onClick={verifyOtpAndPay}
                disabled={isLoading || otp.length !== 6 || expireTimer === 0}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 flex justify-center items-center"
              >
                {isLoading ? <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span> : 'Verify & Pay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeBuilder;
