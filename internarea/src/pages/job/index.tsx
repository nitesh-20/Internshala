import axios from "axios";
import {
  ArrowUpRight,
  Briefcase,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  Filter,
  MapPin,
  Search,
  X,
  Zap,
  GraduationCap,
  ArrowUpDown,
  Award,
  Crown
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const Index = () => {
  const { t } = useTranslation();
  const router = useRouter();

  // Raw data states
  const [jobData, setJobData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter drawer/visibility states
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  // Filters State
  const [filters, setFilters] = useState({
    search: "",
    location: "",
    salary: 0, // Min CTC range slider limit
    experience: "", // Fresher, 1+, 3+, 5+
    jobType: "", // Full-time, Part-time, Contract
    workMode: [] as string[], // Remote, Hybrid, Onsite
    company: "",
    skills: [] as string[],
    postedDate: "", // 24h, 7d, 30d
    sort: "latest"
  });

  // Pagination state
  const [visibleCount, setVisibleCount] = useState(8);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://backend-tau-snowy-58.vercel.app";

  // Fetch initial jobs data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${apiBaseUrl}/api/job`);
        setJobData(res.data);
      } catch (error) {
        console.log("Error fetching jobs", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [apiBaseUrl]);

  // Sync state with URL query parameters
  useEffect(() => {
    if (!router.isReady) return;
    const { search, location, salary, experience, jobType, workMode, company, skills, postedDate, sort } = router.query;
    
    setFilters({
      search: (search as string) || "",
      location: (location as string) || "",
      salary: salary ? parseInt(salary as string) : 0,
      experience: (experience as string) || "",
      jobType: (jobType as string) || "",
      workMode: workMode ? (Array.isArray(workMode) ? workMode : [workMode]) : [],
      company: (company as string) || "",
      skills: skills ? (skills as string).split(",") : [],
      postedDate: (postedDate as string) || "",
      sort: (sort as string) || "latest"
    });
  }, [router.isReady, router.query]);

  // Update URL Query Params on filter change
  const updateUrl = (updatedFilters: typeof filters) => {
    const query: any = {};
    if (updatedFilters.search) query.search = updatedFilters.search;
    if (updatedFilters.location) query.location = updatedFilters.location;
    if (updatedFilters.salary > 0) query.salary = updatedFilters.salary.toString();
    if (updatedFilters.experience) query.experience = updatedFilters.experience;
    if (updatedFilters.jobType) query.jobType = updatedFilters.jobType;
    if (updatedFilters.workMode.length > 0) query.workMode = updatedFilters.workMode;
    if (updatedFilters.company) query.company = updatedFilters.company;
    if (updatedFilters.skills.length > 0) query.skills = updatedFilters.skills.join(",");
    if (updatedFilters.postedDate) query.postedDate = updatedFilters.postedDate;
    if (updatedFilters.sort !== "latest") query.sort = updatedFilters.sort;

    router.replace({
      pathname: router.pathname,
      query: query
    }, undefined, { shallow: true });
  };

  const handleFilterChange = (name: string, value: any) => {
    const updated = { ...filters, [name]: value };
    setFilters(updated);
    updateUrl(updated);
    setVisibleCount(8); // Reset page count
  };

  const clearFilters = () => {
    const cleared = {
      search: "",
      location: "",
      salary: 0,
      experience: "",
      jobType: "",
      workMode: [],
      company: "",
      skills: [],
      postedDate: "",
      sort: "latest"
    };
    setFilters(cleared);
    router.replace({ pathname: router.pathname }, undefined, { shallow: true });
    setVisibleCount(8);
  };

  // Salary parser (min CTC)
  const getMinSalaryVal = (ctcStr: string) => {
    const match = ctcStr?.replace(/[^0-9\-]/g, "").split("-");
    return match ? parseInt(match[0]) : 0;
  };

  // Filter items
  const filteredJobs = jobData.filter((item: any) => {
    // 1. Search Query
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const skillsList = Array.isArray(item.skills) ? item.skills.join(",") : (item.skills || "");
      const match = 
        item.title?.toLowerCase().includes(q) ||
        item.company?.toLowerCase().includes(q) ||
        item.location?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q) ||
        skillsList.toLowerCase().includes(q);
      if (!match) return false;
    }

    // 2. Location
    if (filters.location && !item.location?.toLowerCase().includes(filters.location.toLowerCase())) {
      return false;
    }

    // 3. Salary Range (Minimum CTC)
    if (filters.salary > 0) {
      const minSalary = getMinSalaryVal(item.CTC);
      if (minSalary < filters.salary) return false;
    }

    // 4. Experience Level
    if (filters.experience) {
      const expStr = item.Experience?.toLowerCase() || "";
      if (filters.experience === "fresher" && !expStr.includes("0") && !expStr.includes("fresh")) {
        return false;
      }
      if (filters.experience === "1" && !expStr.includes("1") && !expStr.includes("fresh")) {
        return false;
      }
      if (filters.experience === "3" && !expStr.includes("3") && !expStr.includes("2") && !expStr.includes("1")) {
        return false;
      }
      if (filters.experience === "5" && !expStr.includes("5") && !expStr.includes("4")) {
        return false;
      }
    }

    // 5. Job Type
    if (filters.jobType) {
      const isPartTime = item.aboutJob?.toLowerCase().includes("part-time") || item.title?.toLowerCase().includes("part-time");
      const isContract = item.aboutJob?.toLowerCase().includes("contract") || item.title?.toLowerCase().includes("contract");
      const isFullTime = !isPartTime && !isContract;

      if (filters.jobType === "part-time" && !isPartTime) return false;
      if (filters.jobType === "contract" && !isContract) return false;
      if (filters.jobType === "full-time" && !isFullTime) return false;
    }

    // 6. Work Mode
    if (filters.workMode.length > 0) {
      const isRemote = item.location?.toLowerCase().includes("remote");
      const isHybrid = item.location?.toLowerCase().includes("hybrid");
      const isOnsite = !isRemote && !isHybrid;

      const modes = [];
      if (isRemote) modes.push("remote");
      if (isHybrid) modes.push("hybrid");
      if (isOnsite) modes.push("onsite");

      const modeMatches = filters.workMode.some(m => modes.includes(m.toLowerCase()));
      if (!modeMatches) return false;
    }

    // 7. Company Name
    if (filters.company && !item.company?.toLowerCase().includes(filters.company.toLowerCase())) {
      return false;
    }

    // 8. Skills
    if (filters.skills.length > 0) {
      const skillsStr = Array.isArray(item.skills) ? item.skills.join(",") : (item.skills || "");
      const hasSkill = filters.skills.every(s => skillsStr.toLowerCase().includes(s.toLowerCase()));
      if (!hasSkill) return false;
    }

    // 9. Posted Date
    if (filters.postedDate) {
      const dateLimit = new Date();
      if (filters.postedDate === "24h") dateLimit.setDate(dateLimit.getDate() - 1);
      else if (filters.postedDate === "7d") dateLimit.setDate(dateLimit.getDate() - 7);
      else if (filters.postedDate === "30d") dateLimit.setDate(dateLimit.getDate() - 30);
      
      const createdDate = new Date(item.createAt || Date.now());
      if (createdDate < dateLimit) return false;
    }

    return true;
  });

  // Sorting
  const sortedJobs = [...filteredJobs].sort((a: any, b: any) => {
    if (filters.sort === "highestSalary") {
      return getMinSalaryVal(b.CTC) - getMinSalaryVal(a.CTC);
    }
    if (filters.sort === "companyAZ") {
      return (a.company || "").localeCompare(b.company || "");
    }
    if (filters.sort === "popular") {
      const popA = parseInt(a._id.substring(18, 24), 16) % 50 + 10;
      const popB = parseInt(b._id.substring(18, 24), 16) % 50 + 10;
      return popB - popA;
    }
    // Default: latest
    return new Date(b.createAt || Date.now()).getTime() - new Date(a.createAt || Date.now()).getTime();
  });

  // Paginated subset
  const paginatedJobs = sortedJobs.slice(0, visibleCount);

  const toggleWorkMode = (mode: string) => {
    const list = [...filters.workMode];
    if (list.includes(mode)) {
      handleFilterChange("workMode", list.filter(m => m !== mode));
    } else {
      handleFilterChange("workMode", [...list, mode]);
    }
  };

  const toggleSkill = (skill: string) => {
    const list = [...filters.skills];
    if (list.includes(skill)) {
      handleFilterChange("skills", list.filter(s => s !== skill));
    } else {
      handleFilterChange("skills", [...list, skill]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      
      {/* Page Header */}
      <div className="bg-slate-900 border-b border-slate-800 py-14 relative overflow-hidden mb-8">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.04]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h1 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
            Discover Premium Jobs
          </h1>
          <p className="text-base text-slate-400 max-w-2xl font-medium">
            Search top permanent roles. Jobs applications are free and do not deduct application limits from your subscription plans.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Filter Container */}
          <div className="hidden lg:block w-76 flex-shrink-0">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sticky top-28 space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center space-x-2 text-slate-900">
                  <Filter className="h-5 w-5 text-indigo-600" />
                  <span className="font-extrabold text-base">{t("filters")}</span>
                </div>
                <button
                  onClick={clearFilters}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                >
                  {t("clear_all")}
                </button>
              </div>

              {/* Text Search inside filters */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Search Query</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm text-slate-700"
                    placeholder="Search titles, skills..."
                  />
                </div>
              </div>

              {/* Location Input */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t("location")}</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={filters.location}
                    onChange={(e) => handleFilterChange("location", e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm text-slate-700"
                    placeholder="e.g. Bangalore, Remote"
                  />
                </div>
              </div>

              {/* Salary Range Slider */}
              <div className="pt-4 border-t">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Min Salary (₹ LPA)</label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={filters.salary}
                  onChange={(e) => handleFilterChange("salary", parseInt(e.target.value))}
                  className="w-full accent-indigo-650 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2">
                  <span>₹0 LPA</span>
                  <span>₹25 LPA</span>
                  <span>₹50+ LPA</span>
                </div>
                <p className="text-xs text-indigo-600 font-bold mt-2">Minimum: ₹{filters.salary} LPA</p>
              </div>

              {/* Experience Level Select */}
              <div className="pt-4 border-t">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Experience Level</label>
                <select
                  value={filters.experience}
                  onChange={(e) => handleFilterChange("experience", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none"
                >
                  <option value="">Any Experience</option>
                  <option value="fresher">Freshers / 0 Years</option>
                  <option value="1">1+ Years</option>
                  <option value="3">3+ Years</option>
                  <option value="5">5+ Years</option>
                </select>
              </div>

              {/* Job Type Select */}
              <div className="pt-4 border-t">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Job Type</label>
                <select
                  value={filters.jobType}
                  onChange={(e) => handleFilterChange("jobType", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none"
                >
                  <option value="">Any Type</option>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                </select>
              </div>

              {/* Work Mode Checkboxes */}
              <div className="pt-4 border-t">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Work Mode</label>
                <div className="space-y-2">
                  {["Remote", "Hybrid", "Onsite"].map((mode) => (
                    <label key={mode} className="flex items-center space-x-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filters.workMode.includes(mode)}
                        onChange={() => toggleWorkMode(mode)}
                        className="h-4.5 w-4.5 rounded border-slate-350 text-indigo-650 focus:ring-indigo-500"
                      />
                      <span className="text-slate-650 text-sm font-semibold group-hover:text-slate-900">{mode}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Company Input */}
              <div className="pt-4 border-t">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Company</label>
                <input
                  type="text"
                  value={filters.company}
                  onChange={(e) => handleFilterChange("company", e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm text-slate-700"
                  placeholder="e.g. Amazon, Freshworks"
                />
              </div>

              {/* Skills Multi Filter */}
              <div className="pt-4 border-t">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Skills</label>
                <div className="flex flex-wrap gap-1.5">
                  {["React", "Node.js", "Python", "TypeScript", "AWS", "Flutter"].map((skill) => {
                    const active = filters.skills.includes(skill);
                    return (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-colors ${
                          active 
                            ? "bg-indigo-600 text-white border-indigo-600" 
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Posted Date Select */}
              <div className="pt-4 border-t">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Posted Time</label>
                <select
                  value={filters.postedDate}
                  onChange={(e) => handleFilterChange("postedDate", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none"
                >
                  <option value="">Anytime</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                </select>
              </div>

            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            
            {/* Mobile filters toggler and sorting selector row */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="lg:hidden w-full sm:w-auto">
                <button
                  onClick={() => setIsFilterVisible(true)}
                  className="w-full flex items-center justify-center space-x-2 bg-slate-50 border border-slate-200 py-2.5 px-4 rounded-xl text-slate-700 font-bold hover:bg-slate-100 transition-colors"
                >
                  <Filter className="h-5 w-5 text-indigo-600" />
                  <span>Show Filters</span>
                </button>
              </div>

              <div className="text-sm font-bold text-slate-500">
                Found <span className="text-slate-900">{filteredJobs.length}</span> jobs
              </div>

              {/* Sorting options */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <ArrowUpDown size={16} className="text-slate-400" />
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange("sort", e.target.value)}
                  className="bg-slate-50 border border-slate-250 rounded-xl px-3 py-2 text-xs font-bold text-slate-755 outline-none cursor-pointer"
                >
                  <option value="latest">Latest Postings</option>
                  <option value="highestSalary">Highest Salary</option>
                  <option value="companyAZ">Company A–Z</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>
            </div>

            {/* Content List */}
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((skeleton) => (
                  <div key={skeleton} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm animate-pulse h-48"></div>
                ))}
              </div>
            ) : paginatedJobs.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">No jobs found</h3>
                <p className="text-slate-500 mb-6 max-w-sm mx-auto">We couldn't find any jobs matching your current query filter parameters.</p>
                <button onClick={clearFilters} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow transition-colors">
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {paginatedJobs.map((job: any) => {
                  return (
                    <div
                      key={job._id}
                      className="group bg-white rounded-3xl border border-slate-200 p-6 hover:shadow-[0_12px_40px_rgba(0,0,0,0.05)] hover:border-indigo-300 transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl font-black text-slate-400 shrink-0">
                            {job.company?.charAt(0) || <Building2 className="text-slate-400" />}
                          </div>
                          <div>
                            <h2 className="text-lg font-extrabold text-slate-950 group-hover:text-indigo-600 transition-colors mb-0.5 line-clamp-1">
                              {job.title}
                            </h2>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{job.company}</p>
                          </div>
                        </div>
                        
                        <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-100 uppercase tracking-wide">
                          <Zap size={12} className="fill-indigo-500" /> Hiring
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-2 my-5 pl-2">
                        <div className="flex items-start gap-2 text-slate-650">
                          <MapPin className="h-4.5 w-4.5 mt-0.5 shrink-0 text-slate-400" />
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Location</p>
                            <p className="text-xs font-semibold text-slate-800 truncate max-w-[120px]">{job.location}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 text-slate-650">
                          <DollarSign className="h-4.5 w-4.5 mt-0.5 shrink-0 text-slate-400" />
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">CTC</p>
                            <p className="text-xs font-semibold text-slate-800">{job.CTC}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 text-slate-650">
                          <GraduationCap className="h-4.5 w-4.5 mt-0.5 shrink-0 text-slate-400" />
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Experience</p>
                            <p className="text-xs font-semibold text-slate-800">{job.Experience || "Not specified"}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 text-slate-650">
                          <Clock className="h-4.5 w-4.5 mt-0.5 shrink-0 text-slate-400" />
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Category</p>
                            <p className="text-xs font-semibold text-slate-800 truncate max-w-[120px]">{job.category}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-50 pl-2">
                        <span className="px-3 py-1 bg-slate-50 text-slate-650 border border-slate-100 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                          Full-time Job
                        </span>
                        
                        <Link
                          href={`/detailjob/${job._id}`}
                          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 group/btn"
                        >
                          {t("view_details")}
                          <ArrowUpRight size={14} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  );
                })}

                {/* Infinite Load More button */}
                {sortedJobs.length > visibleCount && (
                  <div className="pt-6 text-center">
                    <button
                      onClick={() => setVisibleCount(prev => prev + 8)}
                      className="px-8 py-3.5 bg-white border border-slate-250 text-slate-700 text-sm font-bold rounded-2xl shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      Load More Jobs
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Modal Drawer */}
      {isFilterVisible && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] lg:hidden animate-in fade-in duration-200">
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-2xl animate-in slide-in-from-right duration-350 flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">{t("filters")}</h2>
              <button
                onClick={() => setIsFilterVisible(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              
              <div>
                <label className="block text-xs font-bold text-slate-450 uppercase mb-2">Search Query</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-450" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm text-slate-700"
                    placeholder="Search by keywords..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-455 uppercase mb-2">Location</label>
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => handleFilterChange("location", e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700"
                  placeholder="e.g. Remote, Bangalore"
                />
              </div>

              <div className="pt-4 border-t">
                <label className="block text-xs font-bold text-slate-455 uppercase mb-3">Minimum Salary (₹ LPA)</label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={filters.salary}
                  onChange={(e) => handleFilterChange("salary", parseInt(e.target.value))}
                  className="w-full accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-2 font-semibold">
                  <span>₹0 LPA</span>
                  <span>₹25 LPA</span>
                  <span>₹50 LPA</span>
                </div>
                <p className="text-xs text-indigo-600 font-bold mt-2">Minimum: ₹{filters.salary} LPA</p>
              </div>

              <div className="pt-4 border-t">
                <label className="block text-xs font-bold text-slate-455 uppercase mb-2">Experience Level</label>
                <select
                  value={filters.experience}
                  onChange={(e) => handleFilterChange("experience", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm text-slate-750 outline-none"
                >
                  <option value="">Any Experience</option>
                  <option value="fresher">Freshers / 0 Years</option>
                  <option value="1">1+ Years</option>
                  <option value="3">3+ Years</option>
                  <option value="5">5+ Years</option>
                </select>
              </div>

              <div className="pt-4 border-t">
                <label className="block text-xs font-bold text-slate-455 uppercase mb-2">Job Type</label>
                <select
                  value={filters.jobType}
                  onChange={(e) => handleFilterChange("jobType", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm text-slate-750 outline-none"
                >
                  <option value="">Any Type</option>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                </select>
              </div>

              <div className="pt-4 border-t">
                <label className="block text-xs font-bold text-slate-455 uppercase mb-3">Work Mode</label>
                <div className="space-y-3">
                  {["Remote", "Hybrid", "Onsite"].map((mode) => (
                    <label key={mode} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.workMode.includes(mode)}
                        onChange={() => toggleWorkMode(mode)}
                        className="h-5 w-5 rounded border-slate-350 text-indigo-650"
                      />
                      <span className="text-slate-700 font-semibold text-sm">{mode}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t">
                <label className="block text-xs font-bold text-slate-455 uppercase mb-2">Posted Time</label>
                <select
                  value={filters.postedDate}
                  onChange={(e) => handleFilterChange("postedDate", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm text-slate-750 outline-none"
                >
                  <option value="">Anytime</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                </select>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-4">
              <button onClick={clearFilters} className="flex-1 py-3 text-slate-700 font-bold bg-white border border-slate-200 rounded-xl hover:bg-slate-50">
                Clear
              </button>
              <button onClick={() => setIsFilterVisible(false)} className="flex-1 py-3 text-white font-bold bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow">
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
