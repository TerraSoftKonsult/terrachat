import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ShieldCheck,
  LogOut,
  Search,
  Ban,
  CheckCircle2,
  Trash2,
  Users,
  UserCheck,
  UserX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { listAllUsers, setUserBlocked, deleteUser } from "@/lib/auth";
import type { AdminUser } from "@/types/chatterra";

type Props = {
  onExit: () => void;
};

export function AdminPanel({ onExit }: Props) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");

  function refresh() {
    setUsers(listAllUsers());
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [users, query]);

  const blockedCount = users.filter((u) => u.blocked).length;
  const activeCount = users.length - blockedCount;

  function toggleBlock(u: AdminUser) {
    setUserBlocked(u.id, !u.blocked);
    refresh();
  }

  function remove(u: AdminUser) {
    deleteUser(u.id);
    refresh();
  }

  return (
    <div className="min-h-screen bg-blue-950">
      <header className="border-b border-blue-900 bg-gradient-to-r from-blue-900 via-blue-950 to-blue-950 px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Admin control</h1>
              <p className="text-xs text-blue-300/70">
                chatterra · Developed by Aragbada
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={onExit}
            className="rounded-xl border-blue-700 bg-blue-950/70 text-blue-100 hover:bg-blue-800"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Exit
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Total users"
            value={users.length}
            icon={<Users className="h-5 w-5" />}
            tone="bg-blue-600/20 text-blue-300"
          />
          <StatCard
            label="Active"
            value={activeCount}
            icon={<UserCheck className="h-5 w-5" />}
            tone="bg-emerald-600/20 text-emerald-300"
          />
          <StatCard
            label="Blocked"
            value={blockedCount}
            icon={<UserX className="h-5 w-5" />}
            tone="bg-rose-600/20 text-rose-300"
          />
        </div>

        <div className="mt-8 rounded-2xl border border-blue-900 bg-blue-900/50 shadow-xl">
          <div className="flex flex-col gap-3 border-b border-blue-800 p-5 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-white">User accounts</h2>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-300/50" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name or email"
                className="border-blue-800 bg-blue-950/70 pl-9 text-white placeholder:text-blue-300/40"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-10 text-center">
              <Users className="mx-auto h-8 w-8 text-blue-300/40" />
              <p className="mt-3 text-sm text-blue-300/70">
                {users.length === 0
                  ? "No users have signed up yet."
                  : "No users match your search."}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-blue-800">
              {filtered.map((u) => (
                <li
                  key={u.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {u.avatarUrl && (
                        <AvatarImage src={u.avatarUrl} alt={u.name} />
                      )}
                      <AvatarFallback
                        className={cn(u.avatarColor, "text-white text-sm")}
                      >
                        {u.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 truncate text-sm font-semibold text-blue-50">
                        {u.name}
                        {u.blocked && (
                          <span className="rounded-full bg-rose-950 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-rose-300">
                            Blocked
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-blue-300/60">
                        {u.email}
                      </p>
                      <p className="text-[11px] text-blue-300/40">
                        Joined {new Date(u.createdAt).toLocaleDateString()} ·
                        Last seen {new Date(u.lastSeen).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleBlock(u)}
                      className={cn(
                        "rounded-xl border-blue-700 bg-blue-950/70 hover:bg-blue-800",
                        u.blocked ? "text-emerald-300" : "text-amber-300"
                      )}
                    >
                      {u.blocked ? (
                        <>
                          <CheckCircle2 className="mr-1.5 h-4 w-4" />
                          Unblock
                        </>
                      ) : (
                        <>
                          <Ban className="mr-1.5 h-4 w-4" />
                          Block
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => remove(u)}
                      className="rounded-xl border-blue-700 bg-blue-950/70 text-rose-300 hover:bg-rose-950/60"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-blue-300/50">
          chatterra · Developed by Aragbada
        </p>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-blue-900 bg-blue-900/50 p-5 shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-300/60">
          {label}
        </span>
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl",
            tone
          )}
        >
          {icon}
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold text-white">{value}</p>
    </div>
  );
}