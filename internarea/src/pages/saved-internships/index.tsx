import React, { useEffect, useState } from "react";
import { 
  Bookmark, MapPin, Briefcase, Calendar, ChevronRight, Share2, Trash2, ArrowRight, Sparkles, Search, X 
} from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { toast } from "react-toastify";

const SavedInternships = () => {
  const [internships, setInternships] = useState<any[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://backend-tau-snowy-58.vercel.app";

  useEffect(() => {
    const saved = localStorage.getItem("saved_opportunities");
    if (saved) {
      setSavedIds(JSON.parse(saved));
    }

    const fetchInternships = async () => {
      try {
        const res = await axios.get(`${apiBaseUrl}/api/internship`);
        setInternships(res.data);
      } catch (err) {
        console.log(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInternships();
  }, [apiBaseUrl]);

  const savedInternships = internships.filter(item => 
    savedIds.includes(item._id) &&
    (item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     item.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     item.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (item.skills && (Array.isArray(item.skills) ? item.skills.join(",") : item.skills).toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const handleUnsave = (id: string) => {
    const updated = savedIds.filter(item => item !== id);
    setSavedIds(updated);
    localStorage.setItem("saved_opportunities", JSON.stringify(updated));
    toast.success("Internship removed from saved list");
  };

  const handleShare = (id: string) => {
    const shareUrl = `${window.location.origin}/detailiternship/${id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success("Share link copied to clipboard!");
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <Bookmark className="text-blue-600 fill-blue-600/10" size={28} /> Saved Internships
            </h1>
            <p className="text-slate-500 font-semibold mt-1">Review and manage your bookmarked premium internships.</p>
          </div>
          <Link href="/internship" className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">
            Browse Internships <ArrowRight size={16} />
          </Link>
        </div>

        {/* Search Box */}
        <div className="bg-white p-4 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-150 mb-8 flex items-center gap-3 max-w-md">
          <Search className="text-slate-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search saved internships..."
            className="w-full bg-transparent border-none outline-none text-sm text-slate-700 font-semibold"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="text-slate-400 hover:text-slate-650">
              <X size={16} />
            </button>
          )}
        </div>

        {/* List Content */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((s) => (
              <div key={s} className="bg-white p-6 rounded-2xl border animate-pulse h-32 w-full"></div>
            ))}
          </div>
        ) : savedInternships.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bookmark className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No saved internships</h3>
            <p className="text-slate-400 mb-6 max-w-sm mx-auto font-medium">
              You haven't bookmarked any premium internships yet. Browse list to save.
            </p>
            <Link href="/internship" className="inline-block px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow">
              Explore Internships
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {savedInternships.map((internship) => (
              <div key={internship._id} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-blue-200 transition-all duration-300 flex flex-col justify-between group">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-lg font-black text-slate-400">
                      {internship.company?.charAt(0)}
                    </div>
                    <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded border border-blue-100 uppercase tracking-wider">
                      Intern
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-1">{internship.company}</h3>
                  <h4 className="text-lg font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 mb-3">
                    {internship.title}
                  </h4>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-semibold mb-4 border-b border-slate-50 pb-4">
                    <div className="flex items-center gap-1">
                      <MapPin size={14} className="text-slate-400" /> {internship.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Briefcase size={14} className="text-slate-400" /> {internship.stipend}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={14} className="text-slate-400" /> {internship.duration}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <Link 
                    href={`/detailiternship/${internship._id}`} 
                    className="flex-1 py-2.5 px-4 bg-slate-50 text-slate-800 text-xs font-bold text-center rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors"
                  >
                    View & Apply
                  </Link>
                  <button 
                    onClick={() => handleShare(internship._id)}
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 transition-colors"
                    title="Share Link"
                  >
                    <Share2 size={14} />
                  </button>
                  <button 
                    onClick={() => handleUnsave(internship._id)}
                    className="p-2.5 rounded-xl border border-rose-100 bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors"
                    title="Remove Bookmark"
                  >
                    <Trash2 size={14} />
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

export default SavedInternships;
