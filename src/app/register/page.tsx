"use client";

import { LoadingLogo } from "@/components/LoadingLogo";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Search, Eye, EyeOff, CheckCircle } from "lucide-react";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { GithubLoginButton } from "@/components/GithubLoginButton";

export default function RegisterPage() {
  const { register, verifyOTP } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Verification state
  const [requireVerification, setRequireVerification] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);

  // Password strength meter
  const [strength, setStrength] = useState(0);
  const [strengthLabel, setStrengthLabel] = useState("");

  useEffect(() => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    setStrength(score);

    if (password.length === 0) setStrengthLabel("");
    else if (score <= 2) setStrengthLabel("Weak");
    else if (score <= 4) setStrengthLabel("Medium");
    else setStrengthLabel("Strong");
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!agreeTerms || !agreePrivacy) {
      setError("You must agree to the Terms of Service and Privacy Policy");
      return;
    }

    setLoading(true);

    try {
      const res = await register(email, password, name, phone || undefined);
      if (res.requireVerification) {
        setRequireVerification(true);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setVerifyLoading(true);

    try {
      await verifyOTP(email, otp);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setVerifyLoading(false);
    }
  };

  if (requireVerification) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50 py-12 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Verify your email</h1>
            <p className="text-slate-600 mt-1">
              We sent a 6-digit code to <strong>{email}</strong>
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-center tracking-[0.5em] font-mono text-lg"
                  placeholder="------"
                  maxLength={6}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={verifyLoading || otp.length !== 6}
                className="w-full bg-emerald-600 text-slate-900 dark:text-white py-2.5 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {verifyLoading ? (
                  <>
                    <LoadingLogo className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Continue"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const strengthColors = {
    Weak: "bg-red-500",
    Medium: "bg-yellow-500",
    Strong: "bg-emerald-500",
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
              <span className="text-slate-900 dark:text-white font-bold text-lg tracking-wider">LF</span>
            </div>
            <span className="text-2xl font-bold text-slate-900 tracking-tight">LOSTFOUND</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">
            Create your account
          </h1>
          <p className="text-slate-600 mt-1">
            Join our global community today
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Phone Number <span className="text-slate-600 dark:text-slate-400">(optional)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all pr-10"
                  placeholder="Min. 8 characters"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {password.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 flex h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${strengthColors[strengthLabel as keyof typeof strengthColors]}`}
                      style={{ width: `${Math.min((strength / 5) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-600 min-w-[50px]">{strengthLabel}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Confirm Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                placeholder="Confirm your password"
                required
              />
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div className="text-sm text-slate-600">
                  I agree to the <Link href="/terms" className="text-emerald-600 hover:underline">Terms & Conditions</Link>
                </div>
              </label>
              
              <label className="flex items-start gap-3">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    checked={agreePrivacy}
                    onChange={(e) => setAgreePrivacy(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div className="text-sm text-slate-600">
                  I agree to the <Link href="/privacy" className="text-emerald-600 hover:underline">Privacy Policy</Link>
                </div>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !agreeTerms || !agreePrivacy}
              className="w-full bg-emerald-600 text-slate-900 dark:text-white py-2.5 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <>
                  <LoadingLogo className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="relative flex items-center my-6">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">or sign up with</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <GoogleLoginButton action="register" />
            <GithubLoginButton action="register" />
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-emerald-600 font-medium hover:text-emerald-700"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
