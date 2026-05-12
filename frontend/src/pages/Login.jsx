import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiOutlineUser, HiOutlineLockClosed, HiArrowRight, HiExclamation } from 'react-icons/hi';
import { login, clearError } from '../store/authSlice';
import AuthLayout from '../components/auth/AuthLayout';
import AuthField from '../components/auth/AuthField';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, token } = useSelector((s) => s.auth);

  const [values, setValues] = useState({ identifier: '', password: '' });
  const [touched, setTouched] = useState({});
  const [formError, setFormError] = useState('');
  const [remember, setRemember] = useState(true);

  useEffect(() => {
    if (token) navigate('/');
  }, [token, navigate]);
  useEffect(() => () => dispatch(clearError()), [dispatch]);

  const errors = {
    identifier: !values.identifier.trim() ? 'Required' : '',
    password: !values.password ? 'Required' : '',
  };
  const isValid = !errors.identifier && !errors.password;

  const handleChange = (field) => (e) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }));
    if (formError) setFormError('');
  };
  const handleBlur = (field) => () => setTouched((prev) => ({ ...prev, [field]: true }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ identifier: true, password: true });
    if (!isValid) return;

    try {
      await dispatch(login(values)).unwrap();
      toast.success('Welcome back!');
    } catch (err) {
      setFormError(err?.message || 'Login failed');
    }
  };

  return (
    <AuthLayout mode="login">
      <div className="lg:hidden flex items-center gap-3 mb-8 animate-auth-up">
        <div className="w-10 h-10 rounded-xl auth-gradient-anim flex items-center justify-center text-white font-bold shadow-lg">V</div>
        <span className="text-xl font-bold tracking-tight text-slate-900">Vibe</span>
      </div>

      <div className="auth-card rounded-2xl p-6 sm:p-8 md:p-9">
        <div className="mb-6 animate-auth-up" style={{ animationDelay: '0.1s' }}>
          <h1 className="text-[26px] sm:text-[28px] font-bold tracking-tight text-slate-900">
            Welcome back
          </h1>
          <p className="text-[14px] text-slate-500 mt-1.5">
            Log in to continue to your feed.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="animate-auth-up" style={{ animationDelay: '0.3s' }}>
            <AuthField
              id="login-identifier"
              name="identifier"
              label="Email or username"
              value={values.identifier}
              onChange={handleChange('identifier')}
              onBlur={handleBlur('identifier')}
              error={errors.identifier}
              touched={touched.identifier}
              autoComplete="username"
              disabled={loading}
              icon={HiOutlineUser}
            />
          </div>

          <div className="animate-auth-up" style={{ animationDelay: '0.35s' }}>
            <AuthField
              id="login-password"
              name="password"
              type="password"
              label="Password"
              value={values.password}
              onChange={handleChange('password')}
              onBlur={handleBlur('password')}
              error={errors.password}
              touched={touched.password}
              autoComplete="current-password"
              disabled={loading}
              icon={HiOutlineLockClosed}
            />
          </div>

          <div
            className="flex items-center justify-between text-[12px] animate-auth-up"
            style={{ animationDelay: '0.4s' }}
          >
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-500">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-[14px] h-[14px] rounded accent-blue-600"
              />
              Remember me
            </label>
            <button
              type="button"
              onClick={() => toast('Password reset coming soon', { icon: '📬' })}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Forgot password?
            </button>
          </div>

          {formError && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 animate-fadeIn">
              <HiExclamation className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-[12px] text-red-700 leading-snug">{formError}</p>
            </div>
          )}

          <div className="pt-2 animate-auth-up" style={{ animationDelay: '0.45s' }}>
            <button
              type="submit"
              disabled={!isValid || loading}
              className="relative w-full h-12 rounded-lg overflow-hidden bg-blue-600 text-white text-[14px] font-semibold tracking-tight transition-all duration-200 hover:bg-blue-700 active:scale-[0.98] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:active:scale-100 group"
            >
              {loading ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Logging in...
                </span>
              ) : (
                <span className="relative z-10 inline-flex items-center justify-center gap-2">
                  Log in
                  <HiArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              )}
            </button>
          </div>
        </form>
      </div>

      <p
        className="text-center text-[13px] text-slate-500 mt-6 animate-auth-up"
        style={{ animationDelay: '0.55s' }}
      >
        New to Vibe?{' '}
        <Link
          to="/register"
          className="font-semibold text-blue-600 hover:text-blue-700 hover:underline underline-offset-2 decoration-2"
        >
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
