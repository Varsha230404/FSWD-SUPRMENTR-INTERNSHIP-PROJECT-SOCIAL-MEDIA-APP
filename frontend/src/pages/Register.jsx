import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  HiOutlineMail,
  HiOutlineUser,
  HiOutlineAtSymbol,
  HiOutlineLockClosed,
  HiArrowRight,
} from 'react-icons/hi';
import { register, clearError } from '../store/authSlice';
import AuthLayout from '../components/auth/AuthLayout';
import AuthField from '../components/auth/AuthField';

const RULES = {
  email: (v) => {
    if (!v.trim()) return 'Email is required';
    if (!/^\S+@\S+\.\S+$/.test(v.trim())) return 'Enter a valid email address';
    return '';
  },
  name: (v) => {
    const t = v.trim();
    if (!t) return 'Full name is required';
    if (t.length < 2) return 'Must be at least 2 characters';
    if (t.length > 50) return 'Name is too long';
    return '';
  },
  username: (v) => {
    const t = v.trim();
    if (!t) return 'Username is required';
    if (t.length < 3) return 'At least 3 characters';
    if (t.length > 20) return 'At most 20 characters';
    if (!/^[a-z0-9_]+$/.test(t)) return 'Lowercase letters, numbers, underscores only';
    return '';
  },
  password: (v) => {
    if (!v) return 'Password is required';
    if (v.length < 6) return 'Must be at least 6 characters';
    if (!/[A-Za-z]/.test(v)) return 'Must include a letter';
    if (!/\d/.test(v)) return 'Must include a number';
    return '';
  },
};

function computeStrength(v) {
  const checks = [
    v.length >= 6,
    v.length >= 10,
    /[A-Z]/.test(v) && /[a-z]/.test(v),
    /\d/.test(v),
    /[^A-Za-z0-9]/.test(v),
  ];
  const score = checks.filter(Boolean).length;
  if (!v) return { score: 0, label: '', color: 'bg-neutral-200', text: 'text-neutral-400' };
  if (score <= 2) return { score, label: 'Weak', color: 'bg-red-400', text: 'text-red-500' };
  if (score === 3) return { score, label: 'Fair', color: 'bg-amber-400', text: 'text-amber-600' };
  if (score === 4) return { score, label: 'Good', color: 'bg-lime-500', text: 'text-lime-600' };
  return { score, label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-600' };
}

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, token } = useSelector((s) => s.auth);

  const [values, setValues] = useState({ email: '', name: '', username: '', password: '' });
  const [touched, setTouched] = useState({});
  const [serverErrors, setServerErrors] = useState({});

  useEffect(() => {
    if (token) navigate('/');
  }, [token, navigate]);
  useEffect(() => () => dispatch(clearError()), [dispatch]);

  const errors = useMemo(() => {
    const e = {};
    for (const k of Object.keys(RULES)) {
      const msg = RULES[k](values[k]);
      if (msg) e[k] = msg;
    }
    return e;
  }, [values]);

  const combined = { ...errors, ...serverErrors };
  const isValid = Object.keys(errors).length === 0;
  const strength = computeStrength(values.password);

  const handleChange = (field) => (e) => {
    let v = e.target.value;
    if (field === 'username') v = v.toLowerCase().replace(/\s+/g, '');
    setValues((prev) => ({ ...prev, [field]: v }));
    if (serverErrors[field]) {
      setServerErrors((prev) => {
        const n = { ...prev };
        delete n[field];
        return n;
      });
    }
  };
  const handleBlur = (field) => () => setTouched((prev) => ({ ...prev, [field]: true }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, name: true, username: true, password: true });
    if (!isValid) return;

    try {
      await dispatch(register(values)).unwrap();
      toast.success('Welcome to Vibe ✨');
    } catch (err) {
      if (err?.errors && typeof err.errors === 'object') {
        setServerErrors(err.errors);
        setTouched((prev) => ({
          ...prev,
          ...Object.fromEntries(Object.keys(err.errors).map((k) => [k, true])),
        }));
      } else if (err?.message) {
        toast.error(err.message);
      }
    }
  };

  const fieldProps = (name, label, extra = {}) => ({
    id: `reg-${name}`,
    name,
    label,
    value: values[name],
    onChange: handleChange(name),
    onBlur: handleBlur(name),
    error: combined[name],
    touched: touched[name] || Boolean(serverErrors[name]),
    disabled: loading,
    showValidTick: true,
    ...extra,
  });

  return (
    <AuthLayout mode="register">
      <div className="lg:hidden flex items-center gap-3 mb-8 animate-auth-up">
        <div className="w-10 h-10 rounded-xl auth-gradient-anim flex items-center justify-center text-white font-bold shadow-lg">V</div>
        <span className="text-xl font-bold tracking-tight">Vibe</span>
      </div>

      <div className="auth-card rounded-2xl p-6 sm:p-8 md:p-9">
        <div className="mb-6 animate-auth-up" style={{ animationDelay: '0.1s' }}>
          <h1 className="text-[26px] sm:text-[28px] font-bold tracking-tight text-slate-900">
            Create your account
          </h1>
          <p className="text-[14px] text-slate-500 mt-1.5">
            It only takes a minute to get started.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="animate-auth-up" style={{ animationDelay: '0.3s' }}>
            <AuthField
              {...fieldProps('email', 'Email', {
                type: 'email',
                autoComplete: 'email',
                inputMode: 'email',
                icon: HiOutlineMail,
              })}
            />
          </div>

          <div className="animate-auth-up" style={{ animationDelay: '0.35s' }}>
            <AuthField
              {...fieldProps('name', 'Full name', {
                autoComplete: 'name',
                maxLength: 50,
                icon: HiOutlineUser,
              })}
            />
          </div>

          <div className="animate-auth-up" style={{ animationDelay: '0.4s' }}>
            <AuthField
              {...fieldProps('username', 'Username', {
                autoComplete: 'username',
                maxLength: 20,
                icon: HiOutlineAtSymbol,
              })}
            />
          </div>

          <div className="animate-auth-up" style={{ animationDelay: '0.45s' }}>
            <AuthField
              {...fieldProps('password', 'Password', {
                type: 'password',
                autoComplete: 'new-password',
                icon: HiOutlineLockClosed,
              })}
            />

            {values.password && (
              <div className="mt-2 animate-fadeIn">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div
                      key={n}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        n <= strength.score ? strength.color : 'bg-neutral-200'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className={`text-[11px] font-medium ${strength.text}`}>
                    {strength.label && `${strength.label} password`}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {values.password.length} / 6+
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 animate-auth-up" style={{ animationDelay: '0.55s' }}>
            <button
              type="submit"
              disabled={!isValid || loading}
              className="relative w-full h-12 rounded-lg overflow-hidden bg-blue-600 text-white text-[14px] font-semibold tracking-tight transition-all duration-200 hover:bg-blue-700 active:scale-[0.98] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:active:scale-100 group"
            >
              {loading ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Creating your account...
                </span>
              ) : (
                <>
                  <span className="relative z-10 inline-flex items-center justify-center gap-2">
                    Create account
                    <HiArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                  {isValid && (
                    <span className="absolute inset-0 auth-shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <p className="text-center text-[13px] text-slate-500 mt-6 animate-auth-up" style={{ animationDelay: '0.65s' }}>
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-semibold text-blue-600 hover:text-blue-700 hover:underline underline-offset-2 decoration-2"
        >
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
