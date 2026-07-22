import { login, selectuser } from "@/Feature/Userslice";
import { auth } from "@/firebase/firebase";
import { getApiBaseUrl, getAuthHeaders } from "@/lib/api";
import { getStoredAuth, setStoredAuth } from "@/lib/authStorage";
import axios from "axios";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  Heart,
  MessageCircle,
  Share2,
  Users,
  Image as ImageIcon,
  Video,
  UserPlus,
  UserCheck,
  UserRoundX,
  Trash2,
  Pencil,
  Send,
  MoreHorizontal,
  Search,
  Check,
  X
} from "lucide-react";

type CommunityUser = {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  photo?: string;
  authProvider?: string;
  friendCount?: number;
  relationship?: "none" | "friend" | "incoming" | "outgoing";
};

type CommunityPost = {
  id: string;
  caption: string;
  media: string[];
  mediaType: "image" | "video" | "mixed";
  likes: number;
  likedByCurrentUser: boolean;
  comments: number;
  shares: number;
  createdAt: string;
  updatedAt: string;
  user: CommunityUser | null;
};

type CommunityComment = {
  id: string;
  comment: string;
  createdAt: string;
  user: CommunityUser | null;
  isOwner: boolean;
};

type AuthHeaders = {
  Authorization?: string;
};

const CommunityPage = () => {
  const user = useSelector(selectuser) as any;
  const dispatch = useDispatch();
  const apiBaseUrl = getApiBaseUrl();
  const [feed, setFeed] = useState<CommunityPost[]>([]);
  const [friends, setFriends] = useState<CommunityUser[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [discoverUsers, setDiscoverUsers] = useState<CommunityUser[]>([]);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, CommunityComment[]>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [activeCommentPost, setActiveCommentPost] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [caption, setCaption] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [authHeaders, setAuthHeaders] = useState<AuthHeaders>({});
  const [isResolvingAuth, setIsResolvingAuth] = useState(true);
  
  const fileRef = useRef<HTMLInputElement>(null);
  const isAuthenticatedForCommunity = Boolean(authHeaders.Authorization);
  const friendCount = friends.length;

  const hydrateCommunityAuth = async (): Promise<AuthHeaders> => {
    const existingHeaders = getAuthHeaders();
    if (existingHeaders.Authorization) {
      setAuthHeaders(existingHeaders);
      return existingHeaders;
    }

    const firebaseUser = auth?.currentUser;
    const storedAuth = getStoredAuth();
    const sourceUser = firebaseUser || storedAuth || user;
    const sourceEmail = sourceUser?.email || firebaseUser?.email;

    if (!sourceEmail) {
      setAuthHeaders({});
      return {};
    }

    try {
      const syncRes = await axios.post(`${apiBaseUrl}/api/auth/google-sync`, {
        name: sourceUser?.displayName || sourceUser?.name,
        email: sourceEmail,
        photo: sourceUser?.photoURL || sourceUser?.photo || "",
        phoneNumber: sourceUser?.phoneNumber || "",
      });

      if (syncRes.data.requiresOtp) {
        setAuthHeaders({});
        return {};
      }

      const syncedUser = {
        uid: firebaseUser?.uid || storedAuth?.uid,
        id: syncRes.data.user?.id,
        photo: sourceUser?.photoURL || sourceUser?.photo || "",
        name: sourceUser?.displayName || sourceUser?.name || "",
        email: sourceEmail,
        phoneNumber: sourceUser?.phoneNumber || "",
        authProvider: "google",
        token: syncRes.data.token,
      };

      setStoredAuth(syncedUser);
      dispatch(login(syncedUser));

      const nextHeaders = { Authorization: `Bearer ${syncRes.data.token}` };
      setAuthHeaders(nextHeaders);
      return nextHeaders;
    } catch (error) {
      console.error("Failed to hydrate community auth:", error);
      setAuthHeaders({});
      return {};
    }
  };

  const loadCommunityState = async (pageNumber = 1, append = false, headers: AuthHeaders = authHeaders) => {
    if (!headers.Authorization) {
      setIsLoading(false);
      return;
    }

    try {
      const [meRes, feedRes, usersRes] = await Promise.all([
        axios.get(`${apiBaseUrl}/api/community/me`, { headers }),
        axios.get(`${apiBaseUrl}/api/community/feed?page=${pageNumber}&limit=10`, { headers }),
        axios.get(`${apiBaseUrl}/api/community/users/search?q=${encodeURIComponent(search)}`, { headers }),
      ]);

      setFriends(meRes.data.friends || []);
      setIncomingRequests(meRes.data.friendRequests || []);
      setSentRequests(meRes.data.sentRequests || []);
      setDiscoverUsers(usersRes.data.users || []);
      setFeed((prev) => append ? [...prev, ...(feedRes.data.posts || [])] : feedRes.data.posts || []);
      setHasMore(Boolean(feedRes.data.pagination?.hasMore));
      setPage(pageNumber);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to load community.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const bootstrapCommunity = async () => {
      setIsResolvingAuth(true);
      setIsLoading(true);
      const headers = await hydrateCommunityAuth();
      if (!isMounted) return;

      if (!headers.Authorization) {
        setIsLoading(false);
        setIsResolvingAuth(false);
        return;
      }

      await loadCommunityState(1, false, headers);
      if (isMounted) setIsResolvingAuth(false);
    };

    bootstrapCommunity();
    return () => { isMounted = false; };
  }, [search, user]);

  const uploadFiles = async (files: File[]) => {
    const uploaded = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post(`${apiBaseUrl}/api/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      uploaded.push(res.data.url);
    }
    return uploaded;
  };

  const deriveMediaType = (files: File[]) => {
    const kinds = new Set(files.map((file) => file.type.startsWith("video/") ? "video" : "image"));
    if (kinds.size > 1) return "mixed";
    return kinds.has("video") ? "video" : "image";
  };

  const handleCreateOrEditPost = async () => {
    if (!caption.trim() && selectedFiles.length === 0) {
      toast.error("Add a caption or media before posting.");
      return;
    }

    try {
      setIsPosting(true);
      const mediaUrls = selectedFiles.length ? await uploadFiles(selectedFiles) : [];
      const payload = {
        caption,
        media: mediaUrls.length ? mediaUrls : feed.find((post) => post.id === editingPostId)?.media || [],
        mediaType: selectedFiles.length > 0 ? deriveMediaType(selectedFiles) : feed.find((post) => post.id === editingPostId)?.mediaType || "image",
      };

      if (editingPostId) {
        await axios.put(`${apiBaseUrl}/api/community/posts/${editingPostId}`, payload, { headers: authHeaders });
        toast.success("Post updated successfully.");
      } else {
        await axios.post(`${apiBaseUrl}/api/community/posts`, payload, { headers: authHeaders });
        toast.success("Post created successfully.");
      }

      setCaption("");
      setSelectedFiles([]);
      setPreviews([]);
      setEditingPostId(null);
      setShowComposer(false);
      await loadCommunityState();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to save post.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
    setPreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const toggleLike = async (post: CommunityPost) => {
    try {
      if (post.likedByCurrentUser) {
        await axios.delete(`${apiBaseUrl}/api/community/posts/${post.id}/like`, { headers: authHeaders });
      } else {
        await axios.post(`${apiBaseUrl}/api/community/posts/${post.id}/like`, {}, { headers: authHeaders });
      }
      await loadCommunityState(page, false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update like.");
    }
  };

  const toggleComments = async (postId: string) => {
    if (activeCommentPost === postId) {
      setActiveCommentPost(null);
      return;
    }
    setActiveCommentPost(postId);
    if (!commentsByPost[postId]) {
      try {
        const res = await axios.get(`${apiBaseUrl}/api/community/posts/${postId}/comments`, { headers: authHeaders });
        setCommentsByPost((prev) => ({ ...prev, [postId]: res.data.comments || [] }));
      } catch (error: any) {
        toast.error(error.response?.data?.error || "Failed to load comments.");
      }
    }
  };

  const addComment = async (postId: string) => {
    const comment = commentDrafts[postId]?.trim();
    if (!comment) return;
    try {
      await axios.post(`${apiBaseUrl}/api/community/posts/${postId}/comments`, { comment }, { headers: authHeaders });
      setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
      
      const res = await axios.get(`${apiBaseUrl}/api/community/posts/${postId}/comments`, { headers: authHeaders });
      setCommentsByPost((prev) => ({ ...prev, [postId]: res.data.comments || [] }));
      await loadCommunityState(page, false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to add comment.");
    }
  };

  const deleteComment = async (commentId: string, postId: string) => {
    try {
      await axios.delete(`${apiBaseUrl}/api/community/comments/${commentId}`, { headers: authHeaders });
      const res = await axios.get(`${apiBaseUrl}/api/community/posts/${postId}/comments`, { headers: authHeaders });
      setCommentsByPost((prev) => ({ ...prev, [postId]: res.data.comments || [] }));
      await loadCommunityState(page, false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to delete comment.");
    }
  };

  const sharePost = async (post: CommunityPost) => {
    const postUrl = `${window.location.origin}/community?post=${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "InternArea Community", text: post.caption, url: postUrl });
      } else {
        await navigator.clipboard.writeText(postUrl);
        toast.success("Post link copied.");
      }
      await axios.post(`${apiBaseUrl}/api/community/posts/${post.id}/share`, {}, { headers: authHeaders });
      await loadCommunityState(page, false);
    } catch (error: any) {
      if (error?.name !== "AbortError") toast.error(error.response?.data?.error || "Failed to share post.");
    }
  };

  const sendFriendRequest = async (receiverId: string) => {
    try {
      await axios.post(`${apiBaseUrl}/api/community/friends/request`, { receiverId }, { headers: authHeaders });
      toast.success("Friend request sent.");
      await loadCommunityState(page, false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to send request.");
    }
  };

  const acceptRequest = async (requestId: string) => {
    try {
      await axios.post(`${apiBaseUrl}/api/community/friends/request/${requestId}/accept`, {}, { headers: authHeaders });
      toast.success("Friend request accepted.");
      await loadCommunityState(page, false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to accept request.");
    }
  };

  const rejectRequest = async (requestId: string) => {
    try {
      await axios.post(`${apiBaseUrl}/api/community/friends/request/${requestId}/reject`, {}, { headers: authHeaders });
      toast.success("Friend request rejected.");
      await loadCommunityState(page, false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to reject request.");
    }
  };

  const removeFriend = async (friendId: string) => {
    try {
      await axios.delete(`${apiBaseUrl}/api/community/friends/${friendId}`, { headers: authHeaders });
      toast.success("Friend removed.");
      await loadCommunityState(page, false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to remove friend.");
    }
  };

  const deletePost = async (postId: string) => {
    try {
      await axios.delete(`${apiBaseUrl}/api/community/posts/${postId}`, { headers: authHeaders });
      toast.success("Post deleted.");
      await loadCommunityState(page, false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to delete post.");
    }
  };

  const beginEditPost = (post: CommunityPost) => {
    setEditingPostId(post.id);
    setCaption(post.caption);
    setPreviews(post.media);
    setSelectedFiles([]);
    setShowComposer(true);
  };

  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'U';

  if (isResolvingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col items-center animate-pulse">
          <Users className="h-12 w-12 text-blue-300 mb-4" />
          <div className="h-6 w-48 bg-slate-200 rounded mb-2"></div>
          <div className="h-4 w-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticatedForCommunity) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 text-center">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Users className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Community Access</h1>
          <p className="text-slate-500 mb-8">Join the conversation. Sign in to connect with other professionals and share your journey.</p>
          <Link href="/login" className="inline-block w-full py-3 px-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
            Sign In to Continue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-8 pb-20 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        
        {/* Left Sidebar - Profile & Friends */}
        <aside className="space-y-6 hidden lg:block sticky top-28 h-fit">
          <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 text-center">
            <div className="relative inline-block mb-4">
              {user?.photo ? (
                <img src={user.photo} alt={user.name} className="h-20 w-20 rounded-full object-cover border-4 border-white shadow-md mx-auto" />
              ) : (
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 flex items-center justify-center text-2xl font-bold border-4 border-white shadow-md mx-auto">
                  {getInitials(user?.name)}
                </div>
              )}
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">{user?.name}</h2>
            <p className="text-sm font-medium text-slate-500 mb-6">{friendCount} connections</p>
            
            <button
              onClick={() => {
                setEditingPostId(null);
                setCaption("");
                setSelectedFiles([]);
                setPreviews([]);
                setShowComposer(true);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors shadow-sm"
            >
              Write a Post
            </button>
            {friendCount === 0 && (
              <p className="mt-3 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100">
                You need at least 1 connection to start posting.
              </p>
            )}
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Connections</h3>
              <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-full">{friendCount}</span>
            </div>
            
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
              {friends.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No connections yet.</p>
              ) : (
                friends.map((friend) => (
                  <div key={friend.id} className="flex items-center justify-between gap-3 group">
                    <div className="flex items-center gap-3">
                      {friend.photo ? (
                        <img src={friend.photo} alt={friend.name} className="h-10 w-10 rounded-full object-cover border border-slate-100" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-sm font-bold border border-slate-200">
                          {getInitials(friend.name)}
                        </div>
                      )}
                      <div>
                        <Link href={`/profile?user=${friend.id}`} className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                          {friend.name}
                        </Link>
                      </div>
                    </div>
                    <button onClick={() => removeFriend(friend.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">
                      <UserRoundX size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Middle Feed */}
        <main className="space-y-6 max-w-2xl mx-auto w-full">
          {/* Mobile Write Post Action */}
          <div className="lg:hidden bg-white rounded-3xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex gap-3 items-center">
             {user?.photo ? (
                <img src={user.photo} alt={user.name} className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
                  {getInitials(user?.name)}
                </div>
              )}
              <button 
                onClick={() => setShowComposer(true)}
                className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left px-4 py-3 rounded-full text-slate-500 transition-colors"
              >
                Share an update...
              </button>
          </div>

          {/* Post Composer Modal/Inline */}
          {showComposer && (
            <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-blue-100 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">{editingPostId ? "Edit Post" : "Create Post"}</h3>
                <button onClick={() => setShowComposer(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex gap-4 mb-4">
                {user?.photo ? (
                  <img src={user.photo} alt={user.name} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
                    {getInitials(user?.name)}
                  </div>
                )}
                <div className="flex-1">
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={3}
                    placeholder="What do you want to talk about?"
                    className="w-full bg-transparent resize-none outline-none text-slate-800 placeholder-slate-400 text-lg"
                    autoFocus
                  />
                </div>
              </div>

              {previews.length > 0 && (
                <div className="grid gap-2 grid-cols-2 mb-4 rounded-2xl overflow-hidden border border-slate-100">
                  {previews.map((preview, index) => {
                    const isVideo = selectedFiles[index]?.type?.startsWith("video/") || /\.(mp4|mov|webm|mkv)$/i.test(preview);
                    return isVideo ? (
                      <video key={index} src={preview} controls className="h-48 w-full object-cover bg-black" />
                    ) : (
                      <img key={index} src={preview} alt="upload preview" className="h-48 w-full object-cover" />
                    );
                  })}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors flex items-center gap-2 px-4"
                >
                  <ImageIcon size={20} /> <span className="text-sm font-semibold">Media</span>
                </button>
                <input ref={fileRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
                
                <button
                  onClick={handleCreateOrEditPost}
                  disabled={isPosting || (!caption.trim() && previews.length === 0)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-full disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-sm"
                >
                  {isPosting ? "Posting..." : "Post"} <Send size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Feed List */}
          {isLoading ? (
            <div className="space-y-6">
              {[1,2].map(skeleton => (
                <div key={skeleton} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm animate-pulse">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                    <div>
                      <div className="w-32 h-4 bg-slate-200 rounded mb-2"></div>
                      <div className="w-20 h-3 bg-slate-200 rounded"></div>
                    </div>
                  </div>
                  <div className="w-full h-4 bg-slate-200 rounded mb-2"></div>
                  <div className="w-3/4 h-4 bg-slate-200 rounded mb-4"></div>
                  <div className="w-full h-64 bg-slate-200 rounded-2xl"></div>
                </div>
              ))}
            </div>
          ) : feed.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Your feed is quiet</h3>
              <p className="text-slate-500 mb-6 max-w-sm mx-auto">Connect with others or create a post to get the conversation started.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {feed.map((post) => (
                <article key={post.id} className="bg-white rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                  <div className="p-5 pb-0">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-3">
                        {post.user?.photo ? (
                          <img src={post.user.photo} alt={post.user.name} className="h-12 w-12 rounded-full object-cover border border-slate-100" />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold border border-slate-200">
                            {getInitials(post.user?.name || "U")}
                          </div>
                        )}
                        <div>
                          <Link href={`/profile?user=${post.user?.id || ""}`} className="font-bold text-slate-900 hover:text-blue-600 transition-colors">
                            {post.user?.name || "Community User"}
                          </Link>
                          <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
                            {new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} • 
                            <span className="opacity-75">{new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </p>
                        </div>
                      </div>
                      
                      {String(post.user?.id) === String(user?.id) && (
                        <div className="flex gap-1">
                          <button onClick={() => beginEditPost(post)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-full transition-colors">
                            <Pencil size={18} />
                          </button>
                          <button onClick={() => deletePost(post.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </div>

                    {post.caption && (
                      <p className="text-slate-800 whitespace-pre-wrap mb-4 text-[15px] leading-relaxed">{post.caption}</p>
                    )}
                  </div>

                  {post.media.length > 0 && (
                    <div className={`grid gap-1 ${post.media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      {post.media.map((item, index) => {
                        const isVideo = post.mediaType === "video" || (post.mediaType === "mixed" && /\.(mp4|mov|webm|mkv)$/i.test(item));
                        return isVideo ? (
                          <video key={index} src={item} controls className="w-full max-h-[500px] object-cover bg-black" />
                        ) : (
                          <img key={index} src={item} alt="post media" className="w-full max-h-[500px] object-cover" />
                        );
                      })}
                    </div>
                  )}

                  <div className="px-5 py-4">
                    <div className="flex items-center justify-between text-sm text-slate-500 font-medium mb-4 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center"><Heart size={10} className="fill-blue-500 text-blue-500" /></div>
                        {post.likes}
                      </div>
                      <div className="flex gap-4">
                        <span>{post.comments} comments</span>
                        <span>{post.shares} shares</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <button 
                        onClick={() => toggleLike(post)} 
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl font-semibold transition-colors ${post.likedByCurrentUser ? "text-blue-600 bg-blue-50" : "text-slate-600 hover:bg-slate-50"}`}
                      >
                        <Heart size={20} className={post.likedByCurrentUser ? "fill-blue-600" : ""} /> Like
                      </button>
                      <button 
                        onClick={() => toggleComments(post.id)} 
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl font-semibold transition-colors ${activeCommentPost === post.id ? "text-blue-600 bg-blue-50" : "text-slate-600 hover:bg-slate-50"}`}
                      >
                        <MessageCircle size={20} /> Comment
                      </button>
                      <button 
                        onClick={() => sharePost(post)} 
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <Share2 size={20} /> Share
                      </button>
                    </div>

                    {/* Comments Section */}
                    {activeCommentPost === post.id && (
                      <div className="mt-4 pt-4 border-t border-slate-100 animate-in slide-in-from-top-2">
                        <div className="flex gap-3 mb-6">
                           {user?.photo ? (
                            <img src={user.photo} alt="me" className="w-8 h-8 rounded-full object-cover shrink-0 mt-1" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                              {getInitials(user?.name)}
                            </div>
                          )}
                          <div className="flex-1 relative">
                            <input
                              value={commentDrafts[post.id] || ""}
                              onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                              placeholder="Add a comment..."
                              className="w-full bg-slate-50 border border-slate-200 rounded-full pl-4 pr-12 py-2.5 outline-none focus:border-blue-400 focus:bg-white text-sm"
                              onKeyDown={(e) => e.key === 'Enter' && addComment(post.id)}
                            />
                            <button 
                              onClick={() => addComment(post.id)} 
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors disabled:opacity-50"
                              disabled={!commentDrafts[post.id]?.trim()}
                            >
                              <Send size={14} className="ml-[-1px] mt-[1px]" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                          {(commentsByPost[post.id] || []).map((comment) => (
                            <div key={comment.id} className="flex gap-3 group">
                              {comment.user?.photo ? (
                                <img src={comment.user.photo} alt={comment.user.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0">
                                  {getInitials(comment.user?.name || "U")}
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="bg-slate-50 rounded-2xl rounded-tl-none px-4 py-2.5 inline-block max-w-[90%] relative group-hover:bg-slate-100 transition-colors">
                                  <h4 className="text-sm font-bold text-slate-900">{comment.user?.name || "User"}</h4>
                                  <p className="text-sm text-slate-700 mt-0.5">{comment.comment}</p>
                                  
                                  {comment.isOwner && (
                                    <button 
                                      onClick={() => deleteComment(comment.id, post.id)} 
                                      className="absolute -right-8 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-red-500 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400 font-medium ml-2 mt-1">
                                  {new Date(comment.createdAt).toLocaleDateString([], { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                </article>
              ))}
              
              {hasMore && !isLoading && (
                <button
                  onClick={() => loadCommunityState(page + 1, true)}
                  className="w-full py-4 bg-white border border-slate-200 rounded-3xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  Load More
                </button>
              )}
            </div>
          )}
        </main>

        {/* Right Sidebar - Find People & Requests */}
        <aside className="space-y-6 hidden lg:block sticky top-28 h-fit">
          {incomingRequests.length > 0 && (
            <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-blue-100">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Users size={18} className="text-blue-600" /> Pending Requests
              </h3>
              <div className="space-y-4">
                {incomingRequests.map((req) => (
                  <div key={req.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="font-bold text-slate-900 text-sm">{req.sender?.name}</p>
                    <p className="text-xs text-slate-500 mb-3">{new Date(req.createdAt).toLocaleDateString()}</p>
                    <div className="flex gap-2">
                      <button onClick={() => acceptRequest(req.id)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-xl transition-colors">
                        Accept
                      </button>
                      <button onClick={() => rejectRequest(req.id)} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold py-2 rounded-xl transition-colors">
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-4">Discover People</h3>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search community..."
                className="w-full bg-slate-50 border border-slate-200 pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>
            
            <div className="space-y-4">
              {discoverUsers.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No users found.</p>
              ) : (
                discoverUsers.map((person) => (
                  <div key={person.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {person.photo ? (
                        <img src={person.photo} alt={person.name} className="h-10 w-10 rounded-full object-cover border border-slate-100 shrink-0" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold border border-slate-200 shrink-0 text-sm">
                          {getInitials(person.name)}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-slate-900 text-sm line-clamp-1">{person.name}</p>
                        <p className="text-xs font-medium text-slate-500">{person.friendCount || 0} conns</p>
                      </div>
                    </div>
                    
                    {person.relationship === "friend" ? (
                       <button disabled className="p-2 rounded-full bg-slate-50 text-slate-400 border border-slate-100"><UserCheck size={16} /></button>
                    ) : person.relationship === "incoming" ? (
                       <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">Review</span>
                    ) : person.relationship === "outgoing" ? (
                       <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">Sent</span>
                    ) : (
                      <button onClick={() => sendFriendRequest(person.id)} className="p-2 rounded-full bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 transition-colors">
                        <UserPlus size={16} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CommunityPage;
