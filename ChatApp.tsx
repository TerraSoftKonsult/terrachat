import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  MessageCircle,
  Plus,
  Send,
  Hash,
  Users,
  LogOut,
  Menu,
  X,
  Globe,
  ImagePlus,
  Trash2,
  Film,
  Archive,
  ArchiveRestore,
  Lock,
  UserPlus,
  Check,
  Camera,
  UserCog,
  Bell,
  BellRing,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { clearSession, updateProfile } from "@/lib/auth";
import type { Attachment, Channel, Message, User } from "@/types/chatterra";

type Props = {
  user: User;
  onSignOut: () => void;
};

const SEED_CHANNELS: Channel[] = [
  {
    id: "general",
    name: "general",
    topic: "Company-wide announcements and watercooler talk",
    isGroup: true,
    isPrivate: false,
    createdBy: "Aragbada",
    createdById: "system",
    members: ["Aragbada"],
    memberIds: ["system"],
    archived: false,
    messages: [
      {
        id: "m1",
        authorId: "system",
        authorName: "Aragbada",
        avatarColor: "bg-blue-500",
        text: "Welcome to chatterra! Say hi 👋",
        timestamp: Date.now() - 1000 * 60 * 30,
      },
    ],
  },
  {
    id: "design",
    name: "design",
    topic: "Pixel-perfect debates and design critiques",
    isGroup: false,
    isPrivate: false,
    createdBy: "Aragbada",
    createdById: "system",
    members: ["Aragbada"],
    memberIds: ["system"],
    archived: false,
    messages: [
      {
        id: "m2",
        authorId: "system",
        authorName: "Aragbada",
        avatarColor: "bg-cyan-500",
        text: "Drop your latest mockups here.",
        timestamp: Date.now() - 1000 * 60 * 12,
      },
    ],
  },
];

export function ChatApp({ user, onSignOut }: Props) {
  const [currentUser, setCurrentUser] = useState<User>(user);
  const [channels, setChannels] = useState<Channel[]>(SEED_CHANNELS);
  const [activeId, setActiveId] = useState<string>(SEED_CHANNELS[0].id);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<Attachment | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Channel | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<
    { id: string; channelId: string; channelName: string; from: string; text: string; timestamp: number }[]
  >([]);
  const [unread, setUnread] = useState<Record<string, number>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const active = useMemo(
    () => channels.find((c) => c.id === activeId) ?? channels[0],
    [channels, activeId]
  );

  const visible = useMemo(
    () =>
      channels.filter(
        (c) => !c.isPrivate || c.memberIds.includes(currentUser.id)
      ),
    [channels, currentUser.id]
  );

  const liveChannels = useMemo(
    () => visible.filter((c) => !c.archived),
    [visible]
  );
  const archivedChannels = useMemo(
    () => visible.filter((c) => c.archived),
    [visible]
  );
  const groups = useMemo(
    () => liveChannels.filter((c) => c.isGroup && !c.isPrivate),
    [liveChannels]
  );
  const topics = useMemo(
    () => liveChannels.filter((c) => !c.isGroup && !c.isPrivate),
    [liveChannels]
  );
  const privateChats = useMemo(
    () => liveChannels.filter((c) => c.isPrivate),
    [liveChannels]
  );

  const totalUnread = useMemo(
    () => Object.values(unread).reduce((a, b) => a + b, 0),
    [unread]
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [active?.messages.length, activeId]);

  useEffect(() => {
    if (active) {
      setUnread((prev) => {
        if (!prev[active.id]) return prev;
        const next = { ...prev };
        delete next[active.id];
        return next;
      });
    }
  }, [activeId, active]);

  function handleSignOut() {
    clearSession();
    onSignOut();
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith("video");
    const isImage = file.type.startsWith("image");
    if (!isVideo && !isImage) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPending({
        type: isVideo ? "video" : "image",
        url: String(reader.result),
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function sendMessage() {
    const text = draft.trim();
    if ((!text && !pending) || !active) return;
    const msg: Message = {
      id: `msg-${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      avatarColor: currentUser.avatarColor,
      avatarUrl: currentUser.avatarUrl,
      text,
      attachment: pending ?? undefined,
      timestamp: Date.now(),
    };
    setChannels((prev) =>
      prev.map((c) =>
        c.id === active.id ? { ...c, messages: [...c.messages, msg] } : c
      )
    );
    setDraft("");
    setPending(null);
  }

  function createChannel(
    name: string,
    topic: string,
    isGroup: boolean,
    isPrivate: boolean
  ) {
    const id = `${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
    const channel: Channel = {
      id,
      name,
      topic: topic || "No topic set yet",
      isGroup,
      isPrivate,
      createdBy: currentUser.name,
      createdById: currentUser.id,
      members: [currentUser.name],
      memberIds: [currentUser.id],
      archived: false,
      messages: [
        {
          id: `msg-${Date.now()}`,
          authorId: currentUser.id,
          authorName: currentUser.name,
          avatarColor: currentUser.avatarColor,
          avatarUrl: currentUser.avatarUrl,
          text: isPrivate
            ? `Created the private chat "${name}". Invite people by their chatterra name.`
            : isGroup
              ? `Created the public group "${name}". Anyone can join the conversation!`
              : `Started the public topic "${name}". Jump in!`,
          timestamp: Date.now(),
        },
      ],
    };
    setChannels((prev) => [...prev, channel]);
    setActiveId(id);
    setSidebarOpen(false);
    pushNotification(
      id,
      name,
      "chatterra",
      isPrivate
        ? "Private chat created"
        : isGroup
          ? "New public group created"
          : "New public topic created"
    );
  }

  function pushNotification(
    channelId: string,
    channelName: string,
    from: string,
    text: string
  ) {
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
        channelId,
        channelName,
        from,
        text,
        timestamp: Date.now(),
      },
      ...prev,
    ]);
    if (channelId !== activeId) {
      setUnread((prev) => ({
        ...prev,
        [channelId]: (prev[channelId] ?? 0) + 1,
      }));
    }
  }

  function inviteMember(channelId: string, memberName: string) {
    const clean = memberName.trim();
    if (!clean) return;
    setChannels((prev) =>
      prev.map((c) => {
        if (c.id !== channelId) return c;
        if (c.members.some((m) => m.toLowerCase() === clean.toLowerCase())) {
          return c;
        }
        return {
          ...c,
          members: [...c.members, clean],
          messages: [
            ...c.messages,
            {
              id: `msg-${Date.now()}`,
              authorId: "system",
              authorName: "chatterra",
              avatarColor: "bg-purple-600",
              text: `${clean} was invited to this chat.`,
              timestamp: Date.now(),
            },
          ],
        };
      })
    );
    const ch = channels.find((c) => c.id === channelId);
    pushNotification(
      channelId,
      ch?.name ?? "chat",
      "chatterra",
      `${clean} was invited`
    );
  }

  function deleteChannel(id: string) {
    setChannels((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (next.length === 0) return prev;
      if (id === activeId) setActiveId(next[0].id);
      return next;
    });
    setNotifications((prev) => prev.filter((n) => n.channelId !== id));
    setUnread((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function toggleArchive(id: string) {
    setChannels((prev) =>
      prev.map((c) => (c.id === id ? { ...c, archived: !c.archived } : c))
    );
  }

  function archiveAllOld() {
    setChannels((prev) => prev.map((c) => ({ ...c, archived: true })));
    setShowArchived(true);
  }

  function handleProfileSave(name: string, avatarUrl?: string) {
    const updated = updateProfile(currentUser.id, { name, avatarUrl });
    if (updated) {
      setCurrentUser(updated);
      setChannels((prev) =>
        prev.map((c) => ({
          ...c,
          messages: c.messages.map((m) =>
            m.authorId === updated.id
              ? {
                  ...m,
                  authorName: updated.name,
                  avatarColor: updated.avatarColor,
                  avatarUrl: updated.avatarUrl,
                }
              : m
          ),
        }))
      );
    }
    setProfileOpen(false);
  }

  function openChannel(id: string) {
    setActiveId(id);
    setSidebarOpen(false);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-blue-950">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-blue-900 bg-blue-900/70 backdrop-blur transition-transform md:static md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-blue-800 bg-gradient-to-r from-blue-800 to-blue-950 px-5 py-4 text-white">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <span className="text-lg font-bold tracking-tight">chatterra</span>
          </div>
          <button
            className="md:hidden text-white/80 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-300/70">
            <Globe className="h-3.5 w-3.5" />
            Rooms
          </p>
          <NewChannelDialog onCreate={createChannel} />
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {privateChats.length > 0 && (
            <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-blue-300/60">
              Private chats
            </p>
          )}
          {privateChats.map((c) => (
            <ChannelButton
              key={c.id}
              channel={c}
              active={c.id === activeId}
              unread={unread[c.id] ?? 0}
              canDelete={c.createdById === currentUser.id}
              onClick={() => openChannel(c.id)}
              onDelete={() => setConfirmDelete(c)}
              onArchive={() => toggleArchive(c.id)}
            />
          ))}

          {groups.length > 0 && (
            <p className="px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-blue-300/60">
              Group chats
            </p>
          )}
          {groups.map((c) => (
            <ChannelButton
              key={c.id}
              channel={c}
              active={c.id === activeId}
              unread={unread[c.id] ?? 0}
              canDelete={c.createdById === currentUser.id}
              onClick={() => openChannel(c.id)}
              onDelete={() => setConfirmDelete(c)}
              onArchive={() => toggleArchive(c.id)}
            />
          ))}

          {topics.length > 0 && (
            <p className="px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-blue-300/60">
              Topics
            </p>
          )}
          {topics.map((c) => (
            <ChannelButton
              key={c.id}
              channel={c}
              active={c.id === activeId}
              unread={unread[c.id] ?? 0}
              canDelete={c.createdById === currentUser.id}
              onClick={() => openChannel(c.id)}
              onDelete={() => setConfirmDelete(c)}
              onArchive={() => toggleArchive(c.id)}
            />
          ))}

          <button
            onClick={() => setShowArchived((s) => !s)}
            className="mt-4 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-wider text-blue-300/60 transition hover:bg-blue-800/40 hover:text-blue-200"
          >
            <Archive className="h-3.5 w-3.5" />
            Archived ({archivedChannels.length})
          </button>

          {showArchived && (
            <div className="mt-1">
              {archivedChannels.length === 0 ? (
                <p className="px-3 py-2 text-xs text-blue-300/50">
                  No archived chats yet.
                </p>
              ) : (
                archivedChannels.map((c) => (
                  <ChannelButton
                    key={c.id}
                    channel={c}
                    active={c.id === activeId}
                    unread={unread[c.id] ?? 0}
                    canDelete={c.createdById === currentUser.id}
                    onClick={() => openChannel(c.id)}
                    onDelete={() => setConfirmDelete(c)}
                    onArchive={() => toggleArchive(c.id)}
                  />
                ))
              )}
            </div>
          )}
        </div>

        <div className="border-t border-blue-900 p-4">
          <Button
            variant="outline"
            onClick={archiveAllOld}
            className="mb-3 w-full rounded-xl border-blue-700 bg-blue-950/70 text-blue-100 hover:bg-blue-800"
          >
            <Archive className="mr-2 h-4 w-4" />
            Archive all chats
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              {currentUser.avatarUrl && (
                <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
              )}
              <AvatarFallback
                className={cn(currentUser.avatarColor, "text-white")}
              >
                {currentUser.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-blue-50">
                {currentUser.name}
              </p>
              <p className="truncate text-xs text-blue-300/60">
                {currentUser.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setProfileOpen(true)}
              className="text-blue-300/70 hover:text-purple-300"
              title="Edit profile"
            >
              <UserCog className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="text-blue-300/70 hover:text-rose-400"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-blue-950/80 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-blue-900 bg-blue-900/60 px-4 py-3 backdrop-blur sm:px-6">
          <button
            className="md:hidden text-blue-300 hover:text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 truncate text-lg font-bold text-white">
              {active?.isPrivate ? (
                <Lock className="h-4 w-4 text-amber-400" />
              ) : active?.isGroup ? (
                <Users className="h-4 w-4 text-purple-400" />
              ) : (
                <Hash className="h-4 w-4 text-cyan-400" />
              )}
              {active?.name}
              {active?.archived && (
                <span className="rounded-full bg-blue-800 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-blue-200">
                  Archived
                </span>
              )}
            </h1>
            <p className="truncate text-xs text-blue-300/70">{active?.topic}</p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setNotifOpen(true)}
            className="relative text-blue-300/80 hover:text-purple-300"
            title="Notifications"
          >
            {totalUnread > 0 ? (
              <BellRing className="h-5 w-5" />
            ) : (
              <Bell className="h-5 w-5" />
            )}
            {totalUnread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-purple-600 px-1 text-[10px] font-bold text-white">
                {totalUnread > 9 ? "9+" : totalUnread}
              </span>
            )}
          </Button>

          {active?.isPrivate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setInviteOpen(true)}
              className="text-amber-300/90 hover:text-amber-200"
            >
              <UserPlus className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">Invite</span>
            </Button>
          )}
          {active && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleArchive(active.id)}
              className="hidden text-blue-300/80 hover:text-purple-300 sm:flex"
            >
              {active.archived ? (
                <>
                  <ArchiveRestore className="mr-1.5 h-4 w-4" />
                  Unarchive
                </>
              ) : (
                <>
                  <Archive className="mr-1.5 h-4 w-4" />
                  Archive
                </>
              )}
            </Button>
          )}
          {active && active.createdById === currentUser.id && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDelete(active)}
              className="hidden text-blue-300/80 hover:text-rose-400 sm:flex"
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Remove
            </Button>
          )}
          <span className="hidden items-center gap-1.5 rounded-full bg-emerald-950 px-3 py-1 text-xs font-medium text-emerald-400 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Live
          </span>
        </header>

        {active?.isPrivate && (
          <div className="flex flex-wrap items-center gap-2 border-b border-blue-900 bg-blue-900/40 px-4 py-2 sm:px-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-300/60">
              Members
            </span>
            {active.members.map((m) => (
              <span
                key={m}
                className="rounded-full bg-blue-800/70 px-2.5 py-0.5 text-xs text-blue-100"
              >
                {m}
              </span>
            ))}
          </div>
        )}

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto bg-blue-950 px-4 py-6 sm:px-6"
        >
          <div className="mx-auto max-w-3xl space-y-5">
            {active?.messages.map((m) => {
              const mine = m.authorId === currentUser.id;
              return (
                <div
                  key={m.id}
                  className={cn(
                    "flex items-end gap-3",
                    mine && "flex-row-reverse"
                  )}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    {m.avatarUrl && (
                      <AvatarImage src={m.avatarUrl} alt={m.authorName} />
                    )}
                    <AvatarFallback
                      className={cn(m.avatarColor, "text-white text-xs")}
                    >
                      {m.authorName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={cn(
                      "max-w-md rounded-2xl px-4 py-2.5 shadow-md",
                      mine
                        ? "bg-purple-600 text-white rounded-br-sm"
                        : "bg-blue-900/80 text-blue-50 border border-blue-800 rounded-bl-sm"
                    )}
                  >
                    {!mine && (
                      <p className="mb-0.5 text-xs font-semibold text-purple-300">
                        {m.authorName}
                      </p>
                    )}
                    {m.attachment && (
                      <div className="mb-2 overflow-hidden rounded-xl">
                        {m.attachment.type === "image" ? (
                          <img
                            src={m.attachment.url}
                            alt={m.attachment.name}
                            className="max-h-64 w-full object-cover"
                          />
                        ) : (
                          <video
                            src={m.attachment.url}
                            controls
                            className="max-h-64 w-full"
                          />
                        )}
                      </div>
                    )}
                    {m.text && (
                      <p className="text-sm leading-relaxed">{m.text}</p>
                    )}
                    <p
                      className={cn(
                        "mt-1 text-[10px]",
                        mine ? "text-purple-100/80" : "text-blue-300/60"
                      )}
                    >
                      {new Date(m.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-blue-900 bg-blue-900/60 px-4 py-3 backdrop-blur sm:px-6">
          {pending && (
            <div className="mx-auto mb-2 flex max-w-3xl items-center gap-3 rounded-xl border border-purple-700 bg-blue-950/70 p-2">
              {pending.type === "image" ? (
                <img
                  src={pending.url}
                  alt={pending.name}
                  className="h-12 w-12 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-600 text-white">
                  <Film className="h-5 w-5" />
                </div>
              )}
              <span className="min-w-0 flex-1 truncate text-xs text-blue-200">
                {pending.name}
              </span>
              <button
                onClick={() => setPending(null)}
                className="text-blue-300 hover:text-rose-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="mx-auto flex max-w-3xl items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFile}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileRef.current?.click()}
              className="shrink-0 rounded-xl border-blue-700 bg-blue-950/70 text-blue-200 hover:bg-blue-800 hover:text-white"
              title="Attach photo or video"
            >
              <ImagePlus className="h-4 w-4" />
            </Button>
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={`Message ${active?.name ?? ""}...`}
              className="rounded-xl border-blue-800 bg-blue-950/70 text-white placeholder:text-blue-300/40"
            />
            <Button
              onClick={sendMessage}
              disabled={!draft.trim() && !pending}
              className="rounded-xl bg-purple-600 hover:bg-purple-500"
            >
              <Send className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">Send</span>
            </Button>
          </div>
        </div>

        <footer className="border-t border-blue-900 bg-blue-950 px-4 py-3 text-center sm:px-6">
          <p className="text-xs text-blue-300/60">
            chatterra · Developed by Aragbada
          </p>
        </footer>
      </main>

      <NotificationsDialog
        open={notifOpen}
        onOpenChange={setNotifOpen}
        notifications={notifications}
        onOpenChannel={(id) => {
          openChannel(id);
          setNotifOpen(false);
        }}
        onClear={() => setNotifications([])}
      />

      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        channel={active}
        onInvite={(name) => active && inviteMember(active.id, name)}
      />

      <ProfileDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
        user={currentUser}
        onSave={handleProfileSave}
      />

      <Dialog
        open={confirmDelete !== null}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <DialogContent className="rounded-2xl border-blue-800 bg-blue-900 text-blue-50 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">
              Remove{" "}
              {confirmDelete?.isPrivate
                ? "chat"
                : confirmDelete?.isGroup
                  ? "group"
                  : "topic"}
              ?
            </DialogTitle>
            <DialogDescription className="text-blue-200/80">
              "{confirmDelete?.name}" and all its messages will be removed for
              everyone. This can't be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(null)}
              className="flex-1 rounded-xl border-blue-700 bg-blue-950/70 text-blue-100 hover:bg-blue-800"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (confirmDelete) deleteChannel(confirmDelete.id);
                setConfirmDelete(null);
              }}
              className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-500"
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NotificationsDialog({
  open,
  onOpenChange,
  notifications,
  onOpenChannel,
  onClear,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  notifications: {
    id: string;
    channelId: string;
    channelName: string;
    from: string;
    text: string;
    timestamp: number;
  }[];
  onOpenChannel: (id: string) => void;
  onClear: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-blue-800 bg-blue-900 text-blue-50 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Bell className="h-4 w-4 text-purple-300" />
            Notifications
          </DialogTitle>
          <DialogDescription className="text-blue-200/80">
            Activity across your chats. Tap one to jump straight to it.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 pt-2">
          {notifications.length === 0 ? (
            <div className="rounded-xl bg-blue-950/60 p-8 text-center">
              <Bell className="mx-auto h-7 w-7 text-blue-300/40" />
              <p className="mt-3 text-sm text-blue-300/70">
                You're all caught up.
              </p>
            </div>
          ) : (
            <>
              <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => onOpenChannel(n.channelId)}
                    className="flex w-full items-start gap-3 rounded-xl border border-blue-800 bg-blue-950/60 p-3 text-left transition hover:border-purple-600 hover:bg-blue-950"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-600/30 text-purple-300">
                      <BellRing className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-blue-50">
                        {n.channelName}
                      </span>
                      <span className="block truncate text-xs text-blue-200/80">
                        {n.text}
                      </span>
                      <span className="block text-[11px] text-blue-300/50">
                        {n.from} ·{" "}
                        {new Date(n.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                onClick={onClear}
                className="w-full rounded-xl border-blue-700 bg-blue-950/70 text-blue-100 hover:bg-blue-800"
              >
                Clear all
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProfileDialog({
  open,
  onOpenChange,
  user,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  user: User;
  onSave: (name: string, avatarUrl?: string) => void;
}) {
  const [name, setName] = useState(user.name);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(user.avatarUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(user.name);
      setAvatarUrl(user.avatarUrl);
    }
  }, [open, user]);

  function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image")) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(String(reader.result));
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-blue-800 bg-blue-900 text-blue-50 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <UserCog className="h-4 w-4 text-purple-300" />
            Edit profile
          </DialogTitle>
          <DialogDescription className="text-blue-200/80">
            Update your display name and profile picture. Changes appear on your
            messages instantly.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 pt-2">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar className="h-24 w-24 ring-2 ring-purple-500/40">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
                <AvatarFallback
                  className={cn(user.avatarColor, "text-2xl text-white")}
                >
                  {name.trim() ? name.trim().slice(0, 2).toUpperCase() : "?"}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-purple-600 text-white shadow-md transition hover:bg-purple-500"
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
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatar}
              />
            </div>
            <p className="text-xs text-blue-300/60">
              Tap the camera to upload a new picture
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-name" className="text-blue-100">
              Display name
            </Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-blue-800 bg-blue-950/70 text-white placeholder:text-blue-300/40"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-blue-100">Email</Label>
            <p className="rounded-xl border border-blue-800 bg-blue-950/50 px-3 py-2 text-sm text-blue-300/70">
              {user.email}
            </p>
          </div>

          <Button
            onClick={() => onSave(name, avatarUrl)}
            disabled={!name.trim()}
            className="w-full rounded-xl bg-purple-600 hover:bg-purple-500"
          >
            Save changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InviteDialog({
  open,
  onOpenChange,
  channel,
  onInvite,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  channel: Channel | undefined;
  onInvite: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const [added, setAdded] = useState<string[]>([]);

  function add() {
    const clean = name.trim();
    if (!clean) return;
    onInvite(clean);
    setAdded((prev) => [...prev, clean]);
    setName("");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          setName("");
          setAdded([]);
        }
      }}
    >
      <DialogContent className="rounded-2xl border-blue-800 bg-blue-900 text-blue-50 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Lock className="h-4 w-4 text-amber-400" />
            Invite to {channel?.name}
          </DialogTitle>
          <DialogDescription className="text-blue-200/80">
            Invite people by their chatterra display name. Only invited members
            can see this private chat.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="invite-name" className="text-blue-100">
              Chatterra name
            </Label>
            <div className="flex gap-2">
              <Input
                id="invite-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    add();
                  }
                }}
                placeholder="e.g. Ada Lovelace"
                className="border-blue-800 bg-blue-950/70 text-white placeholder:text-blue-300/40"
              />
              <Button
                onClick={add}
                disabled={!name.trim()}
                className="shrink-0 rounded-xl bg-purple-600 hover:bg-purple-500"
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {added.length > 0 && (
            <div className="space-y-1.5">
              {added.map((n) => (
                <div
                  key={n}
                  className="flex items-center gap-2 rounded-xl bg-blue-950/70 px-3 py-2 text-sm text-blue-100"
                >
                  <Check className="h-4 w-4 text-emerald-400" />
                  {n} invited
                </div>
              ))}
            </div>
          )}

          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-blue-300/60">
              Current members
            </p>
            <div className="flex flex-wrap gap-2">
              {channel?.members.map((m) => (
                <span
                  key={m}
                  className="rounded-full bg-blue-800/70 px-2.5 py-0.5 text-xs text-blue-100"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ChannelButton({
  channel,
  active,
  unread,
  canDelete,
  onClick,
  onDelete,
  onArchive,
}: {
  channel: Channel;
  active: boolean;
  unread: number;
  canDelete: boolean;
  onClick: () => void;
  onDelete: () => void;
  onArchive: () => void;
}) {
  return (
    <div
      className={cn(
        "group mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition",
        active
          ? "bg-purple-700/50 text-white"
          : "text-blue-200/80 hover:bg-blue-800/50"
      )}
    >
      <button
        onClick={onClick}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <span
          className={cn(
            "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            channel.isPrivate
              ? "bg-amber-600/30 text-amber-200"
              : channel.isGroup
                ? "bg-purple-600/40 text-purple-200"
                : "bg-cyan-600/30 text-cyan-200"
          )}
        >
          {channel.isPrivate ? (
            <Lock className="h-4 w-4" />
          ) : channel.isGroup ? (
            <Users className="h-4 w-4" />
          ) : (
            <Hash className="h-4 w-4" />
          )}
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-purple-600 px-1 text-[10px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">
            {channel.name}
          </span>
          <span className="block truncate text-xs text-blue-300/60">
            by {channel.createdBy} · {channel.messages.length} msgs
          </span>
        </span>
      </button>
      <button
        onClick={onArchive}
        title={channel.archived ? "Unarchive" : "Archive"}
        className="shrink-0 text-blue-300/50 opacity-0 transition group-hover:opacity-100 hover:text-purple-300"
      >
        {channel.archived ? (
          <ArchiveRestore className="h-4 w-4" />
        ) : (
          <Archive className="h-4 w-4" />
        )}
      </button>
      {canDelete && (
        <button
          onClick={onDelete}
          title="Remove chat"
          className="shrink-0 text-blue-300/50 opacity-0 transition group-hover:opacity-100 hover:text-rose-400"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function NewChannelDialog({
  onCreate,
}: {
  onCreate: (
    name: string,
    topic: string,
    isGroup: boolean,
    isPrivate: boolean
  ) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [kind, setKind] = useState<"group" | "topic" | "private">("group");

  function submit() {
    if (!name.trim()) return;
    onCreate(name.trim(), topic.trim(), kind === "group", kind === "private");
    setName("");
    setTopic("");
    setKind("group");
    setOpen(false);
  }

  const options: {
    key: "group" | "topic" | "private";
    label: string;
    desc: string;
    icon: React.ReactNode;
    activeClass: string;
    iconClass: string;
  }[] = [
    {
      key: "group",
      label: "Group chat",
      desc: "Public group",
      icon: <Users className="h-4 w-4" />,
      activeClass: "border-purple-500 bg-purple-900/40",
      iconClass: "text-purple-300",
    },
    {
      key: "topic",
      label: "New topic",
      desc: "Public discussion",
      icon: <Hash className="h-4 w-4" />,
      activeClass: "border-cyan-500 bg-cyan-900/40",
      iconClass: "text-cyan-300",
    },
    {
      key: "private",
      label: "Private chat",
      desc: "Invite only",
      icon: <Lock className="h-4 w-4" />,
      activeClass: "border-amber-500 bg-amber-900/40",
      iconClass: "text-amber-300",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-600 text-white transition hover:bg-purple-500">
          <Plus className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl border-blue-800 bg-blue-900 text-blue-50 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Create a chat</DialogTitle>
          <DialogDescription className="text-blue-200/80">
            Start a public group, a public topic, or a private chat you invite
            people to by name.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-3 gap-2">
            {options.map((o) => (
              <button
                key={o.key}
                onClick={() => setKind(o.key)}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition",
                  kind === o.key
                    ? o.activeClass
                    : "border-blue-800 hover:border-blue-700"
                )}
              >
                <span className={o.iconClass}>{o.icon}</span>
                <span className="text-sm font-semibold text-white">
                  {o.label}
                </span>
                <span className="text-xs text-blue-200/70">{o.desc}</span>
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="ch-name" className="text-blue-100">
              {kind === "group"
                ? "Group name"
                : kind === "topic"
                  ? "Topic name"
                  : "Chat name"}
            </Label>
            <Input
              id="ch-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                kind === "group"
                  ? "marketing-team"
                  : kind === "topic"
                    ? "product-ideas"
                    : "leadership"
              }
              className="border-blue-800 bg-blue-950/70 text-white placeholder:text-blue-300/40"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ch-topic" className="text-blue-100">
              Description
            </Label>
            <Textarea
              id="ch-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What's this chat about?"
              rows={3}
              className="border-blue-800 bg-blue-950/70 text-white placeholder:text-blue-300/40"
            />
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-blue-950/70 px-3 py-2 text-xs text-blue-200">
            {kind === "private" ? (
              <>
                <Lock className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                Private — only invited members can see this chat.
              </>
            ) : (
              <>
                <Globe className="h-3.5 w-3.5 shrink-0" />
                Public — visible to all users on chatterra.
              </>
            )}
          </div>
          <Button
            onClick={submit}
            disabled={!name.trim()}
            className="w-full rounded-xl bg-purple-600 hover:bg-purple-500"
          >
            Create chat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}