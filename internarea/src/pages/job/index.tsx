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
  GraduationCap
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const Index = () => {
  const { t } = useTranslation();
  const [filteredjob, setfilteredjobs] = useState<any>([]);
  const [isFiltervisible, setisFiltervisible] = useState(false);
  const [filter, setfilters] = useState({
    category: "",
    location: "",
    workFromHome: false,
    partTime: false,
    salary: 50,
    experience: "",
  });
  const [filteredJobs, setjob] = useState<any>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchdata = async () => {
      try {
        const res = await axios.get("http://localhost:5001/api/job");
        setjob(res.data);
        setfilteredjobs(res.data);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchdata();
  }, []);

  useEffect(() => {
    const filtered = filteredJobs.filter((job: any) => {
      const matchesCategory = job.category
        ?.toLowerCase()
        .includes(filter.category.toLowerCase());
      const matchesLocation = job.location
        ?.toLowerCase()
        .includes(filter.location.toLowerCase());
      return matchesCategory && matchesLocation;
    });
    setfilteredjobs(filtered);
  }, [filter, filteredJobs]);

  const handlefilterchange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setfilters((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const clearFilters = () => {
    setfilters({
      category: "",
      location: "",
      workFromHome: false,
      partTime: false,
      salary: 50,
      experience: "",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200 py-12 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Discover Premium Jobs
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl">
            Find your next big career move. Filter by role, location, salary, and experience to discover the perfect opportunity.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Filter */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-28">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-2 text-slate-800">
                  <Filter className="h-5 w-5" />
                  <span className="font-bold text-lg">{t("filters")}</span>
                </div>
                <button
                  onClick={clearFilters}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  {t("clear_all")}
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    {t("category")}
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      name="category"
                      value={filter.category}
                      onChange={handlefilterchange}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 transition-all text-sm text-slate-700 placeholder-slate-400"
                      placeholder="e.g. Software Engineer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    {t("location")}
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      name="location"
                      value={filter.location}
                      onChange={handlefilterchange}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 transition-all text-sm text-slate-700 placeholder-slate-400"
                      placeholder="e.g. Bangalore"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    {t("experience")}
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      name="experience"
                      value={filter.experience}
                      onChange={handlefilterchange}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 transition-all text-sm text-slate-700 placeholder-slate-400"
                      placeholder="e.g. 2+ years"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <label className="flex items-center space-x-3 mb-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        name="workFromHome"
                        checked={filter.workFromHome}
                        onChange={handlefilterchange}
                        className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 checked:border-blue-600 checked:bg-blue-600 transition-all"
                      />
                      <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <span className="text-slate-700 text-sm font-medium group-hover:text-slate-900 transition-colors">{t("work_from_home")}</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        name="partTime"
                        checked={filter.partTime}
                        onChange={handlefilterchange}
                        className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 checked:border-blue-600 checked:bg-blue-600 transition-all"
                      />
                      <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <span className="text-slate-700 text-sm font-medium group-hover:text-slate-900 transition-colors">{t("part_time")}</span>
                  </label>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <label className="block text-sm font-semibold text-slate-700 mb-4">
                    {t("annual_salary")}
                  </label>
                  <input
                    type="range"
                    name="salary"
                    min="0"
                    max="100"
                    value={filter.salary}
                    onChange={handlefilterchange}
                    className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs font-medium text-slate-500 mt-2">
                    <span>₹0L</span>
                    <span>₹50L</span>
                    <span>₹100L+</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="lg:hidden mb-4">
              <button
                onClick={() => setisFiltervisible(true)}
                className="w-full flex items-center justify-center space-x-2 bg-white border border-slate-200 py-3 rounded-xl shadow-sm text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                <Filter className="h-5 w-5" />
                <span>Show Filters</span>
              </button>
            </div>

            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800">
                {filteredjob.length} {t("jobs_found")}
              </h2>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((skeleton) => (
                  <div key={skeleton} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm animate-pulse">
                    <div className="flex justify-between mb-4">
                      <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
                      <div className="w-24 h-6 bg-slate-200 rounded-full"></div>
                    </div>
                    <div className="w-1/2 h-6 bg-slate-200 rounded mb-2"></div>
                    <div className="w-1/3 h-4 bg-slate-200 rounded mb-6"></div>
                    <div className="flex gap-4 mb-6">
                      <div className="w-20 h-4 bg-slate-200 rounded"></div>
                      <div className="w-20 h-4 bg-slate-200 rounded"></div>
                    </div>
                    <div className="flex justify-between">
                      <div className="w-24 h-6 bg-slate-200 rounded-full"></div>
                      <div className="w-24 h-10 bg-slate-200 rounded-xl"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredjob.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">No jobs found</h3>
                <p className="text-slate-500 mb-6 max-w-sm mx-auto">We couldn't find any jobs matching your current filters. Try adjusting your search criteria.</p>
                <button onClick={clearFilters} className="px-6 py-2 bg-blue-50 text-blue-700 font-semibold rounded-xl hover:bg-blue-100 transition-colors">
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredjob.map((job: any) => (
                  <div
                    key={job._id}
                    className="group bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-300 relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-4">
                        <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl font-bold text-slate-400 shrink-0">
                          {job.company?.charAt(0) || <Building2 className="text-slate-400" />}
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-1 line-clamp-1">
                            {job.title}
                          </h2>
                          <p className="text-slate-500 font-medium">{job.company}</p>
                        </div>
                      </div>
                      <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100 uppercase tracking-wide">
                        <Zap size={12} className="fill-emerald-500" /> Hiring
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-2 mb-6 ml-0 sm:ml-18">
                      <div className="flex items-start gap-2 text-slate-600">
                        <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-slate-400" />
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Location</p>
                          <p className="text-sm font-medium">{job.location}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-slate-600">
                        <DollarSign className="h-4 w-4 mt-0.5 shrink-0 text-slate-400" />
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">CTC</p>
                          <p className="text-sm font-medium">{job.CTC}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-slate-600">
                        <GraduationCap className="h-4 w-4 mt-0.5 shrink-0 text-slate-400" />
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Experience</p>
                          <p className="text-sm font-medium">{job.Experience || "Not specified"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-slate-600">
                        <Calendar className="h-4 w-4 mt-0.5 shrink-0 text-slate-400" />
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Category</p>
                          <p className="text-sm font-medium">{job.category}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 ml-0 sm:ml-18">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                        Job
                      </span>
                      
                      <Link
                        href={`/detailjob/${job._id}`}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2 group/btn"
                      >
                        {t("view_details")}
                        <ArrowUpRight size={16} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Modal */}
      {isFiltervisible && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] lg:hidden animate-in fade-in duration-200">
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">{t("filters")}</h2>
              <button
                onClick={() => setisFiltervisible(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              {/* Profile/Category Filter */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {t("category")}
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    name="category"
                    value={filter.category}
                    onChange={handlefilterchange}
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm text-slate-700"
                    placeholder="e.g. Software Engineer"
                  />
                </div>
              </div>

              {/* Location Filter */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {t("location")}
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    name="location"
                    value={filter.location}
                    onChange={handlefilterchange}
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm text-slate-700"
                    placeholder="e.g. Bangalore"
                  />
                </div>
              </div>

              {/* Experience Filter */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {t("experience")}
                </label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    name="experience"
                    value={filter.experience}
                    onChange={handlefilterchange}
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm text-slate-700"
                    placeholder="e.g. 2+ years"
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="pt-4 border-t border-slate-100">
                <label className="flex items-center space-x-3 mb-4">
                  <input
                    type="checkbox"
                    name="workFromHome"
                    checked={filter.workFromHome}
                    onChange={handlefilterchange}
                    className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700 font-medium">{t("work_from_home")}</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="partTime"
                    checked={filter.partTime}
                    onChange={handlefilterchange}
                    className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700 font-medium">{t("part_time")}</span>
                </label>
              </div>

              {/* Stipend Range */}
              <div className="pt-4 border-t border-slate-100">
                <label className="block text-sm font-semibold text-slate-700 mb-4">
                  {t("annual_salary")} (₹ in lakhs)
                </label>
                <input
                  type="range"
                  name="salary"
                  min="0"
                  max="100"
                  value={filter.salary}
                  onChange={handlefilterchange}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-xs font-medium text-slate-500 mt-2">
                  <span>₹0L</span>
                  <span>₹50L</span>
                  <span>₹100L+</span>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-4">
              <button onClick={clearFilters} className="flex-1 py-3 text-slate-700 font-semibold bg-white border border-slate-200 rounded-xl hover:bg-slate-50">
                Clear
              </button>
              <button onClick={() => setisFiltervisible(false)} className="flex-1 py-3 text-white font-semibold bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm">
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
