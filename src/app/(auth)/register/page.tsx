"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { registerUser } from "@/actions/auth";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import SiteLogo from "@/components/ui/SiteLogo";

export default function RegisterPage() {
  const router = useRouter();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/site-logo", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setLogoUrl(data.url ?? null))
      .catch(() => setLogoUrl(null));
  }, []);

  const [form, setForm] = useState({
    username: "",
    email: "",
    displayName: "",
    countryCode: "+91",
    phone: "",
    password: "",
    confirmPassword: "",
    referralCode: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    const res = await registerUser(form);
    setLoading(false);

    if (!res.success) {
      setError(res.error || "Registration failed");
      return;
    }

    setSuccess("Account created successfully");

    const login = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    if (login?.error) {
      router.push("/login");
      return;
    }

    router.push("/home");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <SiteLogo url={logoUrl} size={64} className="rounded-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
          <p className="text-sm text-muted-foreground mt-1">Join Love e Birds today</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-card-border rounded-2xl p-6 shadow-sm space-y-3.5">
          <div className="grid grid-cols-1 gap-3.5">
            <Input
              label="Username"
              name="username"
              placeholder="e.g. aishwarya_90"
              value={form.username}
              onChange={handleChange}
            />
            <Input
              label="Display Name"
              name="displayName"
              placeholder="Your name"
              value={form.displayName}
              onChange={handleChange}
            />
            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
            />
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Phone Number</label>
              <div className="flex gap-2">
                <select
                  name="countryCode"
                  value={form.countryCode}
                  onChange={handleChange}
                  className="w-24 px-3 py-2.5 text-sm rounded-lg border border-card-border bg-card focus:border-primary outline-none"
                >
                  <option value="+91">+91 🇮🇳</option>
                  <option value="+92">+92 🇵🇰</option>
                  <option value="+880">+880 🇧🇩</option>
                  <option value="+94">+94 🇱🇰</option>
                  <option value="+977">+977 🇳🇵</option>
                  <option value="+44">+44 🇬🇧</option>
                  <option value="+1">+1 🇺🇸</option>
                  <option value="+971">+971 🇦🇪</option>
                  <option value="+966">+966 🇸🇦</option>
                  <option value="+974">+974 🇶🇦</option>
                </select>
                <input
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="9876543210"
                  value={form.phone}
                  onChange={handleChange}
                  className="flex-1 px-3.5 py-2.5 text-sm rounded-lg border border-card-border bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            </div>
            <Input
              label="Referral Code (optional)"
              name="referralCode"
              placeholder="Enter referral code (e.g. LOVEBIRDS)"
              value={form.referralCode}
              onChange={handleChange}
            />
          </div>

          <div className="relative">
            <Input
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters"
              value={form.password}
              onChange={handleChange}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[38px] text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="relative">
            <Input
              label="Confirm Password"
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="Re-enter your password"
              value={form.confirmPassword}
              onChange={handleChange}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-[38px] text-muted-foreground hover:text-foreground"
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
          {success && (
            <p className="text-sm text-success bg-green-50 rounded-lg px-3 py-2 flex items-center gap-2">
              <CheckCircle2 size={16} /> {success}
            </p>
          )}

          <Button type="submit" className="w-full" loading={loading} size="lg">
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-medium">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}