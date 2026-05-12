import { useState, forwardRef } from 'react';
import { HiOutlineEye, HiOutlineEyeOff, HiCheckCircle } from 'react-icons/hi';

const AuthField = forwardRef(function AuthField(
  {
    id,
    name,
    type = 'text',
    value,
    label,
    onChange,
    onBlur,
    error,
    touched,
    autoComplete,
    maxLength,
    inputMode,
    disabled,
    icon: Icon,
    showValidTick = false,
  },
  ref
) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const isPassword = type === 'password';
  const filled = (value ?? '').length > 0;
  const floated = filled || focused;
  const hasError = Boolean(error && touched);
  const isValid = touched && !error && filled && showValidTick;

  return (
    <div className="w-full">
      <div
        className={`auth-input-wrap relative h-14 rounded-lg border bg-white transition-all duration-200 ${
          hasError
            ? 'border-red-400 shadow-[0_0_0_3px_rgba(248,113,113,0.15)]'
            : focused
            ? 'border-blue-500 shadow-[0_0_0_3px_rgba(37,99,235,0.1)]'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        {Icon && (
          <Icon
            size={20}
            className={`pointer-events-none absolute top-1/2 -translate-y-1/2 transition-colors duration-200 ${
              hasError ? 'text-red-400' : focused ? 'text-blue-600' : 'text-slate-400'
            }`}
            style={{ left: '16px' }}
          />
        )}

        <input
          ref={ref}
          id={id}
          name={name}
          type={isPassword && show ? 'text' : type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          autoComplete={autoComplete}
          maxLength={maxLength}
          inputMode={inputMode}
          disabled={disabled}
          placeholder=" "
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? `${id}-error` : undefined}
          className="peer absolute inset-0 w-full h-full bg-transparent outline-none text-[14px] text-slate-900 placeholder-transparent rounded-lg disabled:opacity-60"
          style={{
            paddingTop: '20px',
            paddingBottom: '4px',
            paddingLeft: Icon ? '48px' : '16px',
            paddingRight: isPassword || isValid ? '44px' : '16px',
            letterSpacing: 'normal',
          }}
        />

        <label
          htmlFor={id}
          className={`pointer-events-none absolute transition-all duration-200 ${
            floated
              ? 'top-2 text-[11px] font-medium text-slate-500 leading-none'
              : 'top-1/2 -translate-y-1/2 text-[14px] text-slate-400'
          } ${hasError ? '!text-red-500' : ''}`}
          style={{ left: Icon ? '48px' : '16px' }}
        >
          {label}
        </label>

        {isPassword ? (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShow((s) => !s)}
            className="absolute top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-blue-600 transition-colors"
            style={{ right: '8px' }}
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <HiOutlineEyeOff size={18} /> : <HiOutlineEye size={18} />}
          </button>
        ) : (
          isValid && (
            <HiCheckCircle
              size={20}
              className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-emerald-500 animate-fadeIn"
              style={{ right: '14px' }}
            />
          )
        )}
      </div>

      {hasError && (
        <p
          id={`${id}-error`}
          className="mt-1.5 text-[12px] text-red-500 leading-snug flex items-start gap-1 animate-fadeIn"
        >
          <span className="mt-[1px]">⚠</span>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
});

export default AuthField;
