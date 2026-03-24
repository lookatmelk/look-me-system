"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    setAuthError('');
    try {
      const result = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
      });
      if (result?.error) {
        setAuthError('Invalid email or password. Please try again.');
      } else {
        router.push('/admin/purchasing');
        router.refresh();
      }
    } catch {
      setAuthError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-800 via-green-700 to-emerald-600 flex-col items-center justify-center relative overflow-hidden px-12">
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full" />
        <div className="absolute -bottom-32 -left-16 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-white/5 rounded-full" />

        <div className="relative z-10 text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-14 w-14 bg-white text-green-700 flex items-center justify-center font-black rounded-2xl shadow-xl">
              <span className="text-3xl leading-none">@</span>
            </div>
            <span className="text-4xl font-black tracking-tighter text-white">
              LOOK<span className="text-green-200">@</span>ME
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Admin Dashboard</h1>
          <p className="text-green-200 text-lg max-w-xs leading-relaxed">
            Manage your garment purchasing operations from one central hub.
          </p>

          <div className="mt-12 flex flex-col gap-3 text-left">
            {['Supplier Management', 'Category Tracking', 'Purchase Records'].map((feat) => (
              <div key={feat} className="flex items-center gap-3 text-green-100">
                <div className="h-2 w-2 rounded-full bg-green-300 flex-shrink-0" />
                <span className="text-sm font-medium">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center bg-[var(--color-background)] px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <div className="h-10 w-10 bg-[var(--color-primary)] text-white flex items-center justify-center font-black rounded-xl shadow-md">
              <span className="text-2xl leading-none">@</span>
            </div>
            <span className="text-2xl font-black tracking-tighter text-gray-900">
              LOOK<span className="text-[var(--color-primary)]">@</span>ME
            </span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-[var(--color-border)] p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-black text-gray-900">Welcome back</h2>
              <p className="mt-1 text-sm text-gray-500">Sign in to your admin account</p>
            </div>

            {authError && (
              <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" id="login-form">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="admin@lookatme.com"
                  autoComplete="email"
                  className={`block w-full rounded-xl border ${
                    errors.email ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'
                  } px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-ring)] focus:bg-white transition-all`}
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className={`block w-full rounded-xl border ${
                      errors.password ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'
                    } px-4 py-3 pr-12 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-ring)] focus:bg-white transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                id="login-submit-btn"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-semibold py-3 px-6 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none shadow-md shadow-green-200 mt-2"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-gray-400">
              LOOK@ME Garment Project &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
