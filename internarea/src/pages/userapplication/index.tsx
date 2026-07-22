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
  ChevronRight,
  Trash2,
  Eye,
  X
} from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { selectuser } from "@/Feature/Userslice";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "accepted":
    case "approved":
    case "offer":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "rejected":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "interview":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "under review":
      return "bg-blue-50 text-blue-700 border-blue-200";
    default:
      return "bg-amber-50 text-amber-700 border-amber-200";
  }
};

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case "accepted":
    case "approved":
    case "offer":
      return <CheckCircle2 size={14} className="text-emerald-600" />;
    case "rejected":
      return <XCircle size={14} className="text-red-600" />;
    case "interview":
      return <Clock size={14} className="text-purple-600" />;
    case "under review":
      return <Clock size={14} className="text-blue-600" />;
    default:
      return <Clock size={14} className="text-amber-600" />;
  }
};

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const user = useSelector(selectuser);
  const [data, setData] = useState<any[]>([]);
  const [internships, setInternships] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal states
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://backend-tau-snowy-58.vercel.app";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appRes, intRes] = await Promise.all([
          axios.get(`${apiBaseUrl}/api/application`),
          axios.get(`${apiBaseUrl}/api/internship`)
        ]);
        setData(appRes.data);
        setInternships(intRes.data);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [apiBaseUrl]);

  // Extract internship IDs
  const internshipIds = internships.map((i: any) => i._id);

  // Filter ONLY internship applications for the current logged-in user
  const userApplication = data.filter(
    (app: any) => 
      (app.user?.name === user?.name || app.user?.email === user?.email) &&
      internshipIds.includes(app.Application?._id || app.Application)
  );

  const filteredApplications = userApplication.filter((application: any) => {
    const searchMatch =
      application.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.category?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === "all") return searchMatch;
    return searchMatch && (application.status || 'pending').toLowerCase() === filter;
  });

  const handleWithdraw = (id: string) => {
    if (confirm("Are you sure you want to withdraw this application? This action cannot be undone.")) {
      // Simulate deletion on local UI list
      setData(prev => prev.filter(app => app._id !== id));
      toast.success("Application withdrawn successfully!");
    }
  };

  const handleOpenDetails = (app: any) => {
    setSelectedApp(app);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">My Applications</h1>
            <p className="text-slate-500 font-medium">Track your premium internship applications. Subscription limits apply to these applications.</p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-white px-5 py-3 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col items-center justify-center min-w-[120px]">
              <span className="text-2xl font-black text-blue-600">{userApplication.length}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Applied</span>
            </div>
            <div className="bg-white px-5 py-3 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col items-center justify-center min-w-[120px]">
              <span className="text-2xl font-black text-emerald-600">
                {userApplication.filter(a => a.status?.toLowerCase() === 'approved' || a.status?.toLowerCase() === 'accepted').length}
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Accepted</span>
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100 mb-8 flex flex-col lg:flex-row justify-between items-center gap-4">
          <div className="w-full lg:w-96 relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by company or role..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-700 text-sm font-semibold"
            />
          </div>
          
          <div className="w-full lg:w-auto flex flex-wrap gap-2">
            {[
              { id: "all", label: "All Applications" },
              { id: "pending", label: "Pending" },
              { id: "accepted", label: "Accepted" },
              { id: "rejected", label: "Rejected" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex-1 lg:flex-none text-center ${
                  filter === f.id
                    ? "bg-slate-800 text-white shadow-md"
                    : "bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Applications Tracking Cards */}
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
          <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Filter className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No applications found</h3>
            <p className="text-slate-400 mb-6 max-w-sm mx-auto font-medium">
              You haven't applied to any internships matching these filter parameters yet.
            </p>
            {filter !== "all" || searchTerm ? (
              <button 
                onClick={() => { setFilter("all"); setSearchTerm(""); }} 
                className="px-6 py-2.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors shadow"
              >
                Clear Filters
              </button>
            ) : (
              <Link href="/internship" className="inline-block px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow">
                Browse Internships
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApplications.map((application: any) => (
              <div 
                key={application._id} 
                className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-blue-200 transition-all duration-350 group relative overflow-hidden flex flex-col justify-between"
              >
                {/* Accent line */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                  application.status?.toLowerCase() === 'approved' || application.status?.toLowerCase() === 'accepted' ? 'bg-emerald-500' :
                  application.status?.toLowerCase() === 'rejected' ? 'bg-rose-500' : 'bg-amber-500'
                }`}></div>

                <div>
                  <div className="flex justify-between items-start mb-5 pl-2">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 font-bold text-slate-400">
                        {application.company?.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors text-base">
                          {application.category}
                        </h3>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{application.company}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6 pl-2 text-xs font-semibold text-slate-500">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-slate-400" />
                      <span>{application.user?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-slate-400" />
                      <span>Applied: {application.createdAt ? new Date(application.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between pl-2 gap-2 mt-auto">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${getStatusColor(application.status || 'pending')}`}>
                    {getStatusIcon(application.status || 'pending')}
                    <span>{application.status || 'Pending'}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleOpenDetails(application)}
                      className="p-2 bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors border border-slate-100"
                      title="View Details"
                    >
                      <Eye size={14} />
                    </button>
                    <button 
                      onClick={() => handleWithdraw(application._id)}
                      className="p-2 bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors border border-slate-100"
                      title="Withdraw Application"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for Application Details */}
      {isDetailModalOpen && selectedApp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-xl w-full mx-4 transform scale-100 transition-all max-h-[90vh] overflow-y-auto relative border">
            <button 
              onClick={() => setIsDetailModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                {selectedApp.company?.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">{selectedApp.category}</h2>
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{selectedApp.company}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Application Status</span>
                <div className={`w-fit mt-1.5 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider ${getStatusColor(selectedApp.status || 'pending')}`}>
                  {getStatusIcon(selectedApp.status || 'pending')}
                  <span>{selectedApp.status || 'Pending'}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Applicant Profile</span>
                <div className="bg-slate-50 p-3 rounded-xl border mt-1 text-sm font-semibold text-slate-700">
                  <p>{selectedApp.user?.name}</p>
                  <p className="text-slate-400 text-xs font-normal mt-0.5">{selectedApp.user?.email}</p>
                </div>
              </div>

              {selectedApp.resumeUrl && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Submitted Resume</span>
                  <a 
                    href={selectedApp.resumeUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline mt-1 font-semibold"
                  >
                    <ExternalLink size={14} /> View Attached PDF Resume
                  </a>
                </div>
              )}

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Cover Letter</span>
                <div className="bg-slate-50 p-4 rounded-2xl border text-sm text-slate-600 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-line mt-1.5">
                  {selectedApp.coverLetter || "No cover letter submitted."}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
