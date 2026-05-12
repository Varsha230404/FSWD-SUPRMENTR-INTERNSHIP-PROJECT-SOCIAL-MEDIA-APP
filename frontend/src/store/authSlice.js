import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../api/axios';
import { disconnectSocket } from '../api/socket';

function describeAuthError(err, fallback) {
  if (!err.response) {
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return { message: "Can't reach the server. Is the backend running?", errors: null, status: 0 };
    }
    if (err.code === 'ECONNABORTED') {
      return { message: 'Request timed out. Please try again.', errors: null, status: 0 };
    }
    return { message: err.message || fallback, errors: null, status: 0 };
  }
  const data = err.response.data || {};
  return {
    message: data.message || fallback,
    errors: data.errors || null,
    field: data.field || null,
    status: err.response.status || 0,
  };
}

export const register = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    const res = await API.post('/auth/register', data);
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    return res.data;
  } catch (err) {
    return rejectWithValue(describeAuthError(err, 'Registration failed'));
  }
});

export const login = createAsyncThunk('auth/login', async (data, { rejectWithValue }) => {
  try {
    const res = await API.post('/auth/login', data);
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    return res.data;
  } catch (err) {
    return rejectWithValue(describeAuthError(err, 'Login failed'));
  }
});

export const loadUser = createAsyncThunk('auth/loadUser', async (_, { rejectWithValue }) => {
  try {
    const res = await API.get('/auth/me');
    return res.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Load failed'); }
});

const savedUser = localStorage.getItem('user');

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: savedUser ? JSON.parse(savedUser) : null,
    token: localStorage.getItem('token') || null,
    loading: false,
    error: null,
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      disconnectSocket();
    },
    clearError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    const setPending = (state) => { state.loading = true; state.error = null; };
    const setError = (state, action) => {
      state.loading = false;
      state.error = typeof action.payload === 'string' ? action.payload : action.payload?.message || 'Error';
    };

    builder
      .addCase(register.pending, setPending)
      .addCase(register.fulfilled, (state, action) => { state.loading = false; state.user = action.payload.user; state.token = action.payload.token; })
      .addCase(register.rejected, setError)
      .addCase(login.pending, setPending)
      .addCase(login.fulfilled, (state, action) => { state.loading = false; state.user = action.payload.user; state.token = action.payload.token; })
      .addCase(login.rejected, setError)
      .addCase(loadUser.pending, setPending)
      .addCase(loadUser.fulfilled, (state, action) => { state.loading = false; state.user = action.payload; })
      .addCase(loadUser.rejected, setError);
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
