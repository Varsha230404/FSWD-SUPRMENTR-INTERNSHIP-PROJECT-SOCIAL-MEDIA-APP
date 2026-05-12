import { useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { createPost } from '../store/postSlice';
import { HiOutlinePhotograph, HiX } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function CreatePostModal({ onClose }) {
  const dispatch = useDispatch();
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return toast.error('Write something!');
    setLoading(true);

    const formData = new FormData();
    formData.append('text', text);
    if (image) formData.append('image', image);

    try {
      await dispatch(createPost(formData)).unwrap();
      toast.success('Post created!');
      onClose();
    } catch (err) {
      toast.error(err || 'Failed');
    }
    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <div
        className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full p-5 sm:p-6 animate-fadeIn max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Create Post
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <HiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's on your mind?"
            rows={4}
            className="w-full bg-slate-50 rounded-lg px-4 py-3 text-sm text-slate-900 outline-none border border-slate-200 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)] transition-all resize-none placeholder:text-slate-400"
          />

          {preview && (
            <div className="relative mt-3 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
              <img src={preview} alt="Preview" className="w-full max-h-72 object-contain" />
              <button
                type="button"
                onClick={() => {
                  setImage(null);
                  setPreview(null);
                }}
                className="absolute top-2 right-2 p-1.5 bg-slate-900/70 rounded-full text-white hover:bg-slate-900 transition-colors"
              >
                <HiX size={16} />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between mt-5">
            <button
              type="button"
              onClick={() => fileRef.current.click()}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
            >
              <HiOutlinePhotograph size={20} /> Photo
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleImage}
              className="hidden"
            />

            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="px-6 h-11 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 active:scale-[0.98] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:active:scale-100 transition-all inline-flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Posting...
                </>
              ) : (
                'Post'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
