import React, { useEffect, useState } from "react";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  Tag,
  User,
  XCircle,
  MoreVertical,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { selectuser } from "@/Feature/Userslice";
import { useSelector } from "react-redux";

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "approved":
    case "accepted":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "rejected":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-amber-100 text-amber-700 border-amber-200";
  }
};

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case "approved":
    case "accepted":
      return <CheckCircle2 size={16} className="text-emerald-600" />;
    case "rejected":
      return <XCircle size={16} className="text-red-600" />;
    default:
      return <Clock size={16} className="text-amber-600" />;
  }
};

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const user = useSelector(selectuser);
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("https://backend-tau-snowy-58.vercel.app/api/application");
        setData(res.data);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const userApplication = data.filter(
    (app: any) => app.user?.name === user?.name || app.user?.email === user?.email
  );

  const filteredApplications = userApplication.filter((application: any) => {
    const searchMatch =
      application.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.category?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === "all") return searchMatch;
    return searchMatch && application.status?.toLowerCase() === filter;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-10 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">My Applications</h1>
            <p className="text-slate-500">Track and manage your internship and job applications</p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center min-w-[100px]">
              <span className="text-2xl font-bold text-blue-600">{userApplication.length}</span>
              <span className="text-xs font-semibold text-slate-500 uppercase">Total</span>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center min-w-[100px]">
              <span className="text-2xl font-bold text-emerald-600">
                {userApplication.filter(a => a.status?.toLowerCase() === 'approved' || a.status?.toLowerCase() === 'accepted').length}
              </span>
              <span className="text-xs font-semibold text-slate-500 uppercase">Approved</span>
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-8 flex flex-col lg:flex-row justify-between items-center gap-4">
          <div className="w-full lg:w-96 relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search companies or roles..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-700"
            />
          </div>
          
          <div className="w-full lg:w-auto flex flex-wrap gap-2">
            {[
              { id: "all", label: "All Applications" },
              { id: "pending", label: "Pending" },
              { id: "approved", label: "Approved" },
              { id: "rejected", label: "Rejected" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex-1 lg:flex-none text-center ${
                  filter === f.id
                    ? "bg-slate-800 text-white shadow-md"
                    : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Applications List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((skeleton) => (
              <div key={skeleton} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm animate-pulse">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
                  <div className="w-20 h-6 bg-slate-200 rounded-full"></div>
                </div>
                <div className="w-3/4 h-5 bg-slate-200 rounded mb-2"></div>
                <div className="w-1/2 h-4 bg-slate-200 rounded mb-6"></div>
                <div className="border-t border-slate-100 pt-4 flex justify-between">
                  <div className="w-24 h-4 bg-slate-200 rounded"></div>
                  <div className="w-24 h-4 bg-slate-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Filter className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No applications found</h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              You haven't applied to any roles matching these criteria yet. Keep exploring and applying!
            </p>
            {filter !== "all" || searchTerm ? (
              <button 
                onClick={() => { setFilter("all"); setSearchTerm(""); }} 
                className="px-6 py-2.5 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-700 transition-colors shadow-sm"
              >
                Clear Filters
              </button>
            ) : (
              <Link href="/" className="inline-block px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
                Browse Opportunities
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApplications.map((application: any) => (
              <div 
                key={application._id} 
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden"
              >
                {/* Status Indicator Line */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                  application.status?.toLowerCase() === 'approved' || application.status?.toLowerCase() === 'accepted' ? 'bg-emerald-500' :
                  application.status?.toLowerCase() === 'rejected' ? 'bg-red-500' : 'bg-amber-500'
                }`}></div>

                <div className="flex justify-between items-start mb-5 pl-2">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                      <Building2 className="text-slate-400" size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {application.category}
                      </h3>
                      <p className="text-sm font-medium text-slate-500">{application.company}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-6 pl-2">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <User size={16} className="text-slate-400" />
                    <span className="font-medium text-slate-700">{application.user?.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Calendar size={16} className="text-slate-400" />
                    <span>Applied on {application.createdAt ? new Date(application.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
                  </div>
                </div>

                <div className="pt-5 border-t border-slate-100 flex items-center justify-between pl-2">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider ${getStatusColor(application.status || 'pending')}`}>
                    {getStatusIcon(application.status || 'pending')}
                    <span>{application.status || 'Pending'}</span>
                  </div>
                  
                  <button className="text-slate-400 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-blue-50">
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
