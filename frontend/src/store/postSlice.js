import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../api/axios';

export const fetchFeed = createAsyncThunk('posts/fetchFeed', async (page = 1, { rejectWithValue }) => {
  try {
    const res = await API.get(`/posts?page=${page}&limit=10`);
    return res.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to load feed'); }
});

export const fetchUserPosts = createAsyncThunk('posts/fetchUserPosts', async (userId, { rejectWithValue }) => {
  try {
    const res = await API.get(`/posts/user/${userId}`);
    return res.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to load posts'); }
});

export const createPost = createAsyncThunk('posts/create', async (formData, { rejectWithValue }) => {
  try {
    const res = await API.post('/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to create post'); }
});

export const deletePost = createAsyncThunk('posts/delete', async (id, { rejectWithValue }) => {
  try {
    await API.delete(`/posts/${id}`);
    return id;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to delete post'); }
});

export const toggleLike = createAsyncThunk('posts/toggleLike', async (id, { rejectWithValue }) => {
  try {
    const res = await API.put(`/posts/${id}/like`);
    return { id, ...res.data };
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
});

const postSlice = createSlice({
  name: 'posts',
  initialState: { posts: [], page: 1, pages: 1, total: 0, loading: false, error: null },
  reducers: {
    clearPosts(state) { state.posts = []; state.page = 1; state.pages = 1; state.total = 0; },
    incrementCommentCount(state, action) {
      const post = state.posts.find(p => p._id === action.payload);
      if (post) post.commentCount = (post.commentCount || 0) + 1;
    },
    decrementCommentCount(state, action) {
      const post = state.posts.find(p => p._id === action.payload);
      if (post && post.commentCount > 0) post.commentCount -= 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeed.pending, (state) => { state.loading = true; })
      .addCase(fetchFeed.fulfilled, (state, action) => {
        state.loading = false;
        const { posts, page, pages, total } = action.payload;
        state.posts = page === 1 ? posts : [...state.posts, ...posts];
        state.page = page;
        state.pages = pages;
        state.total = total;
      })
      .addCase(fetchFeed.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchUserPosts.pending, (state) => { state.loading = true; })
      .addCase(fetchUserPosts.fulfilled, (state, action) => { state.loading = false; state.posts = action.payload; })
      .addCase(fetchUserPosts.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createPost.fulfilled, (state, action) => { state.posts.unshift(action.payload); })
      .addCase(deletePost.fulfilled, (state, action) => { state.posts = state.posts.filter(p => p._id !== action.payload); })
      .addCase(toggleLike.fulfilled, (state, action) => {
        const post = state.posts.find(p => p._id === action.payload.id);
        if (post) { post.likes = action.payload.likes; }
      });
  },
});

export const { clearPosts, incrementCommentCount, decrementCommentCount } = postSlice.actions;
export default postSlice.reducer;
