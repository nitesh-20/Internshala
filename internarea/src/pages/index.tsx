import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-fade";
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
  Users
} from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { useTranslation } from "react-i18next";

const featuredCompanies = [
  { name: "Google", logo: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" },
  { name: "Microsoft", logo: "https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg" },
  { name: "Amazon", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" },
  { name: "Adobe", logo: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Adobe_Systems_logo_and_wordmark.svg" },
  { name: "Razorpay", logo: "https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" },
  { name: "Swiggy", logo: "https://upload.wikimedia.org/wikipedia/en/1/12/Swiggy_logo.svg" }
];

const testimonials = [
  {
    name: "Aarav Sharma",
    role: "Software Engineer at Google",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150&h=150",
    quote: "InternArea helped me land my dream internship at Google. The premium Resume Builder was a game-changer for my applications."
  },
  {
    name: "Priya Patel",
    role: "Product Manager at Microsoft",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150",
    quote: "The interface is so clean and finding remote opportunities is incredibly easy. I highly recommend the subscription plan."
  },
  {
    name: "Rohan Gupta",
    role: "Data Scientist at Amazon",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150",
    quote: "I found my first full-time role through this platform. The community and tracking features kept me organized throughout."
  }
];

const popularCategories = [
  { name: "Software Engineering", icon: <Briefcase size={20} />, count: "1,200+ Jobs" },
  { name: "Data Science", icon: <TrendingUp size={20} />, count: "850+ Jobs" },
  { name: "Product Management", icon: <Users size={20} />, count: "420+ Jobs" },
  { name: "UI/UX Design", icon: <Star size={20} />, count: "650+ Jobs" },
  { name: "Marketing", icon: <Building2 size={20} />, count: "930+ Jobs" },
  { name: "Finance", icon: <Calendar size={20} />, count: "310+ Jobs" }
];

export default function Home() {
  const { t } = useTranslation();
  const [internships, setInternships] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [internshipRes, jobRes] = await Promise.all([
          axios.get("http://localhost:5001/api/internship").catch(() => ({ data: [] })),
          axios.get("http://localhost:5001/api/job").catch(() => ({ data: [] })),
        ]);
        setInternships(internshipRes.data.slice(0, 6)); // Top 6
        setJobs(jobRes.data.slice(0, 6)); // Top 6
      } catch (error) {
        console.log("Failed to fetch data", error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden bg-white">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 font-semibold text-sm mb-8 animate-fade-in-up">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
            Over 10,000+ opportunities waiting for you
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-8 leading-tight">
            Launch your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">dream career</span> <br className="hidden md:block" /> today.
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-12">
            Discover premium internships and jobs from top-tier companies. Build your resume, track your applications, and get hired faster.
          </p>

          <div className="max-w-3xl mx-auto bg-white p-2 md:p-3 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 flex flex-col md:flex-row gap-3">
            <div className="flex-1 flex items-center bg-slate-50 rounded-xl px-4 py-3 md:py-0 border border-slate-100 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
              <Search className="text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Job title, company, or keywords" 
                className="w-full bg-transparent border-none outline-none px-3 text-slate-700 placeholder-slate-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex-1 flex items-center bg-slate-50 rounded-xl px-4 py-3 md:py-0 border border-slate-100 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
              <MapPin className="text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="City, state, or 'Remote'" 
                className="w-full bg-transparent border-none outline-none px-3 text-slate-700 placeholder-slate-400"
              />
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition-all hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2">
              Search <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Trusted Companies Strip */}
      <section className="py-10 border-y border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-8">Trusted by industry leaders</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            {featuredCompanies.map((company, idx) => (
              <img key={idx} src={company.logo} alt={company.name} className="h-8 md:h-10 object-contain hover:scale-110 transition-transform duration-300" />
            ))}
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Explore Categories</h2>
            <p className="text-slate-500">Find the role that perfectly matches your skills.</p>
          </div>
          <Link href="/job" className="hidden md:flex items-center gap-1 text-blue-600 font-semibold hover:text-blue-700 group">
            View all categories <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularCategories.map((cat, idx) => (
            <div key={idx} className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 cursor-pointer">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
                {cat.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{cat.name}</h3>
              <p className="text-slate-500 flex items-center gap-2">
                {cat.count} <ArrowRight size={14} className="opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-blue-600" />
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Internships */}
      <section className="py-24 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Premium Internships</h2>
              <p className="text-slate-500">Kickstart your career with top opportunities.</p>
            </div>
            <Link href="/internship" className="hidden md:flex items-center gap-1 text-blue-600 font-semibold hover:text-blue-700 group">
              Browse internships <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {internships.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {internships.map((internship) => (
                <div key={internship._id} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-blue-300 transition-all duration-300 group flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xl font-bold text-slate-400 overflow-hidden">
                      {internship.company.charAt(0)}
                    </div>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100 uppercase tracking-wide">
                      Actively Hiring
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">{internship.title}</h3>
                  <p className="text-slate-500 mb-6 font-medium">{internship.company}</p>
                  
                  <div className="space-y-3 mb-8 flex-grow">
                    <div className="flex items-center gap-3 text-slate-600 text-sm">
                      <MapPin size={16} className="text-slate-400" /> {internship.location}
                    </div>
                    <div className="flex items-center gap-3 text-slate-600 text-sm">
                      <Briefcase size={16} className="text-slate-400" /> {internship.stipend}
                    </div>
                    <div className="flex items-center gap-3 text-slate-600 text-sm">
                      <Calendar size={16} className="text-slate-400" /> {internship.duration}
                    </div>
                  </div>
                  
                  <Link href={`/detailiternship/${internship._id}`} className="w-full py-3 px-4 bg-slate-50 text-blue-700 font-semibold text-center rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
              <h3 className="text-lg font-bold text-slate-700 mb-2">No internships found</h3>
              <p className="text-slate-500">Check back later for premium opportunities.</p>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Success Stories</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((test, idx) => (
            <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 relative">
              <div className="text-4xl text-blue-200 absolute top-6 right-6 font-serif">"</div>
              <p className="text-slate-600 italic mb-8 relative z-10 leading-relaxed">
                "{test.quote}"
              </p>
              <div className="flex items-center gap-4">
                <img src={test.image} alt={test.name} className="w-12 h-12 rounded-full object-cover shadow-sm" />
                <div>
                  <h4 className="font-bold text-slate-900">{test.name}</h4>
                  <p className="text-xs text-slate-500">{test.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 bg-blue-600 rounded-3xl overflow-hidden relative shadow-2xl">
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-64 h-64 bg-indigo-900/20 rounded-full blur-2xl"></div>
          
          <div className="relative z-10 py-16 px-8 md:px-16 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Ready to supercharge your career?</h2>
              <p className="text-blue-100 text-lg">Join over 600,000+ professionals discovering premium jobs and building outstanding resumes.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <Link href="/register" className="bg-white text-blue-700 hover:bg-blue-50 px-8 py-4 rounded-xl font-bold transition-all hover:shadow-lg text-center whitespace-nowrap">
                Create Free Account
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
