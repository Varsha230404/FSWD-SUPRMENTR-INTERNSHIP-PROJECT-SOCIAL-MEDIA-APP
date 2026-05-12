import { lazy, Suspense, useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import RightRail from './components/RightRail';
import Loader from './components/Loader';
import CreatePostModal from './components/CreatePostModal';
import { loadUser } from './store/authSlice';

const Feed = lazy(() => import('./pages/Feed'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Profile = lazy(() => import('./pages/Profile'));
const SinglePost = lazy(() => import('./pages/SinglePost'));
const Explore = lazy(() => import('./pages/Explore'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Saved = lazy(() => import('./pages/Saved'));
const Chat = lazy(() => import('./pages/Chat'));

function PrivateRoute({ children }) {
  const { token } = useSelector((state) => state.auth);
  return token ? children : <Navigate to="/login" />;
}

function GuestRoute({ children }) {
  const { token } = useSelector((state) => state.auth);
  return !token ? children : <Navigate to="/" />;
}

function Layout({ children, withRightRail = false }) {
  return (
    <div
      className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 pt-24 pb-12 flex gap-6 lg:gap-8"
      style={{ paddingTop: 'var(--content-top, 96px)' }}
    >
      <Sidebar />
      <main className="flex-1 min-w-0 max-w-2xl mx-auto w-full">{children}</main>
      {withRightRail && <RightRail />}
    </div>
  );
}

export default function App() {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const [showCreatePost, setShowCreatePost] = useState(false);

  useEffect(() => {
    if (token) dispatch(loadUser());
  }, [token, dispatch]);

  return (
    <div className="min-h-screen">
      {token && <Navbar onCreatePost={() => setShowCreatePost(true)} />}
      {showCreatePost && <CreatePostModal onClose={() => setShowCreatePost(false)} />}

      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
          <Route path="/" element={
            <PrivateRoute><Layout withRightRail><Feed /></Layout></PrivateRoute>
          } />
          <Route path="/explore" element={
            <PrivateRoute><Layout><Explore /></Layout></PrivateRoute>
          } />
          <Route path="/notifications" element={
            <PrivateRoute><Layout><Notifications /></Layout></PrivateRoute>
          } />
          <Route path="/saved" element={
            <PrivateRoute><Layout><Saved /></Layout></PrivateRoute>
          } />
          <Route path="/chat" element={
            <PrivateRoute><Layout><Chat /></Layout></PrivateRoute>
          } />
          <Route path="/chat/:userId" element={
            <PrivateRoute><Layout><Chat /></Layout></PrivateRoute>
          } />
          <Route path="/profile/:id" element={
            <PrivateRoute><Layout><Profile /></Layout></PrivateRoute>
          } />
          <Route path="/post/:id" element={
            <PrivateRoute><Layout><SinglePost /></Layout></PrivateRoute>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </div>
  );
}
