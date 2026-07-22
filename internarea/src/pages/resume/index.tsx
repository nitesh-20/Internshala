import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectuser } from '@/Feature/Userslice';
import { toast } from 'react-toastify';
import axios from 'axios';
import Script from 'next/script';
import { CheckCircle2, ChevronRight, Save, Shield, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

declare global {
  interface Window {
    Razorpay: any;
  }
}

// Initial state structures
const initialPersonalInfo = { fullName: '', email: '', phone: '', dob: '', gender: '', address: '', city: '', state: '', country: '', pincode: '' };
const initialEducation = { degree: '', college: '', branch: '', startYear: '', endYear: '', score: '' };
const initialExperience = { company: '', role: '', startDate: '', endDate: '', description: '' };
const initialProject = { name: '', technologies: '', description: '', githubLink: '', liveLink: '' };
const initialCertification = { name: '', organization: '', issueDate: '', credentialLink: '' };
const initialSocial = { linkedin: '', github: '', portfolio: '', website: '' };

const ResumeBuilder = () => {
  const { t } = useTranslation();
  const user = useSelector(selectuser);
  
  // States for each section
  const [step, setStep] = useState(1);
  const [personalInfo, setPersonalInfo] = useState(initialPersonalInfo);
  const [summary, setSummary] = useState('');
  const [education, setEducation] = useState([initialEducation]);
  const [experience, setExperience] = useState([initialExperience]);
  const [projects, setProjects] = useState([initialProject]);
  const [certifications, setCertifications] = useState([initialCertification]);
  const [skills, setSkills] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [socialLinks, setSocialLinks] = useState(initialSocial);

  // General States
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [expireTimer, setExpireTimer] = useState(0);
  const [isPaid, setIsPaid] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [isRazorpayReady, setIsRazorpayReady] = useState(false);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://backend-tau-snowy-58.vercel.app';
  const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_TG92FmvyzHyuq1';

  const steps = [
    { id: 1, name: t('resume_builder.steps.personal') },
    { id: 2, name: t('resume_builder.steps.summary') },
    { id: 3, name: t('resume_builder.steps.education') },
    { id: 4, name: t('resume_builder.steps.experience') },
    { id: 5, name: t('resume_builder.steps.projects') },
    { id: 6, name: t('resume_builder.steps.skills_and_more') },
    { id: 7, name: t('resume_builder.steps.review_and_pay') }
  ];

  useEffect(() => {
    if (user?.email) {
      setPersonalInfo(prev => ({ ...prev, email: user.email, fullName: user.name || '' }));
      fetchDraft();
    }
  }, [user]);

  useEffect(() => {
    let interval: any;
    if (showOtpModal) {
      interval = setInterval(() => {
        setExpireTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showOtpModal]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      setIsRazorpayReady(true);
    }
  }, []);

  const fetchDraft = async () => {
    try {
      const res = await axios.get(`${apiBaseUrl}/api/resume/${user.email}`);
      const data = res.data;
      if (data) {
        if (data.personalInfo) setPersonalInfo(data.personalInfo);
        if (data.summary) setSummary(data.summary);
        if (data.education?.length) setEducation(data.education);
        if (data.experience?.length) setExperience(data.experience);
        if (data.projects?.length) setProjects(data.projects);
        if (data.certifications?.length) setCertifications(data.certifications);
        if (data.skills?.length) setSkills(data.skills);
        if (data.languages?.length) setLanguages(data.languages);
        if (data.achievements?.length) setAchievements(data.achievements);
        if (data.socialLinks) setSocialLinks(data.socialLinks);
        if (data.isPaid) {
          setIsPaid(true);
          setPdfUrl(data.pdfUrl);
        }
      }
    } catch (error) {
      // No draft found, ignore
    }
  };

  const getFullResumeData = () => {
    return {
      personalInfo, summary, education, experience, projects, certifications, skills, languages, achievements, socialLinks
    };
  };

  const saveDraft = async () => {
    if (!user) return;
    try {
      setIsSavingDraft(true);
      await axios.post(`${apiBaseUrl}/api/resume/draft`, {
        email: user.email,
        resumeData: getFullResumeData()
      });
      toast.success(t("resume_builder.draft_saved"));
    } catch (error) {
      toast.error(t("resume_builder.draft_failed"));
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleNext = () => {
    saveDraft(); // Auto save on next
    setStep(s => s + 1);
  };
  
  const handlePrev = () => setStep(s => s - 1);

  // Dynamic Handlers
  const handleArrayChange = (setter: any, index: number, field: string, value: string) => {
    setter((prev: any[]) => {
      const newArray = [...prev];
      newArray[index] = { ...newArray[index], [field]: value };
      return newArray;
    });
  };

  const addArrayItem = (setter: any, emptyItem: any) => {
    setter((prev: any[]) => [...prev, emptyItem]);
  };

  const removeArrayItem = (setter: any, index: number) => {
    setter((prev: any[]) => prev.filter((_, i) => i !== index));
  };

  const handleSimpleArrayAdd = (setter: any, value: string) => {
    if (!value.trim()) return;
    setter((prev: any[]) => [...prev, value]);
  };

  const handleGenerateClick = async () => {
    if (!user) {
      toast.error(t("resume_builder.please_login", { defaultValue: "Please login" }));
      return;
    }
    
    // Quick validation before payment
    if (!personalInfo.fullName || !personalInfo.email) {
      toast.error(t("resume_builder.validation.personal_req", { defaultValue: "Name and Email are required in Personal Info" }));
      setStep(1);
      return;
    }

    setIsLoading(true);
    try {
      await axios.post(`${apiBaseUrl}/api/resume/draft`, { email: user.email, resumeData: getFullResumeData() });
      
      const res = await axios.post(`${apiBaseUrl}/api/language/request-otp`, { 
        email: user.email, 
        purpose: 'RESUME_PAYMENT' 
      });
      toast.success(res.data.message || t("resume_builder.otp_sent_success", { defaultValue: "OTP sent for payment verification!" }));
      setExpireTimer(300);
      setShowOtpModal(true);
    } catch (error: any) {
      toast.error(error.response?.data?.error || t("resume_builder.otp_send_failed", { defaultValue: "Failed to send OTP" }));
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtpAndPay = async () => {
    if (!otp) return;
    setIsLoading(true);
    try {
      await axios.post(`${apiBaseUrl}/api/language/verify-otp`, { 
        email: user.email, otp, purpose: 'RESUME_PAYMENT' 
      });
      setShowOtpModal(false);
      setOtp("");
      await initiateRazorpay();
    } catch (error: any) {
      toast.error(error.response?.data?.error || t("resume_builder.invalid_otp", { defaultValue: "Invalid OTP" }));
      setIsLoading(false);
    }
  };

  const initiateRazorpay = async () => {
    try {
      if (!razorpayKeyId) {
        throw new Error("Razorpay public key is missing. Add NEXT_PUBLIC_RAZORPAY_KEY_ID to the frontend env file.");
      }

      if (!isRazorpayReady || !window.Razorpay) {
        if (typeof window !== "undefined" && window.Razorpay) {
          setIsRazorpayReady(true);
        } else {
          throw new Error("Razorpay checkout is still loading. Please try again in a moment.");
        }
      }

      setIsCheckoutLoading(true);
      const orderRes = await axios.post(`${apiBaseUrl}/api/resume/create-order`, { email: user.email });
      const order = orderRes.data;

      const handlerFn = async function (response: any) {
        toast.info(t("resume_builder.payment_verified_pdf", { defaultValue: "Payment verified, generating professional ATS PDF..." }));
        try {
          const verifyRes = await axios.post(`${apiBaseUrl}/api/resume/verify-and-generate`, {
            email: user.email,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            resumeData: getFullResumeData()
          });
          setIsPaid(true);
          setPdfUrl(verifyRes.data.pdfUrl);
          toast.success(t("resume_builder.generated_success", { defaultValue: "Resume generated successfully!" }));
        } catch (err: any) {
          toast.error(err.response?.data?.error || t("resume_builder.verify_failed", { defaultValue: "Failed to verify payment and generate resume." }));
        } finally {
          setIsLoading(false);
          setIsCheckoutLoading(false);
        }
      };

      const options = {
        key: razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: "Internshala Premium",
        description: "Premium Resume Generation",
        order_id: order.id,
        handler: handlerFn,
        prefill: { name: user.name, email: user.email },
        modal: {
          ondismiss: function () {
            setIsLoading(false);
            setIsCheckoutLoading(false);
            toast.info(t("resume_builder.checkout_closed", { defaultValue: "Payment checkout closed." }));
          }
        },
        theme: { color: "#2563EB" }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setIsLoading(false);
        setIsCheckoutLoading(false);
        toast.error(response.error?.description || t("resume_builder.payment_failed_toast", { defaultValue: "Payment failed." }));
      });
      rzp.open();
    } catch (error: any) {
      toast.error(error.message || t("resume_builder.init_failed", { defaultValue: "Failed to initiate payment" }));
      setIsLoading(false);
      setIsCheckoutLoading(false);
    } finally {
      if (!window.Razorpay) {
        setIsLoading(false);
      }
    }
  };

  const renderStepper = () => (
    <div className="flex justify-between items-center mb-8 overflow-x-auto pb-4">
      {steps.map((s, idx) => (
        <div key={s.id} className="flex items-center">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm ${step >= s.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
            {step > s.id ? <CheckCircle2 size={16} /> : s.id}
          </div>
          <span className={`ml-2 text-sm whitespace-nowrap ${step >= s.id ? 'font-medium text-gray-900' : 'text-gray-500'}`}>{s.name}</span>
          {idx < steps.length - 1 && <div className={`w-8 sm:w-16 h-1 mx-2 sm:mx-4 ${step > s.id ? 'bg-blue-600' : 'bg-gray-200'}`}></div>}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setIsRazorpayReady(true)}
      />
      
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{t("resume_builder.title")}</h1>
          <button onClick={saveDraft} disabled={isSavingDraft || isLoading || isCheckoutLoading} className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 bg-blue-50 px-4 py-2 rounded-lg disabled:opacity-50">
            <Save size={18} /> <span>{isSavingDraft ? t("resume_builder.saving") : t("resume_builder.save_draft")}</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden p-6 sm:p-10">
          {isPaid ? (
             <div className="text-center py-16">
               <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                 <CheckCircle2 size={40} />
               </div>
               <h2 className="text-3xl font-bold text-gray-900 mb-4">{t("resume_builder.ready_title")}</h2>
               <p className="text-gray-600 mb-8 max-w-lg mx-auto">{t("resume_builder.ready_desc")}</p>
               <div className="flex justify-center space-x-4">
                 <a href={pdfUrl} download="resume.pdf" target="_blank" className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors">
                   <Download size={20} /> <span>{t("resume_builder.download_pdf")}</span>
                 </a>
                 <button onClick={() => { setIsPaid(false); setStep(1); }} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors">
                   {t("resume_builder.update_pay_again")}
                 </button>
               </div>
             </div>
          ) : (
            <>
              {renderStepper()}

              {/* Form Content Area */}
              <div className="min-h-[400px]">
                
                {/* STEP 1: Personal Info */}
                {step === 1 && (
                  <div className="space-y-6 animate-fadeIn">
                    <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">{t("resume_builder.personal_info")}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div><label className="block text-sm font-medium text-gray-700">{t("resume_builder.full_name")}</label><input type="text" value={personalInfo.fullName} onChange={e => setPersonalInfo({...personalInfo, fullName: e.target.value})} className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 text-slate-900" /></div>
                      <div><label className="block text-sm font-medium text-gray-700">{t("resume_builder.email")}</label><input type="email" value={personalInfo.email} onChange={e => setPersonalInfo({...personalInfo, email: e.target.value})} className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 text-slate-900" /></div>
                      <div><label className="block text-sm font-medium text-gray-700">{t("resume_builder.phone")}</label><input type="text" value={personalInfo.phone} onChange={e => setPersonalInfo({...personalInfo, phone: e.target.value})} className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 text-slate-900" /></div>
                      <div><label className="block text-sm font-medium text-gray-700">{t("resume_builder.dob")}</label><input type="date" value={personalInfo.dob} onChange={e => setPersonalInfo({...personalInfo, dob: e.target.value})} className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 text-slate-900" /></div>
                      <div><label className="block text-sm font-medium text-gray-700">{t("resume_builder.city")}</label><input type="text" value={personalInfo.city} onChange={e => setPersonalInfo({...personalInfo, city: e.target.value})} className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 text-slate-900" /></div>
                      <div><label className="block text-sm font-medium text-gray-700">{t("resume_builder.country")}</label><input type="text" value={personalInfo.country} onChange={e => setPersonalInfo({...personalInfo, country: e.target.value})} className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 text-slate-900" /></div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Summary */}
                {step === 2 && (
                  <div className="space-y-6 animate-fadeIn">
                    <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">{t("resume_builder.professional_summary")}</h2>
                    <p className="text-sm text-gray-500 mb-2">{t("resume_builder.summary_desc")}</p>
                    <textarea value={summary} onChange={e => setSummary(e.target.value)} rows={6} className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 text-slate-900" placeholder={t("resume_builder.summary_placeholder")}></textarea>
                  </div>
                )}

                {/* STEP 3: Education */}
                {step === 3 && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="flex justify-between items-center border-b pb-2">
                      <h2 className="text-2xl font-bold text-gray-800">{t("resume_builder.education")}</h2>
                      <button onClick={() => addArrayItem(setEducation, initialEducation)} className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium hover:bg-blue-200">{t("resume_builder.add_more")}</button>
                    </div>
                    {education.map((edu, idx) => (
                      <div key={idx} className="bg-gray-50 p-6 rounded-xl border relative mb-4">
                        {idx > 0 && <button onClick={() => removeArrayItem(setEducation, idx)} className="absolute top-4 right-4 text-red-500 text-sm font-medium">{t("resume_builder.remove")}</button>}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div><label className="block text-xs text-gray-600">{t("resume_builder.degree")}</label><input type="text" value={edu.degree} onChange={e => handleArrayChange(setEducation, idx, 'degree', e.target.value)} className="w-full p-2 border rounded-lg text-slate-900" placeholder="B.Tech Computer Science" /></div>
                          <div><label className="block text-xs text-gray-600">{t("resume_builder.college")}</label><input type="text" value={edu.college} onChange={e => handleArrayChange(setEducation, idx, 'college', e.target.value)} className="w-full p-2 border rounded-lg text-slate-900" /></div>
                          <div><label className="block text-xs text-gray-600">{t("resume_builder.start_year")}</label><input type="text" value={edu.startYear} onChange={e => handleArrayChange(setEducation, idx, 'startYear', e.target.value)} className="w-full p-2 border rounded-lg text-slate-900" placeholder="2020" /></div>
                          <div><label className="block text-xs text-gray-600">{t("resume_builder.end_year")}</label><input type="text" value={edu.endYear} onChange={e => handleArrayChange(setEducation, idx, 'endYear', e.target.value)} className="w-full p-2 border rounded-lg text-slate-900" placeholder="2024" /></div>
                          <div><label className="block text-xs text-gray-600">{t("resume_builder.score")}</label><input type="text" value={edu.score} onChange={e => handleArrayChange(setEducation, idx, 'score', e.target.value)} className="w-full p-2 border rounded-lg text-slate-900" /></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* STEP 4: Experience */}
                {step === 4 && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="flex justify-between items-center border-b pb-2">
                      <h2 className="text-2xl font-bold text-gray-800">{t("resume_builder.experience")}</h2>
                      <button onClick={() => addArrayItem(setExperience, initialExperience)} className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium hover:bg-blue-200">{t("resume_builder.add_more")}</button>
                    </div>
                    {experience.map((exp, idx) => (
                      <div key={idx} className="bg-gray-50 p-6 rounded-xl border relative mb-4">
                        {idx > 0 && <button onClick={() => removeArrayItem(setExperience, idx)} className="absolute top-4 right-4 text-red-500 text-sm font-medium">{t("resume_builder.remove")}</button>}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div><label className="block text-xs text-gray-600">{t("resume_builder.role")}</label><input type="text" value={exp.role} onChange={e => handleArrayChange(setExperience, idx, 'role', e.target.value)} className="w-full p-2 border rounded-lg text-slate-900" placeholder="Frontend Intern" /></div>
                          <div><label className="block text-xs text-gray-600">{t("resume_builder.company")}</label><input type="text" value={exp.company} onChange={e => handleArrayChange(setExperience, idx, 'company', e.target.value)} className="w-full p-2 border rounded-lg text-slate-900" /></div>
                          <div><label className="block text-xs text-gray-600">{t("resume_builder.start_date")}</label><input type="text" value={exp.startDate} onChange={e => handleArrayChange(setExperience, idx, 'startDate', e.target.value)} className="w-full p-2 border rounded-lg text-slate-900" placeholder="Jan 2023" /></div>
                          <div><label className="block text-xs text-gray-600">{t("resume_builder.end_date")}</label><input type="text" value={exp.endDate} onChange={e => handleArrayChange(setExperience, idx, 'endDate', e.target.value)} className="w-full p-2 border rounded-lg text-slate-900" placeholder="Present" /></div>
                          <div className="md:col-span-2"><label className="block text-xs text-gray-600">{t("resume_builder.description")}</label><textarea rows={3} value={exp.description} onChange={e => handleArrayChange(setExperience, idx, 'description', e.target.value)} className="w-full p-2 border rounded-lg text-slate-900" /></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                 {/* STEP 5: Projects */}
                {step === 5 && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="flex justify-between items-center border-b pb-2">
                      <h2 className="text-2xl font-bold text-gray-800">{t("resume_builder.projects")}</h2>
                      <button onClick={() => addArrayItem(setProjects, initialProject)} className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium hover:bg-blue-200">{t("resume_builder.add_more")}</button>
                    </div>
                    {projects.map((proj, idx) => (
                      <div key={idx} className="bg-gray-50 p-6 rounded-xl border relative mb-4">
                        {idx > 0 && <button onClick={() => removeArrayItem(setProjects, idx)} className="absolute top-4 right-4 text-red-500 text-sm font-medium">{t("resume_builder.remove")}</button>}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div><label className="block text-xs text-gray-600">{t("resume_builder.project_name")}</label><input type="text" value={proj.name} onChange={e => handleArrayChange(setProjects, idx, 'name', e.target.value)} className="w-full p-2 border rounded-lg text-slate-900" /></div>
                          <div><label className="block text-xs text-gray-600">{t("resume_builder.tech_used")}</label><input type="text" value={proj.technologies} onChange={e => handleArrayChange(setProjects, idx, 'technologies', e.target.value)} className="w-full p-2 border rounded-lg text-slate-900" placeholder="React, Node.js" /></div>
                          <div><label className="block text-xs text-gray-600">{t("resume_builder.github_link")}</label><input type="text" value={proj.githubLink} onChange={e => handleArrayChange(setProjects, idx, 'githubLink', e.target.value)} className="w-full p-2 border rounded-lg text-slate-900" /></div>
                          <div><label className="block text-xs text-gray-600">{t("resume_builder.live_link")}</label><input type="text" value={proj.liveLink} onChange={e => handleArrayChange(setProjects, idx, 'liveLink', e.target.value)} className="w-full p-2 border rounded-lg text-slate-900" /></div>
                          <div className="md:col-span-2"><label className="block text-xs text-gray-600">{t("resume_builder.description")}</label><textarea rows={3} value={proj.description} onChange={e => handleArrayChange(setProjects, idx, 'description', e.target.value)} className="w-full p-2 border rounded-lg text-slate-900" /></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* STEP 6: Skills & More */}
                {step === 6 && (
                  <div className="space-y-8 animate-fadeIn">
                    {/* Skills */}
                    <div>
                      <h2 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">{t("resume_builder.skills")}</h2>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {skills.map((skill, i) => (
                          <span key={i} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                            {skill} <button onClick={() => setSkills(skills.filter((_, idx) => idx !== i))} className="ml-2 text-blue-400 hover:text-blue-800">&times;</button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input type="text" id="skillInput" className="flex-1 p-3 border rounded-xl text-slate-900" placeholder={t("resume_builder.skills_placeholder")} onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSimpleArrayAdd(setSkills, e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}/>
                      </div>
                    </div>

                    {/* Social Links */}
                    <div>
                      <h2 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">{t("resume_builder.social_links")}</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-xs text-gray-600">LinkedIn</label><input type="text" value={socialLinks.linkedin} onChange={e => setSocialLinks({...socialLinks, linkedin: e.target.value})} className="w-full p-3 border rounded-xl text-slate-900" placeholder="https://linkedin.com/in/..." /></div>
                        <div><label className="block text-xs text-gray-600">GitHub</label><input type="text" value={socialLinks.github} onChange={e => setSocialLinks({...socialLinks, github: e.target.value})} className="w-full p-3 border rounded-xl text-slate-900" placeholder="https://github.com/..." /></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 7: Review & Pay */}
                {step === 7 && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="bg-gray-900 text-white p-8 rounded-2xl flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
                      {/* Premium Badge Design */}
                      <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600 rounded-full blur-3xl opacity-50"></div>
                      <Shield className="text-yellow-400 w-16 h-16 mb-4" />
                      <h2 className="text-3xl font-bold mb-2">{t("resume_builder.almost_there")}</h2>
                      <p className="text-gray-300 mb-8 max-w-md">{t("resume_builder.almost_there_desc")}</p>
                      
                      <button 
                        onClick={handleGenerateClick}
                        disabled={isLoading || isCheckoutLoading || !(isRazorpayReady || (typeof window !== 'undefined' && window.Razorpay))}
                        className="w-full max-w-sm flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-lg font-bold text-blue-900 bg-yellow-400 hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 transition-all transform hover:scale-105"
                      >
                        {isCheckoutLoading ? t("resume_builder.opening_razorpay") : isLoading ? t("resume_builder.processing") : t("resume_builder.pay_btn")}
                      </button>
                      {!(isRazorpayReady || (typeof window !== 'undefined' && window.Razorpay)) && <p className="text-xs text-yellow-200 mt-3">{t("resume_builder.secure_checkout_loading")}</p>}
                      <p className="text-xs text-gray-400 mt-4 flex items-center"><Shield size={12} className="mr-1"/> {t("resume_builder.secured_by")}</p>
                    </div>

                    {/* Preview Section */}
                    <div className="mt-8 pt-8 border-t">
                       <h3 className="text-xl font-bold text-gray-800 mb-4">{t("resume_builder.preview_details")}</h3>
                       <div className="bg-gray-50 p-6 rounded-xl border text-sm text-gray-600">
                         <p><strong>{t("resume_builder.name")}:</strong> {personalInfo.fullName}</p>
                         <p><strong>{t("resume_builder.email")}:</strong> {personalInfo.email}</p>
                         <p><strong>{t("resume_builder.education_entries")}:</strong> {education.length}</p>
                         <p><strong>{t("resume_builder.experience_entries")}:</strong> {experience.length}</p>
                         <p><strong>{t("resume_builder.projects")}:</strong> {projects.length}</p>
                         <p><strong>{t("resume_builder.skills")}:</strong> {skills.join(', ')}</p>
                       </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              {!isPaid && (
                <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-100">
                  <button onClick={handlePrev} disabled={step === 1 || isLoading} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-30">
                    {t("resume_builder.back_btn")}
                  </button>
                  {step < steps.length && (
                    <button onClick={handleNext} disabled={isLoading || isSavingDraft || isCheckoutLoading} className="flex items-center px-8 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 shadow-md transition-colors disabled:opacity-50">
                      {t("resume_builder.continue_btn")} <ChevronRight size={18} className="ml-2" />
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 transform scale-100 animate-fadeIn">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <Shield size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t("resume_builder.verification_title")}</h2>
            <p className="text-gray-600 mb-2">{t("resume_builder.verification_desc")}</p>
            
            <div className="flex justify-between text-sm text-gray-500 mb-4">
              <span>{t("resume_builder.expires_in")} <span className="font-mono font-semibold text-red-500">{Math.floor(expireTimer / 60)}:{(expireTimer % 60).toString().padStart(2, '0')}</span></span>
            </div>

            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
              placeholder={t("login_otp_modal.placeholder")}
              disabled={isLoading || expireTimer === 0}
              className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all mb-4 text-center text-2xl tracking-widest text-gray-900 font-bold disabled:bg-gray-100"
            />
            <div className="flex space-x-3">
              <button 
                onClick={() => { setShowOtpModal(false); setOtp(""); }}
                disabled={isLoading || isCheckoutLoading}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {t("resume_builder.cancel")}
              </button>
              <button 
                onClick={verifyOtpAndPay}
                disabled={isLoading || isCheckoutLoading || otp.length !== 6 || expireTimer === 0}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 flex justify-center items-center"
              >
                {isLoading ? <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span> : t("resume_builder.verify_pay")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeBuilder;
