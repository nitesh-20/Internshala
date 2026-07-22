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
  ChevronDown,
  ArrowUpDown,
  BookOpen,
  Sparkles,
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
  const [internshipData, setInternshipData] = useState<any[]>([]);
  const [userApplications, setUserApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter drawer/visibility states
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  // Filters State
  const [filters, setFilters] = useState({
    search: "",
    location: "",
    workMode: [] as string[], // Remote, Hybrid, Onsite
    stipend: 0,
    duration: "",
    category: "",
    company: "",
    skills: [] as string[],
    postedDate: "", // 24h, 7d, 30d
    premiumOnly: false,
    subEligible: false,
    sort: "latest"
  });

  // Pagination state
  const [visibleCount, setVisibleCount] = useState(8);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://backend-tau-snowy-58.vercel.app";

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [intRes, appRes] = await Promise.all([
          axios.get(`${apiBaseUrl}/api/internship`),
          axios.get(`${apiBaseUrl}/api/application`).catch(() => ({ data: [] }))
        ]);
        setInternshipData(intRes.data);
        setUserApplications(appRes.data);
      } catch (error) {
        console.log("Error fetching data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [apiBaseUrl]);

  // Sync state with URL params
  useEffect(() => {
    if (!router.isReady) return;
    const { search, location, workMode, stipend, duration, category, company, skills, postedDate, premiumOnly, subEligible, sort } = router.query;
    
    setFilters({
      search: (search as string) || "",
      location: (location as string) || "",
      workMode: workMode ? (Array.isArray(workMode) ? workMode : [workMode]) : [],
      stipend: stipend ? parseInt(stipend as string) : 0,
      duration: (duration as string) || "",
      category: (category as string) || "",
      company: (company as string) || "",
      skills: skills ? (skills as string).split(",") : [],
      postedDate: (postedDate as string) || "",
      premiumOnly: premiumOnly === "true",
      subEligible: subEligible === "true",
      sort: (sort as string) || "latest"
    });
  }, [router.isReady, router.query]);

  // Update URL Query Params on filter change
  const updateUrl = (updatedFilters: typeof filters) => {
    const query: any = {};
    if (updatedFilters.search) query.search = updatedFilters.search;
    if (updatedFilters.location) query.location = updatedFilters.location;
    if (updatedFilters.workMode.length > 0) query.workMode = updatedFilters.workMode;
    if (updatedFilters.stipend > 0) query.stipend = updatedFilters.stipend.toString();
    if (updatedFilters.duration) query.duration = updatedFilters.duration;
    if (updatedFilters.category) query.category = updatedFilters.category;
    if (updatedFilters.company) query.company = updatedFilters.company;
    if (updatedFilters.skills.length > 0) query.skills = updatedFilters.skills.join(",");
    if (updatedFilters.postedDate) query.postedDate = updatedFilters.postedDate;
    if (updatedFilters.premiumOnly) query.premiumOnly = "true";
    if (updatedFilters.subEligible) query.subEligible = "true";
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
      workMode: [],
      stipend: 0,
      duration: "",
      category: "",
      company: "",
      skills: [],
      postedDate: "",
      premiumOnly: false,
      subEligible: false,
      sort: "latest"
    };
    setFilters(cleared);
    router.replace({ pathname: router.pathname }, undefined, { shallow: true });
    setVisibleCount(8);
  };

  // Stipend parser
  const getStipendVal = (stipendStr: string) => {
    return parseInt(stipendStr?.replace(/[^0-9]/g, "") || "0");
  };

  // Filter and sort items
  const filteredInternships = internshipData.filter((item: any) => {
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

    // 2. Location text
    if (filters.location && !item.location?.toLowerCase().includes(filters.location.toLowerCase())) {
      return false;
    }

    // 3. Work Mode Checkboxes
    if (filters.workMode.length > 0) {
      const isRemote = item.location?.toLowerCase().includes("remote");
      const isHybrid = item.location?.toLowerCase().includes("hybrid");
      const isOnsite = !isRemote && !isHybrid;
      
      const modes: string[] = [];
      if (isRemote) modes.push("remote");
      if (isHybrid) modes.push("hybrid");
      if (isOnsite) modes.push("onsite");

      const modeMatches = filters.workMode.some(m => modes.includes(m.toLowerCase()));
      if (!modeMatches) return false;
    }

    // 4. Stipend Slider (Minimum stipend)
    if (filters.stipend > 0) {
      const stipendVal = getStipendVal(item.stipend);
      if (stipendVal < filters.stipend) return false;
    }

    // 5. Duration
    if (filters.duration) {
      if (!item.duration?.toLowerCase().includes(filters.duration.toLowerCase())) {
        return false;
      }
    }

    // 6. Category
    if (filters.category && !item.category?.toLowerCase().includes(filters.category.toLowerCase())) {
      return false;
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
      
      const createdDate = new Date(item.createdAt || Date.now());
      if (createdDate < dateLimit) return false;
    }

    // 10. Premium Only
    if (filters.premiumOnly) {
      const stipendVal = getStipendVal(item.stipend);
      if (stipendVal < 20000) return false;
    }

    // 11. Subscription Eligible (Paid internships only)
    if (filters.subEligible) {
      const stipendVal = getStipendVal(item.stipend);
      if (stipendVal <= 0) return false;
    }

    return true;
  });

  // Sorting
  const sortedInternships = [...filteredInternships].sort((a: any, b: any) => {
    if (filters.sort === "highestStipend") {
      return getStipendVal(b.stipend) - getStipendVal(a.stipend);
    }
    if (filters.sort === "lowestStipend") {
      return getStipendVal(a.stipend) - getStipendVal(b.stipend);
    }
    if (filters.sort === "popular") {
      const popA = parseInt(a._id.substring(18, 24), 16) % 50 + 10;
      const popB = parseInt(b._id.substring(18, 24), 16) % 50 + 10;
      return popB - popA;
    }
    if (filters.sort === "applied") {
      const isAppliedA = userApplications.some(app => app.Application?._id === a._id || app.Application === a._id);
      const isAppliedB = userApplications.some(app => app.Application?._id === b._id || app.Application === b._id);
      return (isAppliedB ? 1 : 0) - (isAppliedA ? 1 : 0);
    }
    // Default: latest
    return new Date(b.createdAt || Date.now()).getTime() - new Date(a.createdAt || Date.now()).getTime();
  });

  // Paginated subset
  const paginatedInternships = sortedInternships.slice(0, visibleCount);

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
            Discover Premium Internships
          </h1>
          <p className="text-base text-slate-400 max-w-2xl font-medium">
            Browse high-stipend verified roles. Apply filters or sort by stipend to find the absolute best fit for your career.
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
                  <Filter className="h-5 w-5 text-blue-600" />
                  <span className="font-extrabold text-base">{t("filters")}</span>
                </div>
                <button
                  onClick={clearFilters}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700"
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
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm text-slate-700"
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
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm text-slate-700"
                    placeholder="e.g. Remote, Pune"
                  />
                </div>
              </div>

              {/* Category Select */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t("category")}</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={filters.category}
                    onChange={(e) => handleFilterChange("category", e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm text-slate-700"
                    placeholder="e.g. Web Development"
                  />
                </div>
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
                        className="h-4.5 w-4.5 rounded border-slate-350 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-slate-650 text-sm font-semibold group-hover:text-slate-900">{mode}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Minimum Stipend Slider */}
              <div className="pt-4 border-t">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Min Stipend (₹)</label>
                <input
                  type="range"
                  min="0"
                  max="40000"
                  step="5000"
                  value={filters.stipend}
                  onChange={(e) => handleFilterChange("stipend", parseInt(e.target.value))}
                  className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2">
                  <span>₹0</span>
                  <span>₹20K</span>
                  <span>₹40K+</span>
                </div>
                <p className="text-xs text-blue-600 font-bold mt-2">Minimum: ₹{filters.stipend.toLocaleString('en-IN')}/mo</p>
              </div>

              {/* Duration filter */}
              <div className="pt-4 border-t">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Duration</label>
                <select
                  value={filters.duration}
                  onChange={(e) => handleFilterChange("duration", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none"
                >
                  <option value="">Any Duration</option>
                  <option value="1 Month">1 Month</option>
                  <option value="2 Months">2 Months</option>
                  <option value="3 Months">3 Months</option>
                  <option value="4 Months">4 Months</option>
                  <option value="6 Months">6 Months</option>
                </select>
              </div>

              {/* Skills Multi Filter */}
              <div className="pt-4 border-t">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Skills</label>
                <div className="flex flex-wrap gap-1.5">
                  {["React", "Node.js", "Python", "Figma", "Excel", "Java"].map((skill) => {
                    const active = filters.skills.includes(skill);
                    return (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-colors ${
                          active 
                            ? "bg-blue-600 text-white border-blue-600" 
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Company Input */}
              <div className="pt-4 border-t">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Company</label>
                <input
                  type="text"
                  value={filters.company}
                  onChange={(e) => handleFilterChange("company", e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm text-slate-700"
                  placeholder="e.g. Google, Zoho"
                />
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

              {/* Flags checks */}
              <div className="pt-4 border-t space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.premiumOnly}
                    onChange={(e) => handleFilterChange("premiumOnly", e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600"
                  />
                  <span className="text-slate-700 text-sm font-semibold group-hover:text-slate-900 flex items-center gap-1">
                    <Crown size={14} className="text-amber-500 fill-amber-500/20" /> Premium Only
                  </span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.subEligible}
                    onChange={(e) => handleFilterChange("subEligible", e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600"
                  />
                  <span className="text-slate-700 text-sm font-semibold group-hover:text-slate-900">
                    Subscription Eligible
                  </span>
                </label>
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
                  <Filter className="h-5 w-5 text-blue-600" />
                  <span>Show Filters</span>
                </button>
              </div>

              <div className="text-sm font-bold text-slate-500">
                Found <span className="text-slate-900">{filteredInternships.length}</span> internships
              </div>

              {/* Sorting options */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <ArrowUpDown size={16} className="text-slate-400" />
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange("sort", e.target.value)}
                  className="bg-slate-50 border border-slate-250 rounded-xl px-3 py-2 text-xs font-bold text-slate-750 outline-none cursor-pointer"
                >
                  <option value="latest">Latest Postings</option>
                  <option value="highestStipend">Highest Stipend</option>
                  <option value="lowestStipend">Lowest Stipend</option>
                  <option value="popular">Most Popular</option>
                  <option value="applied">Applied Internships</option>
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
            ) : paginatedInternships.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">No internships found</h3>
                <p className="text-slate-500 mb-6 max-w-sm mx-auto">We couldn't find any internships matching your current query filter parameters.</p>
                <button onClick={clearFilters} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow transition-colors">
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {paginatedInternships.map((internship: any) => {
                  const isPremium = getStipendVal(internship.stipend) >= 20000;
                  const isApplied = userApplications.some(app => app.Application?._id === internship._id || app.Application === internship._id);
                  return (
                    <div
                      key={internship._id}
                      className="group bg-white rounded-3xl border border-slate-200 p-6 hover:shadow-[0_12px_40px_rgba(0,0,0,0.05)] hover:border-blue-300 transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl font-black text-slate-400 shrink-0">
                            {internship.company?.charAt(0) || <Building2 className="text-slate-400" />}
                          </div>
                          <div>
                            <h2 className="text-lg font-extrabold text-slate-950 group-hover:text-blue-600 transition-colors mb-0.5 line-clamp-1">
                              {internship.title}
                            </h2>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{internship.company}</p>
                          </div>
                        </div>
                        
                        <div className="flex gap-1.5">
                          {isApplied && (
                            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded border border-emerald-100 uppercase tracking-wider">
                              Applied
                            </span>
                          )}
                          {isPremium && (
                            <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded border border-amber-200 uppercase tracking-wider flex items-center gap-0.5">
                              <Crown size={10} className="fill-amber-500" /> Premium
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-2 my-5 pl-2">
                        <div className="flex items-start gap-2 text-slate-650">
                          <MapPin className="h-4.5 w-4.5 mt-0.5 shrink-0 text-slate-400" />
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Location</p>
                            <p className="text-xs font-semibold text-slate-800 truncate max-w-[120px]">{internship.location}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 text-slate-650">
                          <DollarSign className="h-4.5 w-4.5 mt-0.5 shrink-0 text-slate-400" />
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Stipend</p>
                            <p className="text-xs font-semibold text-slate-800">{internship.stipend}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 text-slate-650">
                          <Calendar className="h-4.5 w-4.5 mt-0.5 shrink-0 text-slate-400" />
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Duration</p>
                            <p className="text-xs font-semibold text-slate-800">{internship.duration}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 text-slate-650">
                          <Clock className="h-4.5 w-4.5 mt-0.5 shrink-0 text-slate-400" />
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Start Date</p>
                            <p className="text-xs font-semibold text-slate-800">{internship.startDate}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-50 pl-2">
                        <span className="px-3 py-1 bg-slate-50 text-slate-650 border border-slate-100 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                          {internship.category || "General"}
                        </span>
                        
                        <Link
                          href={`/detailiternship/${internship._id}`}
                          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 group/btn"
                        >
                          {t("view_details")}
                          <ArrowUpRight size={14} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  );
                })}

                {/* Infinite Load More button */}
                {sortedInternships.length > visibleCount && (
                  <div className="pt-6 text-center">
                    <button
                      onClick={() => setVisibleCount(prev => prev + 8)}
                      className="px-8 py-3.5 bg-white border border-slate-250 text-slate-700 text-sm font-bold rounded-2xl shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      Load More Internships
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
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm text-slate-700"
                    placeholder="Search by keywords..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-450 uppercase mb-2">Location</label>
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => handleFilterChange("location", e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700"
                  placeholder="e.g. Remote, Bangalore"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-450 uppercase mb-2">Category</label>
                <input
                  type="text"
                  value={filters.category}
                  onChange={(e) => handleFilterChange("category", e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700"
                  placeholder="e.g. Engineering"
                />
              </div>

              <div className="pt-4 border-t">
                <label className="block text-xs font-bold text-slate-450 uppercase mb-3">Work Mode</label>
                <div className="space-y-3">
                  {["Remote", "Hybrid", "Onsite"].map((mode) => (
                    <label key={mode} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.workMode.includes(mode)}
                        onChange={() => toggleWorkMode(mode)}
                        className="h-5 w-5 rounded border-slate-350 text-blue-600"
                      />
                      <span className="text-slate-700 font-semibold text-sm">{mode}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t">
                <label className="block text-xs font-bold text-slate-450 uppercase mb-3">Minimum Monthly Stipend</label>
                <input
                  type="range"
                  min="0"
                  max="40000"
                  step="5000"
                  value={filters.stipend}
                  onChange={(e) => handleFilterChange("stipend", parseInt(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-2 font-semibold">
                  <span>₹0</span>
                  <span>₹20K</span>
                  <span>₹40K+</span>
                </div>
                <p className="text-xs text-blue-600 font-bold mt-2">Minimum: ₹{filters.stipend.toLocaleString('en-IN')}</p>
              </div>

              <div className="pt-4 border-t">
                <label className="block text-xs font-bold text-slate-450 uppercase mb-2">Duration</label>
                <select
                  value={filters.duration}
                  onChange={(e) => handleFilterChange("duration", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm text-slate-750 outline-none"
                >
                  <option value="">Any Duration</option>
                  <option value="1 Month">1 Month</option>
                  <option value="2 Months">2 Months</option>
                  <option value="3 Months">3 Months</option>
                  <option value="4 Months">4 Months</option>
                  <option value="6 Months">6 Months</option>
                </select>
              </div>

              <div className="pt-4 border-t">
                <label className="block text-xs font-bold text-slate-450 uppercase mb-2">Posted Time</label>
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

              <div className="pt-4 border-t space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.premiumOnly}
                    onChange={(e) => handleFilterChange("premiumOnly", e.target.checked)}
                    className="h-5 w-5 rounded border-slate-350 text-blue-600"
                  />
                  <span className="text-slate-700 font-semibold text-sm">Premium Stipend Roles</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.subEligible}
                    onChange={(e) => handleFilterChange("subEligible", e.target.checked)}
                    className="h-5 w-5 rounded border-slate-350 text-blue-600"
                  />
                  <span className="text-slate-700 font-semibold text-sm">Subscription Eligible</span>
                </label>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-4">
              <button onClick={clearFilters} className="flex-1 py-3 text-slate-700 font-bold bg-white border border-slate-200 rounded-xl hover:bg-slate-50">
                Clear
              </button>
              <button onClick={() => setIsFilterVisible(false)} className="flex-1 py-3 text-white font-bold bg-blue-600 rounded-xl hover:bg-blue-700 shadow">
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
