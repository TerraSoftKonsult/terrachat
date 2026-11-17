import { useEffect, useState } from "react";
import { AuthScreen } from "@/components/AuthScreen";
import { ChatApp } from "@/components/ChatApp";
import { AdminPanel } from "@/components/AdminPanel";
import {
  getSession,
  getAdminSession,
  setAdminSession,
  clearAdminSession,
} from "@/lib/auth";
import type { User } from "@/types/chatterra";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(getSession());
    setIsAdmin(getAdminSession());
    setReady(true);
  }, []);

  if (!ready) {
    return <div className="min-h-screen bg-blue-950" />;
  }

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-blue-950 text-slate-100">
        <AdminPanel
          onExit={() => {
            clearAdminSession();
            setIsAdmin(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-950 text-slate-100">
      {user ? (
        <ChatApp user={user} onSignOut={() => setUser(null)} />
      ) : (
        <AuthScreen
          onAuthenticated={setUser}
          onAdminLogin={() => {
            setAdminSession();
            setIsAdmin(true);
          }}
        />
      )}
    </div>
  );
}