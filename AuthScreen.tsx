import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MessageCircle,
  Users,
  Zap,
  ShieldCheck,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  ArrowLeft,
  Camera,
  X,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  signIn,
  signUp,
  validateEmail,
  passwordStrength,
  adminLogin,
} from "@/lib/auth";
import type { User } from "@/types/chatterra";

type Props = {
  onAuthenticated: (user: User) => void;
  onAdminLogin: () => void;
};

export function AuthScreen({ onAuthenticated, onAdminLogin }: Props) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [adminMode, setAdminMode] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const strength = passwordStrength(password);

  function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image")) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(String(reader.result));
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (adminMode) {
      if (!adminPassword) {
        setError("Please enter the admin password.");
        return;
      }
      if (adminLogin(adminPassword)) {
        onAdminLogin();
      } else {
        setError("Incorrect admin password.");
      }
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (mode === "signup") {
      if (!name.trim()) {
        setError("Please enter a display name.");
        return;
      }
      if (password !== confirm) {
        setError("Passwords do not match.");
        return;
      }
      if (strength.score < 3) {
        setError("Please choose a stronger password.");
        return;
      }
    }

    setBusy(true);
    try {
      const user =
        mode === "signup"
          ? await signUp(name, email, password, avatarUrl)
          : await signIn(email, password);
      onAuthenticated(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-blue-950">
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-blue-900 via-blue-950 to-blue-950 p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
            <MessageCircle className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight">chatterra</span>
        </div>
        <div className="space-y-8">
          <h1 className="font-serif text-5xl font-bold leading-tight">
            Conversations that
            <br />
            actually flow.
          </h1>
          <p className="max-w-md text-blue-100/90 text-lg">
            Live group chats, public topics, private invites, photos and video.
            A space for every crew — start talking in seconds.
          </p>
          <div className="grid gap-4">
            <Feature
              icon={<Zap className="h-5 w-5" />}
              title="Live messaging"
              text="Messages appear instantly as you type."
            />
            <Feature
              icon={<Bell className="h-5 w-5" />}
              title="Smart notifications"
              text="Get alerted the moment someone replies."
            />
            <Feature
              icon={<Users className="h-5 w-5" />}
              title="Public rooms"
              text="Every group and topic is visible to all users."
            />
            <Feature
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Secured accounts"
              text="Passwords are salted and hashed before storage."
            />
          </div>
        </div>
        <p className="text-sm text-blue-200/70">Developed by Aragbada</p>
      </div>

      <div className="flex items-center justify-center bg-blue-950 p-6 sm:p-10">
        <Card className="w-full max-w-md rounded-2xl border-blue-900 bg-blue-900/60 shadow-2xl backdrop-blur">
          <CardContent className="p-8">
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white">
                <MessageCircle className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold text-white">chatterra</span>
            </div>

            {adminMode ? (
              <>
                <button
                  onClick={() => {
                    setAdminMode(false);
                    setError("");
                    setAdminPassword("");
                  }}
                  className="mb-4 flex items-center gap-1.5 text-sm text-blue-300/80 hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to sign in
                </button>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
                    <Lock className="h-4 w-4" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    Admin access
                  </h2>
                </div>
                <p className="mt-1 text-sm text-blue-200/80">
                  Restricted area. Enter the administrator password to manage
                  all user accounts.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-white">
                  {mode === "signin" ? "Welcome back" : "Create your account"}
                </h2>
                <p className="mt-1 text-sm text-blue-200/80">
                  {mode === "signin"
                    ? "Sign in to jump back into the conversation."
                    : "Join chatterra and start chatting today."}
                </p>
              </>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {adminMode ? (
                <div className="space-y-2">
                  <Label htmlFor="admin-pass" className="text-blue-100">
                    Admin password
                  </Label>
                  <div className="relative">
                    <Input
                      id="admin-pass"
                      type={showPassword ? "text" : "password"}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="off"
                      className="border-blue-800 bg-blue-950/70 pr-10 text-white placeholder:text-blue-300/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300/60 hover:text-blue-100"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {mode === "signup" && (
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-20 w-20 ring-2 ring-purple-500/40">
                          {avatarUrl && (
                            <AvatarImage src={avatarUrl} alt="Profile" />
                          )}
                          <AvatarFallback className="bg-blue-800 text-lg text-blue-100">
                            {name.trim()
                              ? name.trim().slice(0, 2).toUpperCase()
                              : "?"}
                          </AvatarFallback>
                        </Avatar>
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-white shadow-md transition hover:bg-purple-500"
                          title="Upload profile picture"
                        >
                          <Camera className="h-4 w-4" />
                        </button>
                        {avatarUrl && (
                          <button
                            type="button"
                            onClick={() => setAvatarUrl(undefined)}
                            className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-white shadow-md transition hover:bg-rose-500"
                            title="Remove photo"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatar}
                        />
                      </div>
                      <p className="text-xs text-blue-300/60">
                        Add a profile picture (optional)
                      </p>
                    </div>
                  )}

                  {mode === "signup" && (
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-blue-100">
                        Display name
                      </Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ada Lovelace"
                        autoComplete="name"
                        className="border-blue-800 bg-blue-950/70 text-white placeholder:text-blue-300/40"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-blue-100">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="border-blue-800 bg-blue-950/70 text-white placeholder:text-blue-300/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-blue-100">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete={
                          mode === "signin" ? "current-password" : "new-password"
                        }
                        className="border-blue-800 bg-blue-950/70 pr-10 text-white placeholder:text-blue-300/40"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300/60 hover:text-blue-100"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {mode === "signup" && password.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex gap-1">
                          {[0, 1, 2, 3, 4].map((i) => (
                            <span
                              key={i}
                              className={cn(
                                "h-1.5 flex-1 rounded-full transition",
                                i < strength.score
                                  ? strength.score >= 4
                                    ? "bg-emerald-500"
                                    : strength.score >= 3
                                      ? "bg-purple-400"
                                      : "bg-amber-500"
                                  : "bg-blue-800"
                              )}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-blue-200/70">
                          Strength:{" "}
                          <span className="font-medium text-blue-100">
                            {strength.label}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                  {mode === "signup" && (
                    <div className="space-y-2">
                      <Label htmlFor="confirm" className="text-blue-100">
                        Confirm password
                      </Label>
                      <Input
                        id="confirm"
                        type={showPassword ? "text" : "password"}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="border-blue-800 bg-blue-950/70 text-white placeholder:text-blue-300/40"
                      />
                    </div>
                  )}
                </>
              )}

              {error && (
                <p className="rounded-lg bg-rose-950/60 px-3 py-2 text-sm text-rose-300">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-purple-600 hover:bg-purple-500"
              >
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {adminMode
                  ? "Enter admin panel"
                  : mode === "signin"
                    ? "Sign in"
                    : "Create account"}
              </Button>
            </form>

            {!adminMode && (
              <p className="mt-6 text-center text-sm text-blue-200/80">
                {mode === "signin"
                  ? "New to chatterra?"
                  : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "signin" ? "signup" : "signin");
                    setError("");
                  }}
                  className="font-semibold text-purple-300 hover:underline"
                >
                  {mode === "signin" ? "Sign up" : "Sign in"}
                </button>
              </p>
            )}

            {!adminMode && (
              <button
                type="button"
                onClick={() => {
                  setAdminMode(true);
                  setError("");
                }}
                className="mt-4 flex w-full items-center justify-center gap-1.5 text-xs text-blue-300/60 hover:text-amber-300"
              >
                <Lock className="h-3.5 w-3.5" />
                Administrator login
              </button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl bg-white/5 p-4 backdrop-blur">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/30">
        {icon}
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-blue-100/80">{text}</p>
      </div>
    </div>
  );
}