import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserPosts, clearPosts } from '../store/postSlice';
import {
  HiOutlinePencil,
  HiOutlinePhotograph,
  HiOutlineViewGrid,
  HiOutlineHeart,
  HiOutlineChatAlt2,
} from 'react-icons/hi';
import PostCard from '../components/PostCard';
import FollowersModal from '../components/FollowersModal';
import Loader from '../components/Loader';
import API from '../api/axios';
import toast from 'react-hot-toast';

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user: me } = useSelector((state) => state.auth);
  const { posts, loading } = useSelector((state) => state.posts);
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', bio: '' });
  const [view, setView] = useState('grid');
  const [activePost, setActivePost] = useState(null);
  const [showFollowModal, setShowFollowModal] = useState(null);
  const isMe = me?._id === id;

  useEffect(() => {
    setProfile(null);
    dispatch(clearPosts());
    API.get(`/users/${id}`)
      .then((res) => {
        setProfile(res.data);
        setEditForm({ name: res.data.name, bio: res.data.bio || '' });
      })
      .catch(() => toast.error('Failed to load profile'));
    dispatch(fetchUserPosts(id));
  }, [id, dispatch]);

  const handleFollow = async () => {
    try {
      const res = await API.put(`/users/${id}/follow`);
      setProfile((prev) => ({
        ...prev,
        followers: res.data.following
          ? [...(prev.followers || []), { _id: me._id, name: me.name, avatar: me.avatar, username: me.username }]
          : (prev.followers || []).filter((f) => f._id !== me._id),
      }));
      toast.success(res.data.message);
    } catch {
      toast.error('Failed');
    }
  };

  const handleSaveProfile = async () => {
    try {
      const res = await API.put('/users/profile', editForm);
      setProfile(res.data);
      setEditing(false);
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('avatar', file);
    try {
      const res = await API.put('/users/profile', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfile(res.data);
      toast.success('Avatar updated');
    } catch {
      toast.error('Failed');
    }
  };

  if (!profile) return <Loader />;

  const isFollowing = profile.followers?.some((f) => f._id === me?._id);

  const input =
    'bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none border border-slate-200 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)] transition-all w-full max-w-sm';

  return (
    <div className="space-y-7">
      <div className="glass p-6 sm:p-8 md:p-10 animate-fadeIn">
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
          <div className="relative group shrink-0">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full ring-4 ring-blue-100 overflow-hidden">
              <div className="w-full h-full rounded-full bg-blue-600 flex items-center justify-center text-4xl font-bold text-white overflow-hidden">
                {profile.avatar ? (
                  <img src={profile.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                ) : (
                  profile.name?.[0]
                )}
              </div>
            </div>
            {isMe && (
              <label className="absolute inset-0 rounded-full bg-slate-900/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                <HiOutlinePhotograph size={28} className="text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left w-full">
            {editing ? (
              <div className="space-y-3">
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className={input}
                />
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  className={`${input} resize-none`}
                  rows={3}
                  maxLength={200}
                  placeholder="Write a bio..."
                />
                <div className="flex gap-2 justify-center sm:justify-start">
                  <button
                    onClick={handleSaveProfile}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-4 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row items-center gap-4 mb-1">
                  <h2 className="text-2xl font-bold text-neutral-900">
                    {profile.username ? `@${profile.username}` : profile.name}
                  </h2>
                  {isMe ? (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
                    >
                      <HiOutlinePencil size={16} /> Edit Profile
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleFollow}
                        className={`px-6 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                          isFollowing
                            ? 'border border-slate-200 text-slate-600 hover:border-red-300 hover:text-red-500 hover:bg-red-50'
                            : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98]'
                        }`}
                      >
                        {isFollowing ? 'Following' : 'Follow'}
                      </button>
                      {isFollowing &&
                        profile.following?.some((f) => f._id === me?._id) && (
                          <button
                            onClick={() => navigate(`/chat/${profile._id}`)}
                            className="px-4 py-1.5 rounded-lg text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all"
                          >
                            Message
                          </button>
                        )}
                    </>
                  )}
                </div>
                <p className="text-sm text-slate-500 mb-3">{profile.name}</p>

                <div className="flex items-center gap-4 sm:gap-6 mb-3 justify-center sm:justify-start flex-wrap">
                  <span className="text-sm text-slate-600">
                    <strong className="text-base text-slate-900">{posts.length}</strong>{' '}
                    <span className="text-slate-500">posts</span>
                  </span>
                  <button
                    onClick={() => setShowFollowModal('followers')}
                    className="text-sm text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    <strong className="text-base text-slate-900">
                      {profile.followers?.length || 0}
                    </strong>{' '}
                    <span className="text-slate-500 hover:text-blue-600 transition-colors">followers</span>
                  </button>
                  <button
                    onClick={() => setShowFollowModal('following')}
                    className="text-sm text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    <strong className="text-base text-slate-900">
                      {profile.following?.length || 0}
                    </strong>{' '}
                    <span className="text-slate-500 hover:text-blue-600 transition-colors">following</span>
                  </button>
                </div>

                <p className="text-sm text-slate-600 whitespace-pre-wrap">
                  {profile.bio || <span className="text-slate-400">No bio yet</span>}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="glass p-1.5 flex gap-1.5">
        <button
          onClick={() => setView('grid')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
            view === 'grid'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <HiOutlineViewGrid size={18} /> Posts
        </button>
        <button
          onClick={() => setView('list')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
            view === 'list'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <HiOutlineChatAlt2 size={18} /> Feed view
        </button>
      </div>

      {loading && posts.length === 0 ? (
        <Loader />
      ) : posts.length === 0 ? (
        <div className="glass p-12 text-center">
          <p className="text-2xl mb-2">📷</p>
          <p className="text-slate-500 text-sm">No posts yet</p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          {posts.map((post) => (
            <button
              key={post._id}
              onClick={() => setActivePost(post)}
              className="relative aspect-square overflow-hidden bg-slate-100 rounded-md sm:rounded-lg group"
            >
              {post.image ? (
                <img
                  src={post.image}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-3 text-xs text-slate-600 text-center bg-gradient-to-br from-slate-50 to-slate-100">
                  <span className="line-clamp-6">{post.text}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/55 flex items-center justify-center gap-4 text-white opacity-0 group-hover:opacity-100 transition-all">
                <span className="flex items-center gap-1 text-sm font-semibold">
                  <HiOutlineHeart size={18} /> {post.likes?.length || 0}
                </span>
                <span className="flex items-center gap-1 text-sm font-semibold">
                  <HiOutlineChatAlt2 size={18} /> {post.commentCount || 0}
                </span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      )}

      {activePost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setActivePost(null)}
        >
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <PostCard post={activePost} />
          </div>
        </div>
      )}

      {showFollowModal && (
        <FollowersModal
          followers={profile.followers || []}
          following={profile.following || []}
          initialTab={showFollowModal}
          onClose={() => setShowFollowModal(null)}
        />
      )}
    </div>
  );
}
