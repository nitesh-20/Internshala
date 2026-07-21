import { selectuser } from "@/Feature/Userslice";
import axios from "axios";
import {
  ArrowUpRight,
  Book,
  Calendar,
  Clock,
  DollarSign,
  ExternalLink,
  MapPin,
  X,
  Briefcase,
  Users,
  Award,
  CheckCircle2,
  ChevronRight,
  Building2,
  Zap
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

const Index = () => {
  const router = useRouter();
  const { id } = router.query;
  const [jobData, setJobData] = useState<any>(null);
  
  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const res = await axios.get(`http://localhost:5001/api/job/${id}`);
        setJobData(res.data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchData();
  }, [id]);

  const [availability, setAvailability] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const user = useSelector(selectuser);
  const [userResume, setUserResume] = useState<any>(null);

  useEffect(() => {
    if (user?.email) {
      axios.get(`http://localhost:5001/api/resume/${user.email}`)
        .then(res => setUserResume(res.data))
        .catch(err => console.log("No resume found"));
    }
  }, [user]);

  if (!jobData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-slate-500 font-medium animate-pulse">Loading details...</p>
      </div>
    );
  }

  const handleSubmitApplication = async () => {
    if (!coverLetter.trim()) {
      toast.error("Please write a cover letter");
      return;
    }
    if (!availability) {
      toast.error("Please select your availability");
      return;
    }
    try {
      const applicationData = {
        category: jobData.category,
        company: jobData.company,
        coverLetter: coverLetter,
        user: user,
        Application: id,
        availability,
        resumeUrl: userResume && userResume.isPaid ? userResume.pdfUrl : null
      };
      await axios.post("http://localhost:5001/api/application", applicationData);
      toast.success("Application submitted successfully");
      router.push('/job');
    } catch (error: any) {
      console.error(error);
      if (error.response?.status === 403 && error.response?.data?.error?.includes("limit")) {
        toast.error(error.response.data.error);
        router.push("/subscription");
      } else {
        toast.error("Failed to submit application");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 font-sans pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm font-medium text-slate-500 mb-8 space-x-2">
          <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <ChevronRight size={16} />
          <Link href="/job" className="hover:text-blue-600 transition-colors">Jobs</Link>
          <ChevronRight size={16} />
          <span className="text-slate-900 truncate max-w-[200px]">{jobData.title}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content Area */}
          <div className="flex-1 space-y-6">
            
            {/* Header Card */}
            <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-60"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full w-fit mb-6 border border-emerald-100 uppercase tracking-wide">
                  <Zap size={14} className="fill-emerald-500" /> Actively Hiring
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                  <div className="flex gap-5 items-center">
                    <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0 text-3xl font-bold text-slate-300">
                      {jobData.company?.charAt(0) || <Building2 size={36} />}
                    </div>
                    <div>
                      <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-2 leading-tight tracking-tight">
                        {jobData.title}
                      </h1>
                      <div className="flex items-center gap-2 text-lg text-slate-600 font-medium">
                        {jobData.company}
                        <ExternalLink size={16} className="text-slate-400 cursor-pointer hover:text-blue-600 transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <MapPin size={16} /> <span className="text-xs font-bold uppercase tracking-wider">Location</span>
                    </div>
                    <p className="font-semibold text-slate-900">{jobData.location}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <DollarSign size={16} /> <span className="text-xs font-bold uppercase tracking-wider">CTC</span>
                    </div>
                    <p className="font-semibold text-slate-900">{jobData.CTC}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Book size={16} /> <span className="text-xs font-bold uppercase tracking-wider">Category</span>
                    </div>
                    <p className="font-semibold text-slate-900">{jobData.category}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Briefcase size={16} /> <span className="text-xs font-bold uppercase tracking-wider">Experience</span>
                    </div>
                    <p className="font-semibold text-slate-900">{jobData.Experience || "Not specified"}</p>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                   <div className="flex items-center gap-2 text-sm font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                    <Clock size={16} /> Posted {new Date(jobData.createAt || Date.now()).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* About Company */}
            <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Building2 className="text-blue-600" /> About {jobData.company}
              </h2>
              <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">
                {jobData.aboutCompany}
              </div>
            </div>

            {/* About Role */}
            <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Briefcase className="text-blue-600" /> About the Job
              </h2>
              <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap mb-8">
                {jobData.aboutJob || "Details not provided."}
              </div>

              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Users size={20} className="text-slate-400" /> Who can apply
                  </h3>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap pl-7 border-l-2 border-slate-100 ml-2">
                    {jobData.whoCanApply || "Open to all relevant candidates."}
                  </p>
                </div>

                {jobData.perks && (
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <Award size={20} className="text-slate-400" /> Perks
                    </h3>
                    <div className="flex flex-wrap gap-2 pl-7 ml-2">
                      {jobData.perks.split(",").map((perk: string, i: number) => (
                        perk.trim() && (
                          <span key={i} className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-blue-600" /> {perk.trim()}
                          </span>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {jobData.AdditionalInfo && (
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-3">Additional Information</h3>
                    <p className="text-slate-600 leading-relaxed bg-amber-50 p-4 rounded-xl border border-amber-100 text-sm">
                      {jobData.AdditionalInfo}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sticky Sidebar */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 sticky top-28">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Ready to apply?</h3>
              <p className="text-sm text-slate-500 mb-6">Review the requirements and submit your application today.</p>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-slate-500 text-sm">Openings</span>
                  <span className="font-bold text-slate-900 bg-slate-50 px-3 py-1 rounded-lg">{jobData.numberOfOpening || 1}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-slate-500 text-sm">Applicants</span>
                  <span className="font-bold text-slate-900 bg-slate-50 px-3 py-1 rounded-lg">~45</span>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full bg-blue-600 text-white font-bold text-lg px-8 py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
              >
                Apply Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Apply Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 sm:px-8 border-b border-slate-100">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Apply to {jobData.company}</h2>
                <p className="text-sm font-medium text-slate-500">{jobData.title}</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:px-8 overflow-y-auto custom-scrollbar space-y-8 flex-1">
              
              {/* Resume Section */}
              <section>
                <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Book size={20} className="text-blue-600" /> Resume / CV
                </h3>
                {userResume && userResume.isPaid ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold mb-1">Premium Resume Attached</p>
                      <p className="text-sm text-emerald-700/80">Your ATS-friendly premium resume will be automatically included with this application.</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-blue-800">
                    <p className="font-bold mb-1">Standard Profile Resume</p>
                    <p className="text-sm text-blue-700/80 mb-3">Your default profile data will be submitted.</p>
                    <Link href="/resume" className="inline-block px-4 py-2 bg-white text-blue-700 text-sm font-bold rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors shadow-sm">
                      Upgrade to Premium Resume
                    </Link>
                  </div>
                )}
              </section>

              {/* Cover Letter Section */}
              <section>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Cover Letter</h3>
                <p className="text-sm text-slate-500 mb-4">Why should you be hired for this role?</p>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 transition-all text-slate-700 resize-none outline-none"
                  placeholder="Mention your skills, projects, and why you are a good fit..."
                ></textarea>
              </section>

              {/* Availability Section */}
              <section>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Your Availability</h3>
                <div className="space-y-3">
                  {[
                    "Yes, I am available to join immediately",
                    "No, I am currently on notice period",
                    "No, I will have to serve notice period",
                    "Other",
                  ].map((option) => (
                    <label key={option} className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors group">
                      <div className="relative flex items-center justify-center mt-0.5">
                        <input
                          type="radio"
                          name="availability"
                          value={option}
                          checked={availability === option}
                          onChange={(e) => setAvailability(e.target.value)}
                          className="peer w-5 h-5 appearance-none rounded-full border border-slate-300 checked:border-blue-600 cursor-pointer transition-colors"
                        />
                        <div className="absolute w-2.5 h-2.5 rounded-full bg-blue-600 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"></div>
                      </div>
                      <span className="text-slate-700 font-medium group-hover:text-slate-900">{option}</span>
                    </label>
                  ))}
                </div>
              </section>
            </div>

            {/* Modal Footer */}
            <div className="p-6 sm:px-8 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 font-bold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              {user ? (
                <button 
                  className="px-8 py-3 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
                  onClick={handleSubmitApplication}
                >
                  Submit Application
                </button>
              ) : (
                <Link
                  href={`/`}
                  className="px-8 py-3 font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-sm"
                >
                  Sign in to apply
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
