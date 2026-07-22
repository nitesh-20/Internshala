import { useEffect, useState } from "react";
import {
  ArrowRight,
  Briefcase,
  Building2,
  Calendar,
  ChevronRight,
  GraduationCap,
  MapPin,
  Search,
  Star,
  TrendingUp,
  Users,
  Bookmark,
  Share2,
  Sparkles,
  Mail,
  Send,
  ShieldCheck,
  ChevronLeft,
  Crown
} from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

const successStories = [
  { name: "Aarav Sharma", role: "Software Engineer at Google", rating: 5, quote: "InternArea helped me land my dream internship at Google. The premium Resume Builder was a game-changer for my applications." },
  { name: "Priya Patel", role: "Product Manager at Microsoft", rating: 5, quote: "The interface is so clean and finding remote opportunities is incredibly easy. I highly recommend the subscription plan." },
  { name: "Rohan Gupta", role: "Data Scientist at Amazon", rating: 5, quote: "I found my first full-time role through this platform. The community and tracking features kept me organized throughout." },
  { name: "Sneha Reddy", role: "UX Designer at Adobe", rating: 5, quote: "Figma and design internships here are top-tier. Applied and got selected within two weeks!" },
  { name: "Vikram Singh", role: "DevOps Engineer at Razorpay", rating: 5, quote: "Secured a backend developer internship which converted into a high-paying full-time job. Extremely grateful!" },
  { name: "Ananya Iyer", role: "Data Analyst at PhonePe", rating: 4.8, quote: "Excellent company listings. The filters helped me find exactly what I wanted near my city." },
  { name: "Aditya Verma", role: "Frontend Developer at Paytm", rating: 5, quote: "The mock application tracker made it simple to follow up with recruiters. Highly recommended." },
  { name: "Meera Nair", role: "Machine Learning Intern at Zoho", rating: 5, quote: "Incredible resource for tech students. The ML jobs listed here are highly relevant and authentic." },
  { name: "Kunal Shah", role: "Product Analyst at Meesho", rating: 4.7, quote: "Highly professional environment. The newsletter sends handpicked remote jobs weekly." },
  { name: "Tanvi Rao", role: "Content Writer at Freshworks", rating: 5, quote: "Got my first freelance writing opportunity here. Super quick response from the HR." },
  { name: "Ishaan Das", role: "Cyber Security Intern at Swiggy", rating: 4.9, quote: "The security roles listed here are excellent. The verification process gives peace of mind." },
  { name: "Diya Kaplan", role: "Marketing Associate at Zomato", rating: 5, quote: "I love the user dashboard. It's so clean and tracking payment/invoices is very intuitive." },
  { name: "Kabir Malhotra", role: "SRE Intern at Flipkart", rating: 5, quote: "Best platform for internships in India. The tech stack search filter works like magic." },
  { name: "Riya Sen", role: "Sales Executive at Airtel", rating: 4.6, quote: "Found an awesome hybrid role during my final semester. Recruiter called in 2 days!" },
  { name: "Abhinav Joshi", role: "Java Developer at Jio", rating: 5, quote: "Great UX. From building my resume to getting my first offer, everything was seamless." }
];

const topCompanies = [
  { name: "Google", logo: "G", color: "bg-blue-600", rating: 4.8, positions: 12, industry: "Technology" },
  { name: "Microsoft", logo: "M", color: "bg-teal-600", rating: 4.7, positions: 8, industry: "Technology" },
  { name: "Amazon", logo: "A", color: "bg-orange-500", rating: 4.6, positions: 15, industry: "E-Commerce" },
  { name: "Adobe", logo: "Ad", color: "bg-red-600", rating: 4.5, positions: 6, industry: "Software" },
  { name: "Paytm", logo: "P", color: "bg-sky-700", rating: 4.1, positions: 14, industry: "Fintech" },
  { name: "PhonePe", logo: "Pp", color: "bg-purple-600", rating: 4.3, positions: 10, industry: "Fintech" },
  { name: "Meesho", logo: "M", color: "bg-pink-600", rating: 4.2, positions: 9, industry: "E-Commerce" },
  { name: "Razorpay", logo: "R", color: "bg-blue-500", rating: 4.4, positions: 11, industry: "Fintech" },
  { name: "Zoho", logo: "Z", color: "bg-red-500", rating: 4.5, positions: 18, industry: "SaaS" },
  { name: "Freshworks", logo: "F", color: "bg-green-600", rating: 4.4, positions: 7, industry: "SaaS" }
];

const popularCategories = [
  { name: "Web Development", slug: "Engineering", icon: <Briefcase size={20} />, count: "1,200+ Offers" },
  { name: "Frontend", slug: "Frontend", icon: <GraduationCap size={20} />, count: "850+ Offers" },
  { name: "Backend", slug: "Backend", icon: <TrendingUp size={20} />, count: "930+ Offers" },
  { name: "AI", slug: "Engineering", icon: <Sparkles size={20} />, count: "310+ Offers" },
  { name: "Machine Learning", slug: "Engineering", icon: <Users size={20} />, count: "420+ Offers" },
  { name: "Cyber Security", slug: "Engineering", icon: <ShieldCheck size={20} />, count: "210+ Offers" },
  { name: "Cloud Computing", slug: "Engineering", icon: <Building2 size={20} />, count: "340+ Offers" },
  { name: "Marketing", slug: "Marketing", icon: <Star size={20} />, count: "650+ Offers" },
  { name: "Finance", slug: "Finance", icon: <Calendar size={20} />, count: "280+ Offers" },
  { name: "Sales", slug: "Sales", icon: <Users size={20} />, count: "540+ Offers" },
  { name: "UI/UX Design", slug: "Design", icon: <Sparkles size={20} />, count: "490+ Offers" }
];

export default function Home() {
  const { t } = useTranslation();
  const [internships, setInternships] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [savedList, setSavedList] = useState<string[]>([]);
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://backend-tau-snowy-58.vercel.app";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [internshipRes, jobRes] = await Promise.all([
          axios.get(`${apiBaseUrl}/api/internship`).catch(() => ({ data: [] })),
          axios.get(`${apiBaseUrl}/api/job`).catch(() => ({ data: [] })),
        ]);
        setInternships(internshipRes.data.slice(0, 8)); // 8 Beautiful Internships
        setJobs(jobRes.data.slice(0, 8)); // 8 Beautiful Jobs
      } catch (error) {
        console.log("Failed to fetch data", error);
      }
    };
    fetchData();

    const saved = localStorage.getItem("saved_opportunities");
    if (saved) {
      setSavedList(JSON.parse(saved));
    }
  }, [apiBaseUrl]);

  const toggleSave = (id: string) => {
    let updated = [...savedList];
    if (updated.includes(id)) {
      updated = updated.filter(item => item !== id);
      toast.info(t("home.removed_saved"));
    } else {
      updated.push(id);
      toast.success(t("home.saved_success"));
    }
    setSavedList(updated);
    localStorage.setItem("saved_opportunities", JSON.stringify(updated));
  };

  const handleShare = (id: string, type: 'internship' | 'job') => {
    const shareUrl = `${window.location.origin}/detail${type === 'internship' ? 'iternship' : 'job'}/${id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success(t("home.share_copied"));
    }).catch(() => {
      toast.error(t("home.share_failed"));
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 scroll-smooth">
      
      {/* SECTION 1: HERO */}
      <section className="relative pt-24 pb-32 overflow-hidden bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50/70 via-white to-white pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 font-semibold text-sm mb-6">
              <Sparkles size={16} className="text-blue-600 animate-spin" />
              <span>{t("home.launchpad")}</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight">
              {t("home.hero_title")} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{t("home.hero_span")}</span> <br />
              {t("home.hero_sub")}
            </h1>
            
            <p className="text-lg text-slate-600 mb-10 max-w-xl mx-auto lg:mx-0">
              {t("home.hero_desc")}
            </p>

            {/* Interactive Search Bar */}
            <div className="max-w-2xl bg-white p-3 rounded-2xl shadow-[0_12px_40px_rgba(37,99,235,0.08)] border border-slate-100 flex flex-col sm:flex-row gap-3 mb-8">
              <div className="flex-1 flex items-center bg-slate-50 rounded-xl px-4 py-3 border border-slate-100 focus-within:border-blue-500 transition-all">
                <Search className="text-slate-400 w-5 h-5 flex-shrink-0" />
                <input 
                  type="text" 
                  placeholder={t("home.search_placeholder")}
                  className="w-full bg-transparent border-none outline-none px-3 text-slate-700 placeholder-slate-400 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex-1 flex items-center bg-slate-50 rounded-xl px-4 py-3 border border-slate-100 focus-within:border-blue-500 transition-all">
                <MapPin className="text-slate-400 w-5 h-5 flex-shrink-0" />
                <input 
                  type="text" 
                  placeholder={t("home.city_placeholder")}
                  className="w-full bg-transparent border-none outline-none px-3 text-slate-700 placeholder-slate-400 text-sm"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                />
              </div>
              <Link 
                href={`/internship?search=${searchQuery}&loc=${searchLocation}`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-bold transition-all hover:shadow-lg flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {t("home.search_btn")} <ArrowRight size={18} />
              </Link>
            </div>

            {/* Popular Searches */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
              <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider mr-2">{t("home.popular")}</span>
              {["Remote", "React", "Python", "SaaS", "Figma"].map((term) => (
                <button 
                  key={term} 
                  onClick={() => { setSearchQuery(term); }}
                  className="px-4 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all text-xs font-medium"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          {/* Hero Visual Block */}
          <div className="flex-1 w-full max-w-lg lg:max-w-none relative">
            <div className="absolute inset-0 bg-blue-500 rounded-3xl blur-[80px] opacity-10 pointer-events-none"></div>
            <div className="relative border border-slate-200/60 bg-white p-6 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.06)] animate-[pulse_6s_infinite]">
              <div className="flex items-center justify-between border-b pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">IA</div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{t("home.score_engine")}</h3>
                    <p className="text-xs text-slate-400">{t("home.score_powered")}</p>
                  </div>
                </div>
                <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold border border-emerald-100">{t("home.score_live")}</span>
              </div>
              <div className="space-y-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border">
                  <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5">
                    <span>{t("home.ats_opt")}</span>
                    <span className="text-blue-600">92% {t("home.match")}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 w-[92%] rounded-full"></div>
                  </div>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border">
                  <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5">
                    <span>{t("home.keywords_matched")}</span>
                    <span className="text-indigo-600">{t("home.excellent")}</span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {["React", "Node.js", "MongoDB", "Redux"].map(k => (
                      <span key={k} className="text-[10px] bg-slate-200 px-2 py-0.5 rounded font-medium text-slate-600">{k}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: STATISTICS */}
      <section className="bg-slate-900 py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center divide-x divide-slate-800">
            <div>
              <p className="text-3xl md:text-5xl font-black text-white tracking-tight mb-2">55,000+</p>
              <p className="text-xs md:text-sm font-bold text-blue-400 uppercase tracking-widest">{t("home.active_students")}</p>
            </div>
            <div>
              <p className="text-3xl md:text-5xl font-black text-white tracking-tight mb-2">12,000+</p>
              <p className="text-xs md:text-sm font-bold text-blue-400 uppercase tracking-widest">{t("home.premium_internships")}</p>
            </div>
            <div>
              <p className="text-3xl md:text-5xl font-black text-white tracking-tight mb-2">4,000+</p>
              <p className="text-xs md:text-sm font-bold text-blue-400 uppercase tracking-widest">{t("home.partner_companies")}</p>
            </div>
            <div>
              <p className="text-3xl md:text-5xl font-black text-white tracking-tight mb-2">96%</p>
              <p className="text-xs md:text-sm font-bold text-blue-400 uppercase tracking-widest">{t("home.placement_rate")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: POPULAR CATEGORIES */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">{t("home.popular_title")}</h2>
          <p className="text-slate-500 text-base">{t("home.popular_desc")}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {popularCategories.map((cat, idx) => (
            <Link 
              key={idx} 
              href={`/internship?category=${cat.slug}`}
              className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] hover:border-blue-300 transition-all duration-300 flex flex-col items-center text-center justify-between"
            >
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-5 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                {cat.icon}
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-1">
                {t("home.categories." + cat.name.toLowerCase().replace(/[^a-z0-9]/g, "_"), cat.name)}
              </h3>
              <span className="text-xs font-semibold text-slate-400">
                {t("home.offers_count", { defaultValue: cat.count, count: parseInt(cat.count.replace(/\D/g, '')) })}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* SECTION 4: FEATURED INTERNSHIPS */}
      <section className="py-24 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-blue-600 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles size={12} /> {t("home.live_postings")}
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t("home.featured_internships")}</h2>
            </div>
            <Link href="/internship" className="flex items-center gap-1 text-blue-600 font-bold hover:text-blue-700 group text-sm">
              {t("home.browse_all_internships")} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {internships.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {internships.map((internship, index) => {
                const isPremium = parseInt(internship.stipend?.replace(/[^0-9]/g, "") || "0") >= 20000;
                const isSaved = savedList.includes(internship._id);
                return (
                  <div key={internship._id} className="bg-white rounded-2xl border border-slate-200/80 p-5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] hover:border-blue-200 transition-all duration-300 flex flex-col justify-between group relative">
                    {/* Badge */}
                    <div className="flex justify-between items-start mb-5">
                      <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-lg font-black text-slate-400 object-cover">
                        {internship.company.charAt(0)}
                      </div>
                      <div className="flex gap-1">
                        {isPremium && (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded border border-amber-200 uppercase tracking-wider flex items-center gap-0.5">
                            <Crown size={10} className="fill-amber-500" /> {t("resume_builder.premium", { defaultValue: "Premium" })}
                          </span>
                        )}
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded border border-blue-100 uppercase tracking-wider">
                          {t("home.intern_badge", { defaultValue: "Intern" })}
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-1 truncate">{internship.company}</h3>
                      <h4 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 mb-2">
                        {internship.title}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <MapPin size={12} className="text-slate-400" /> {internship.location}
                      </div>
                    </div>

                    <div className="py-3 border-y border-slate-50 flex items-center justify-between text-xs text-slate-600 mb-5 font-semibold">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase text-slate-400 tracking-wider font-bold">{t("resume_builder.stipend", { defaultValue: "Stipend" })}</span>
                        <span>{internship.stipend}</span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[10px] uppercase text-slate-400 tracking-wider font-bold">{t("resume_builder.duration", { defaultValue: "Duration" })}</span>
                        <span>{internship.duration}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-auto">
                      <Link 
                        href={`/detailiternship/${internship._id}`} 
                        className="flex-1 py-2 px-3 bg-slate-50 text-slate-800 text-xs font-bold text-center rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors"
                      >
                        {t("home.apply_now")}
                      </Link>
                      
                      <button 
                        onClick={() => toggleSave(internship._id)}
                        className={`p-2 rounded-xl border hover:bg-slate-50 transition-colors ${isSaved ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-slate-200 text-slate-400'}`}
                      >
                        <Bookmark size={14} className={isSaved ? "fill-blue-600" : ""} />
                      </button>
                      <button 
                        onClick={() => handleShare(internship._id, 'internship')}
                        className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 transition-colors"
                      >
                        <Share2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
              <h3 className="text-lg font-bold text-slate-700 mb-2">{t("home.no_internships_found")}</h3>
              <p className="text-slate-500">{t("home.no_internships_desc")}</p>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 5: FEATURED JOBS */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-2">
              <Briefcase size={12} /> {t("home.permanent_jobs")}
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t("home.featured_jobs")}</h2>
          </div>
          <Link href="/job" className="flex items-center gap-1 text-indigo-600 font-bold hover:text-indigo-700 group text-sm">
            {t("home.browse_all_jobs")} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {jobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {jobs.map((job) => {
              const isSaved = savedList.includes(job._id);
              return (
                <div key={job._id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] hover:border-indigo-200 transition-all duration-300 flex flex-col justify-between group relative">
                  <div className="flex justify-between items-start mb-5">
                    <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-lg font-black text-slate-400 object-cover">
                      {job.company.charAt(0)}
                    </div>
                    <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded border border-indigo-100 uppercase tracking-wider">
                      {t("home.full_time_badge", { defaultValue: "Full-time" })}
                    </span>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-1 truncate">{job.company}</h3>
                    <h4 className="text-base font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 mb-2">
                      {job.title}
                    </h4>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <MapPin size={12} className="text-slate-400" /> {job.location}
                    </div>
                  </div>

                  <div className="py-3 border-y border-slate-50 flex items-center justify-between text-xs text-slate-600 mb-5 font-semibold">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase text-slate-400 tracking-wider font-bold">{t("resume_builder.salary", { defaultValue: "Salary" })}</span>
                      <span>{job.CTC}</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] uppercase text-slate-400 tracking-wider font-bold">{t("resume_builder.experience", { defaultValue: "Experience" })}</span>
                      <span>{job.Experience}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-auto">
                    <Link 
                      href={`/detailjob/${job._id}`} 
                      className="flex-1 py-2 px-3 bg-slate-50 text-slate-800 text-xs font-bold text-center rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors"
                    >
                      {t("home.apply_now")}
                    </Link>
                    
                    <button 
                      onClick={() => toggleSave(job._id)}
                      className={`p-2 rounded-xl border hover:bg-slate-50 transition-colors ${isSaved ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'border-slate-200 text-slate-400'}`}
                    >
                      <Bookmark size={14} className={isSaved ? "fill-indigo-600" : ""} />
                    </button>
                    <button 
                      onClick={() => handleShare(job._id, 'job')}
                      className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 transition-colors"
                    >
                      <Share2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
            <h3 className="text-lg font-bold text-slate-700 mb-2">{t("home.no_jobs_found")}</h3>
            <p className="text-slate-500">{t("home.no_jobs_desc")}</p>
          </div>
        )}
      </section>

      {/* SECTION 6: TOP COMPANIES */}
      <section className="py-24 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">{t("home.top_companies")}</h2>
            <p className="text-slate-500 text-base">{t("home.top_companies_desc")}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {topCompanies.map((c, idx) => (
              <div 
                key={idx} 
                className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center justify-between"
              >
                <div className={`w-12 h-12 rounded-xl ${c.color} text-white flex items-center justify-center font-black text-xl mb-4 shadow-md shadow-slate-100`}>
                  {c.logo}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-950 text-sm mb-1">{c.name}</h3>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    {t("home.industries." + c.industry.toLowerCase().replace(/[^a-z0-9]/g, "_"), c.industry)}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-amber-500 text-xs font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-100 mb-3">
                  <Star size={12} className="fill-amber-500" /> {c.rating}
                </div>
                <span className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer">{c.positions} {t("home.open_positions")}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7: SUCCESS STORIES */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">{t("home.success_stories")}</h2>
            <p className="text-slate-500 text-base">{t("home.success_stories_desc")}</p>
          </div>

          {/* Testimonial slider view */}
          <div className="max-w-4xl mx-auto relative bg-white border border-slate-200 p-8 md:p-12 rounded-3xl shadow-xl flex flex-col justify-between min-h-[300px] overflow-hidden">
            <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div>
                <div className="text-5xl text-blue-200 font-serif leading-none mb-6">“</div>
                <p className="text-lg md:text-xl text-slate-700 italic leading-relaxed mb-8">
                  {t("home.testimonials." + testimonialIndex + ".quote", successStories[testimonialIndex].quote)}
                </p>
              </div>
              
              <div className="flex flex-col md:flex-row items-center justify-between border-t pt-6 gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center font-bold text-blue-700">
                    {successStories[testimonialIndex].name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="text-left">
                    <h4 className="font-extrabold text-slate-950 text-sm">
                      {t("home.testimonials." + testimonialIndex + ".name", successStories[testimonialIndex].name)}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      {t("home.testimonials." + testimonialIndex + ".role", successStories[testimonialIndex].role)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setTestimonialIndex(prev => prev > 0 ? prev - 1 : successStories.length - 1)}
                    className="p-2 border rounded-full bg-white hover:bg-slate-50 text-slate-600 transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs text-slate-400 font-bold">{testimonialIndex + 1} / {successStories.length}</span>
                  <button 
                    onClick={() => setTestimonialIndex(prev => prev < successStories.length - 1 ? prev + 1 : 0)}
                    className="p-2 border rounded-full bg-white hover:bg-slate-50 text-slate-600 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8: POPULAR SKILLS */}
      <section className="py-24 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">{t("home.popular_skills")}</h2>
            <p className="text-slate-500 text-base">{t("home.popular_skills_desc")}</p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
            {["React", "Node.js", "Python", "Java", "C++", "AI", "Machine Learning", "Cloud", "DevOps", "Flutter"].map((skill) => (
              <Link 
                key={skill} 
                href={`/internship?search=${skill}`}
                className="px-6 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all text-sm font-semibold shadow-sm hover:shadow-md"
              >
                {skill}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 9: NEWSLETTER */}
      <section className="py-20 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl overflow-hidden relative shadow-2xl">
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-64 h-64 bg-indigo-900/20 rounded-full blur-2xl"></div>
          
          <div className="relative z-10 py-16 px-8 md:px-16 text-center flex flex-col items-center justify-center gap-8">
            <div className="max-w-xl">
              <Mail className="w-12 h-12 text-blue-200 mx-auto mb-4 animate-bounce" />
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">{t("home.newsletter_title")}</h2>
              <p className="text-blue-100 text-base">{t("home.newsletter_desc")}</p>
            </div>
            
            <div className="w-full max-w-md flex flex-col sm:flex-row gap-3">
              <input 
                type="email" 
                placeholder={t("home.newsletter_placeholder")} 
                className="flex-1 px-5 py-3.5 rounded-xl border-none outline-none text-slate-800 placeholder-slate-400 text-sm focus:ring-4 focus:ring-blue-500/20 shadow-md"
              />
              <button 
                onClick={() => { toast.success(t("home.subscribed_success")); }}
                className="bg-yellow-400 hover:bg-yellow-300 text-blue-950 px-8 py-3.5 rounded-xl font-bold transition-all hover:shadow-lg flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {t("home.subscribe_btn")} <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
