import { selectuser } from "@/Feature/Userslice";
import { getApiBaseUrl, getAuthHeaders } from "@/lib/api";
import axios from "axios";
import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
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

const CommunityPage = () => {
  const user = useSelector(selectuser) as any;
  const apiBaseUrl = getApiBaseUrl();
  const [feed, setFeed] = useState<CommunityPost[]>([]);
  const [friends, setFriends] = useState<CommunityUser[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [discoverUsers, setDiscoverUsers] = useState<CommunityUser[]>([]);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, CommunityComment[]>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
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
  const fileRef = useRef<HTMLInputElement>(null);

  const authHeaders = useMemo(() => getAuthHeaders(), []);
  const isAuthenticatedForCommunity = Boolean(authHeaders.Authorization);
  const friendCount = friends.length;

  const loadCommunityState = async (pageNumber = 1, append = false) => {
    if (!isAuthenticatedForCommunity) {
      setIsLoading(false);
      return;
    }

    try {
      const [meRes, feedRes, usersRes] = await Promise.all([
        axios.get(`${apiBaseUrl}/api/community/me`, { headers: authHeaders }),
        axios.get(`${apiBaseUrl}/api/community/feed?page=${pageNumber}&limit=10`, {
          headers: authHeaders,
        }),
        axios.get(`${apiBaseUrl}/api/community/users/search?q=${encodeURIComponent(search)}`, {
          headers: authHeaders,
        }),
      ]);

      setFriends(meRes.data.friends || []);
      setIncomingRequests(meRes.data.friendRequests || []);
      setSentRequests(meRes.data.sentRequests || []);
      setDiscoverUsers(usersRes.data.users || []);
      setFeed((prev) =>
        append ? [...prev, ...(feedRes.data.posts || [])] : feedRes.data.posts || []
      );
      setHasMore(Boolean(feedRes.data.pagination?.hasMore));
      setPage(pageNumber);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to load community.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCommunityState();
  }, [search]);

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
        mediaType:
          selectedFiles.length > 0
            ? deriveMediaType(selectedFiles)
            : feed.find((post) => post.id === editingPostId)?.mediaType || "image",
      };

      if (editingPostId) {
        await axios.put(`${apiBaseUrl}/api/community/posts/${editingPostId}`, payload, {
          headers: authHeaders,
        });
        toast.success("Post updated successfully.");
      } else {
        await axios.post(`${apiBaseUrl}/api/community/posts`, payload, {
          headers: authHeaders,
        });
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
        await axios.delete(`${apiBaseUrl}/api/community/posts/${post.id}/like`, {
          headers: authHeaders,
        });
      } else {
        await axios.post(`${apiBaseUrl}/api/community/posts/${post.id}/like`, {}, {
          headers: authHeaders,
        });
      }
      await loadCommunityState(page, false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update like.");
    }
  };

  const loadComments = async (postId: string) => {
    try {
      const res = await axios.get(`${apiBaseUrl}/api/community/posts/${postId}/comments`, {
        headers: authHeaders,
      });
      setCommentsByPost((prev) => ({ ...prev, [postId]: res.data.comments || [] }));
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to load comments.");
    }
  };

  const addComment = async (postId: string) => {
    const comment = commentDrafts[postId]?.trim();
    if (!comment) return;
    try {
      await axios.post(
        `${apiBaseUrl}/api/community/posts/${postId}/comments`,
        { comment },
        { headers: authHeaders }
      );
      setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
      await Promise.all([loadComments(postId), loadCommunityState(page, false)]);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to add comment.");
    }
  };

  const deleteComment = async (commentId: string, postId: string) => {
    try {
      await axios.delete(`${apiBaseUrl}/api/community/comments/${commentId}`, {
        headers: authHeaders,
      });
      await Promise.all([loadComments(postId), loadCommunityState(page, false)]);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to delete comment.");
    }
  };

  const sharePost = async (post: CommunityPost) => {
    const postUrl = `${window.location.origin}/community?post=${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Internarea Community", text: post.caption, url: postUrl });
      } else {
        await navigator.clipboard.writeText(postUrl);
        toast.success("Post link copied.");
      }
      await axios.post(`${apiBaseUrl}/api/community/posts/${post.id}/share`, {}, { headers: authHeaders });
      await loadCommunityState(page, false);
    } catch (error: any) {
      if (error?.name !== "AbortError") {
        toast.error(error.response?.data?.error || "Failed to share post.");
      }
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

  if (!isAuthenticatedForCommunity) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 px-4">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <Users className="mx-auto h-12 w-12 text-blue-600" />
          <h1 className="mt-4 text-3xl font-bold text-slate-900">Community Space</h1>
          <p className="mt-3 text-slate-600">
            Please sign in with your personal account or Google account to access the community feed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eff6ff_0%,#f8fafc_18%,#ffffff_100%)] px-4 py-10">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              {user?.photo ? (
                <img src={user.photo} alt={user.name} className="h-14 w-14 rounded-2xl object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 font-bold text-blue-700">
                  {user?.name?.[0] || "U"}
                </div>
              )}
              <div>
                <p className="text-lg font-semibold text-slate-900">{user?.name}</p>
                <p className="text-sm text-slate-500">{friendCount} friends</p>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingPostId(null);
                setCaption("");
                setSelectedFiles([]);
                setPreviews([]);
                setShowComposer(true);
              }}
              className="mt-6 w-full rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Create Post
            </button>
            {friendCount === 0 ? (
              <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                You need at least one friend to create a post.
              </p>
            ) : null}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Friends</h2>
              <span className="text-sm text-slate-500">{friendCount}</span>
            </div>
            <div className="mt-4 space-y-3">
              {friends.length === 0 ? (
                <p className="text-sm text-slate-500">No friends yet. Send requests to unlock posting.</p>
              ) : (
                friends.map((friend) => (
                  <div key={friend.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
                    <div className="flex items-center gap-3">
                      {friend.photo ? (
                        <img src={friend.photo} alt={friend.name} className="h-10 w-10 rounded-xl object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                          {friend.name[0]}
                        </div>
                      )}
                      <div>
                        <Link href={`/profile?user=${friend.id}`} className="font-medium text-slate-900 hover:text-blue-600">
                          {friend.name}
                        </Link>
                        <p className="text-xs text-slate-500">{friend.friendCount || 0} friends</p>
                      </div>
                    </div>
                    <button onClick={() => removeFriend(friend.id)} className="text-slate-400 hover:text-red-600">
                      <UserRoundX size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        <main className="space-y-6">
          {showComposer ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">
                  {editingPostId ? "Edit Post" : "Create a new post"}
                </h2>
                <button onClick={() => setShowComposer(false)} className="text-sm text-slate-500 hover:text-slate-700">
                  Close
                </button>
              </div>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={4}
                placeholder="Share your update, learning, win, or project progress..."
                className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
              />
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <ImageIcon size={18} />
                  Add Media
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <span className="text-sm text-slate-500">Images and videos supported</span>
              </div>
              {previews.length > 0 ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {previews.map((preview, index) => {
                    const isVideo =
                      selectedFiles[index]?.type?.startsWith("video/") ||
                      /\.(mp4|mov|webm|mkv)$/i.test(preview);
                    return isVideo ? (
                      <video key={preview + index} src={preview} controls className="h-48 w-full rounded-2xl object-cover" />
                    ) : (
                      <img key={preview + index} src={preview} alt="preview" className="h-48 w-full rounded-2xl object-cover" />
                    );
                  })}
                </div>
              ) : null}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleCreateOrEditPost}
                  disabled={isPosting}
                  className="rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isPosting ? "Saving..." : editingPostId ? "Update Post" : "Publish Post"}
                </button>
              </div>
            </div>
          ) : null}

          {isLoading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
              Loading community feed...
            </div>
          ) : feed.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
              <h2 className="text-2xl font-semibold text-slate-900">No posts yet</h2>
              <p className="mt-2 text-slate-500">Be the first to share something once you have enough friends.</p>
            </div>
          ) : (
            feed.map((post) => (
              <article key={post.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {post.user?.photo ? (
                      <img src={post.user.photo} alt={post.user.name} className="h-12 w-12 rounded-2xl object-cover" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 font-bold text-blue-700">
                        {post.user?.name?.[0] || "U"}
                      </div>
                    )}
                    <div>
                      <Link href={`/profile?user=${post.user?.id || ""}`} className="font-semibold text-slate-900 hover:text-blue-600">
                        {post.user?.name || "Community User"}
                      </Link>
                      <p className="text-sm text-slate-500">{new Date(post.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  {String(post.user?.id) === String(user?.id) ? (
                    <div className="flex items-center gap-2">
                      <button onClick={() => beginEditPost(post)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600">
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => deletePost(post.id)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-red-600">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ) : null}
                </div>

                {post.caption ? <p className="mt-4 whitespace-pre-wrap text-slate-700">{post.caption}</p> : null}

                {post.media.length > 0 ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {post.media.map((item, index) =>
                      post.mediaType === "video" || (post.mediaType === "mixed" && /\.(mp4|mov|webm|mkv)$/i.test(item)) ? (
                        <video key={item + index} src={item} controls className="h-72 w-full rounded-2xl bg-black object-cover" />
                      ) : (
                        <img key={item + index} src={item} alt="community media" className="h-72 w-full rounded-2xl object-cover" />
                      )
                    )}
                  </div>
                ) : null}

                <div className="mt-5 flex items-center justify-between text-sm text-slate-500">
                  <span>{post.likes} likes</span>
                  <span>{post.comments} comments</span>
                  <span>{post.shares} shares</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button onClick={() => toggleLike(post)} className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium ${post.likedByCurrentUser ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-700"}`}>
                    <Heart size={18} />
                    {post.likedByCurrentUser ? "Unlike" : "Like"}
                  </button>
                  <button
                    onClick={() => loadComments(post.id)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700"
                  >
                    <MessageCircle size={18} />
                    Comments
                  </button>
                  <button onClick={() => sharePost(post)} className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                    <Share2 size={18} />
                    Share
                  </button>
                </div>

                <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                  <div className="flex gap-3">
                    <input
                      value={commentDrafts[post.id] || ""}
                      onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                      placeholder="Write a comment..."
                      className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                    />
                    <button onClick={() => addComment(post.id)} className="rounded-2xl bg-blue-600 px-4 py-3 text-white hover:bg-blue-700">
                      <Send size={18} />
                    </button>
                  </div>

                  {(commentsByPost[post.id] || []).length > 0 ? (
                    <div className="mt-4 space-y-3">
                      {commentsByPost[post.id].map((comment) => (
                        <div key={comment.id} className="rounded-2xl bg-white p-3">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-medium text-slate-900">{comment.user?.name || "User"}</p>
                              <p className="mt-1 text-sm text-slate-600">{comment.comment}</p>
                              <p className="mt-1 text-xs text-slate-400">{new Date(comment.createdAt).toLocaleString()}</p>
                            </div>
                            {comment.isOwner ? (
                              <button onClick={() => deleteComment(comment.id, post.id)} className="text-slate-400 hover:text-red-600">
                                <Trash2 size={16} />
                              </button>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </article>
            ))
          )}

          {hasMore && !isLoading ? (
            <div className="flex justify-center">
              <button
                onClick={() => loadCommunityState(page + 1, true)}
                className="rounded-2xl border border-slate-200 bg-white px-6 py-3 font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Load more posts
              </button>
            </div>
          ) : null}
        </main>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Find people</h2>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, phone"
              className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
            />
            <div className="mt-4 space-y-3">
              {discoverUsers.map((person) => (
                <div key={person.id} className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    {person.photo ? (
                      <img src={person.photo} alt={person.name} className="h-12 w-12 rounded-2xl object-cover" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                        {person.name[0]}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-slate-900">{person.name}</p>
                      <p className="text-xs text-slate-500">{person.friendCount || 0} friends</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    {person.relationship === "friend" ? (
                      <span className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                        <UserCheck size={16} />
                        Friends
                      </span>
                    ) : person.relationship === "incoming" ? (
                      <span className="rounded-2xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
                        Sent you a request
                      </span>
                    ) : person.relationship === "outgoing" ? (
                      <span className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">
                        Request pending
                      </span>
                    ) : (
                      <button onClick={() => sendFriendRequest(person.id)} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                        <UserPlus size={16} />
                        Add Friend
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Friend Requests</h2>
            <div className="mt-4 space-y-3">
              {incomingRequests.length === 0 ? (
                <p className="text-sm text-slate-500">No incoming friend requests.</p>
              ) : (
                incomingRequests.map((request) => (
                  <div key={request.id} className="rounded-2xl bg-slate-50 p-4">
                    <p className="font-medium text-slate-900">{request.sender?.name}</p>
                    <p className="text-xs text-slate-500">{new Date(request.createdAt).toLocaleString()}</p>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => acceptRequest(request.id)} className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                        Accept
                      </button>
                      <button onClick={() => rejectRequest(request.id)} className="rounded-2xl bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300">
                        Reject
                      </button>
                    </div>
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
