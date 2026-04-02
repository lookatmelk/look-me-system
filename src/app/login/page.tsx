"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, AlertCircle, ShoppingCart, Users, Tags } from "lucide-react";
import { useFormEnterNavigation } from "@/hooks/useFormEnterNavigation";
import { FormKeyboardHints } from "@/components/ui/FormKeyboardHints";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type LoginFormValues = z.infer<typeof schema>;

const features = [
  { icon: ShoppingCart, label: "Purchasing Records" },
  { icon: Users, label: "Supplier Management" },
  { icon: Tags, label: "Category Tracking" },
];

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { handleFormKeyDown, submitBtnRef } = useFormEnterNavigation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    setAuthError("");
    try {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });
      if (result?.error) {
        setAuthError("Invalid email or password. Please try again.");
      } else {
        router.push("/admin/dashboard");
        router.refresh();
      }
    } catch {
      setAuthError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* ── Left Brand Panel ── */}
      <div
        className="hidden lg:flex lg:w-[48%] flex-col items-center justify-center relative overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #0a1628 0%, #0f2744 40%, #0d3b2b 100%)",
        }}
      >
        {/* Animated orbs */}
        <div
          className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full opacity-20 animate-float"
          style={{
            background: "radial-gradient(circle, #16a34a 0%, transparent 70%)",
            filter: "blur(60px)",
            top: "-120px",
            left: "-100px",
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-15"
          style={{
            background: "radial-gradient(circle, #059669 0%, transparent 70%)",
            filter: "blur(50px)",
            bottom: "-80px",
            right: "-80px",
          }}
        />
        <div
          className="absolute top-1/2 right-1/4 w-[200px] h-[200px] rounded-full opacity-10 animate-spin-slow"
          style={{
            background: "radial-gradient(circle, #34d399 0%, transparent 70%)",
            filter: "blur(30px)",
          }}
        />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 px-14 max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div
              className="h-12 w-12 rounded-2xl flex items-center justify-center font-black text-white shadow-lg"
              style={{ background: "linear-gradient(135deg, #16a34a, #059669)" }}
            >
              <span className="text-2xl leading-none">@</span>
            </div>
            <span className="text-3xl font-black tracking-tighter text-white">
              LOOK<span className="text-green-400">@</span>ME
            </span>
          </div>

          <h1 className="text-4xl font-black text-white mb-3 leading-tight">
            Garment Admin<br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(90deg, #4ade80, #86efac)" }}
            >
              Dashboard
            </span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed mb-10">
            Manage your entire garment purchasing operation from one central hub.
          </p>

          <div className="space-y-3">
            {features.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(22,163,74,0.15)", border: "1px solid rgba(22,163,74,0.2)" }}
                >
                  <Icon style={{ width: 15, height: 15, color: "#4ade80" }} />
                </div>
                <span className="text-sm font-medium text-slate-300">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Login Panel ── */}
      <div
        className="flex-1 flex items-center justify-center px-6 py-12 relative"
        style={{ background: "#F0F4F8" }}
      >
        {/* Subtle background circles */}
        <div
          className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-30"
          style={{
            background: "radial-gradient(circle, #dcfce7 0%, transparent 70%)",
            top: "-60px",
            right: "-60px",
          }}
        />

        <div className="w-full max-w-[400px] relative z-10">
          {/* Mobile Logo */}
          <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center font-black text-white"
              style={{ background: "linear-gradient(135deg, #16a34a, #059669)" }}
            >
              <span className="text-xl leading-none">@</span>
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-900">
              LOOK<span className="text-green-600">@</span>ME
            </span>
          </div>

          {/* Card */}
          <div
            className="rounded-3xl p-8 animate-scale-in"
            style={{
              background: "rgba(255,255,255,0.85)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.9)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div className="mb-7">
              <h2 className="text-2xl font-black text-slate-900">Welcome back</h2>
              <p className="mt-1 text-sm text-slate-500">Sign in to your admin account to continue.</p>
            </div>

            {authError && (
              <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm animate-fade-in">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleFormKeyDown} className="space-y-5" id="login-form">
              <FormKeyboardHints />

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="admin@lookatme.com"
                  autoComplete="email"
                  className={`block w-full rounded-xl border px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                    errors.email
                      ? "border-red-300 bg-red-50 focus:ring-red-200"
                      : "border-slate-200 bg-slate-50 focus:border-green-500 focus:ring-green-100 focus:bg-white"
                  }`}
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className={`block w-full rounded-xl border px-4 py-3 pr-12 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                      errors.password
                        ? "border-red-300 bg-red-50 focus:ring-red-200"
                        : "border-slate-200 bg-slate-50 focus:border-green-500 focus:ring-green-100 focus:bg-white"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                id="login-submit-btn"
                ref={submitBtnRef}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 px-6 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none mt-2"
                style={{
                  background: isLoading
                    ? "#16a34a"
                    : "linear-gradient(135deg, #16a34a 0%, #059669 100%)",
                  boxShadow: "0 4px 14px rgba(22,163,74,0.3)",
                }}
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <p className="mt-7 text-center text-[11px] text-slate-400">
              LOOK@ME Garment Project &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
