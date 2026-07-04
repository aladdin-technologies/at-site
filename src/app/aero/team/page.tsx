"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, UserPlus, Mail, Shield, Eye, Crown, Trash2 } from "lucide-react";

interface TeamMember {
  id: string;
  email: string;
  name: string | null;
  role: string;
  created_at: string;
}

interface Invite {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

const ROLE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  admin: { label: "Admin", icon: Crown, color: "text-amber-600 bg-amber-50" },
  editor: { label: "Editor", icon: Shield, color: "text-blue-600 bg-blue-50" },
  viewer: { label: "Viewer", icon: Eye, color: "text-gray-600 bg-gray-100" },
};

export default function TeamPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [inviteSent, setInviteSent] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("at-portal-auth") !== "1") {
      router.replace("/aero/login"); return;
    }
    setAuthorized(true);
  }, [router]);

  useEffect(() => {
    if (!authorized) return;
    loadTeam();
  }, [authorized]);

  async function loadTeam() {
    const user = JSON.parse(sessionStorage.getItem("forecast-user") || "{}");
    const companyId = user.company_id;
    if (!companyId) { setLoading(false); return; }

    const [mRes, iRes] = await Promise.all([
      supabase.from("forecast_users").select("*").eq("company_id", companyId).order("created_at"),
      supabase.from("forecast_invites").select("*").eq("company_id", companyId).order("created_at", { ascending: false }),
    ]);
    setMembers((mRes.data ?? []) as TeamMember[]);
    setInvites((iRes.data ?? []) as Invite[]);
    setLoading(false);
  }

  async function sendInvite() {
    if (!inviteEmail.trim()) return;
    const user = JSON.parse(sessionStorage.getItem("forecast-user") || "{}");

    await supabase.from("forecast_invites").insert({
      company_id: user.company_id,
      email: inviteEmail.toLowerCase().trim(),
      role: inviteRole,
      invited_by: user.id,
      status: "pending",
    });

    setInviteSent(true);
    setTimeout(() => {
      setShowInvite(false);
      setInviteEmail("");
      setInviteSent(false);
      loadTeam();
    }, 1500);
  }

  if (!authorized) return null;
  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between h-14 px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-900"><ArrowLeft size={18} /></button>
            <span className="text-sm font-bold text-gray-900">Team Management</span>
          </div>
          <button onClick={() => setShowInvite(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors">
            <UserPlus size={14} /> Invite Member
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Invite form */}
        {showInvite && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900 mb-4">Invite Team Member</h2>
            {inviteSent ? (
              <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                <Mail size={16} /> Invitation sent to {inviteEmail}
              </div>
            ) : (
              <div className="flex gap-3">
                <input
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  type="email"
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400"
                  autoFocus
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
                <button onClick={sendInvite} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700">Send</button>
                <button onClick={() => setShowInvite(false)} className="px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50">Cancel</button>
              </div>
            )}
          </div>
        )}

        {/* Team members */}
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Team Members ({members.length})</h2>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
          {members.map((m, i) => {
            const rc = ROLE_CONFIG[m.role] || ROLE_CONFIG.viewer;
            const RoleIcon = rc.icon;
            return (
              <div key={m.id} className={`flex items-center justify-between px-5 py-4 ${i > 0 ? "border-t border-gray-100" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                    {(m.name || m.email).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{m.name || m.email}</p>
                    <p className="text-xs text-gray-500">{m.email}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase ${rc.color}`}>
                  <RoleIcon size={10} /> {rc.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Pending invites */}
        {invites.length > 0 && (
          <>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Pending Invitations ({invites.filter(i => i.status === "pending").length})</h2>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {invites.map((inv, i) => (
                <div key={inv.id} className={`flex items-center justify-between px-5 py-4 ${i > 0 ? "border-t border-gray-100" : ""}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                      <Mail size={16} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">{inv.email}</p>
                      <p className="text-xs text-gray-400">Invited {new Date(inv.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${inv.status === "pending" ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"}`}>
                      {inv.status}
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase">{inv.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
