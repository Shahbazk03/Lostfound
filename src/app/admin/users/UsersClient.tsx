"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BadgeCheck, Copy, KeyRound, Pencil, Plus, RefreshCw, Shield, ShieldOff, Trash2, Users as UsersIcon } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { adminFetch, errorMessage } from "@/components/admin/admin-api";
import { useAdminLoader } from "@/components/admin/useAdminLoader";
import { useConfirm, useToast } from "@/components/admin/AdminFeedback";
import { Button } from "@/components/admin/ui/Button";
import { DataTable, type Column } from "@/components/admin/ui/DataTable";
import { FilterTabs } from "@/components/admin/ui/FilterTabs";
import { Field, Input, Select, Switch } from "@/components/admin/ui/Form";
import type { MenuItem } from "@/components/admin/ui/Menu";
import { Dialog, Drawer } from "@/components/admin/ui/Overlay";
import { PageContainer, PageHeader } from "@/components/admin/ui/PageHeader";
import { Badge, StatusBadge } from "@/components/admin/ui/StatusBadge";

interface AdminUser {
  id: number;
  email: string;
  name: string;
  phone?: string | null;
  role: string;
  verified?: boolean;
  createdAt: string;
  _count: { items: number };
  totalEarned?: Record<string, number>;
}

type RoleFilter = "all" | "admin" | "user";

type NewUserForm = { name: string; email: string; password: string; role: string };
type EditForm = { id: number; name: string; email: string; phone: string; role: string; verified: boolean };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
const EMPTY_NEW: NewUserForm = { name: "", email: "", password: "", role: "user" };

function safeCurrency(amount: number, currency: string) {
  try {
    return formatCurrency(amount, currency.toUpperCase());
  } catch {
    return `${(amount / 100).toFixed(2)} ${currency}`;
  }
}

/** 14 characters from an unambiguous alphabet, using the browser CSPRNG. */
function generatePassword(length = 14) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%*?";
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

function earnedEntries(u: AdminUser) {
  return Object.entries(u.totalEarned ?? {}).filter(([, v]) => Number(v) > 0);
}

function validateCommon(f: { name: string; email: string }) {
  const errors: Record<string, string> = {};
  if (!f.name.trim()) errors.name = "Name is required";
  else if (f.name.trim().length > 100) errors.name = "At most 100 characters";
  if (!f.email.trim()) errors.email = "Email is required";
  else if (!EMAIL_PATTERN.test(f.email.trim())) errors.email = "Enter a valid email address";
  return errors;
}

export default function UsersClient() {
  const toast = useToast();
  const confirm = useConfirm();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: me } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [newUser, setNewUser] = useState<NewUserForm>(EMPTY_NEW);
  const [newTouched, setNewTouched] = useState(false);
  const [edit, setEdit] = useState<EditForm | null>(null);
  const [editTouched, setEditTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [resetFor, setResetFor] = useState<AdminUser | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetTouched, setResetTouched] = useState(false);

  const wantsNew = searchParams.get("new") === "1";
  const showCreate = createOpen || wantsNew;

  const loadUsers = useCallback(async () => {
    const data = await adminFetch<{ users?: AdminUser[] }>("/api/admin/users", {}, "Failed to load users");
    setUsers(data?.users ?? []);
  }, []);
  // fetchUsers() re-runs the load quietly (after a change); reload() shows the skeleton.
  const { loading, error: loadError, reload, refresh: fetchUsers } = useAdminLoader(loadUsers, "Failed to load users");

  const adminCount = users.filter((u) => u.role === "admin").length;
  const counts = { all: users.length, admin: adminCount, user: users.length - adminCount };
  const rows = useMemo(() => (roleFilter === "all" ? users : users.filter((u) => u.role === roleFilter)), [users, roleFilter]);

  // ---- Create
  const newErrors: Record<string, string> = { ...validateCommon(newUser) };
  if (newUser.password.length < 8) newErrors.password = "At least 8 characters";
  else if (newUser.password.length > 128) newErrors.password = "At most 128 characters";

  const closeCreate = () => {
    setCreateOpen(false);
    setNewUser(EMPTY_NEW);
    setNewTouched(false);
    if (wantsNew) router.replace("/admin/users");
  };

  const handleCreateUser = async () => {
    setNewTouched(true);
    if (Object.keys(newErrors).length > 0) return;
    setSaving(true);
    try {
      await adminFetch(
        "/api/admin/users",
        { method: "POST", json: { ...newUser, name: newUser.name.trim(), email: newUser.email.trim() } },
        "Failed to create user"
      );
      toast.success(newUser.role === "admin" ? "Admin created" : "User created");
      closeCreate();
      fetchUsers();
    } catch (err) {
      toast.error(errorMessage(err, "Failed to create user"));
    } finally {
      setSaving(false);
    }
  };

  // ---- Edit
  const editErrors: Record<string, string> = edit ? validateCommon(edit) : {};
  if (edit && edit.phone.trim().length > 50) editErrors.phone = "At most 50 characters";
  const editingSelf = !!edit && edit.id === me?.id;
  const editOriginal = edit ? users.find((u) => u.id === edit.id) : undefined;
  const lastAdmin = (u: { id: number; role: string } | undefined) => !!u && u.role === "admin" && adminCount <= 1;

  const openEdit = (u: AdminUser) => {
    setEditTouched(false);
    setEdit({
      id: u.id,
      name: u.name ?? "",
      email: u.email ?? "",
      phone: u.phone ?? "",
      role: u.role,
      verified: !!u.verified,
    });
  };

  const handleSaveUser = async () => {
    if (!edit) return;
    setEditTouched(true);
    if (Object.keys(editErrors).length > 0) return;
    setSaving(true);
    try {
      const payload = {
        name: edit.name.trim(),
        email: edit.email.trim(),
        phone: edit.phone.trim() || null,
        role: edit.role,
        verified: edit.verified,
      };
      await adminFetch(`/api/admin/users/${edit.id}`, { method: "PATCH", json: payload }, "Failed to update user");
      setUsers((prev) => prev.map((u) => (u.id === edit.id ? { ...u, ...payload } : u)));
      toast.success("User updated");
      setEdit(null);
      fetchUsers();
    } catch (err) {
      toast.error(errorMessage(err, "Failed to update user"));
    } finally {
      setSaving(false);
    }
  };

  // ---- Reset password
  const resetError =
    resetPassword.length < 8 ? "At least 8 characters" : resetPassword.length > 128 ? "At most 128 characters" : undefined;

  const openReset = (u: AdminUser) => {
    setResetFor(u);
    setResetPassword(generatePassword());
    setResetTouched(false);
  };

  const closeReset = () => {
    setResetFor(null);
    setResetPassword("");
    setResetTouched(false);
  };

  const copyResetPassword = async () => {
    try {
      await navigator.clipboard.writeText(resetPassword);
      toast.success("Password copied");
    } catch {
      toast.error("Could not copy — select the password and copy it manually");
    }
  };

  const handleResetPassword = async () => {
    if (!resetFor) return;
    setResetTouched(true);
    if (resetError) return;
    setSaving(true);
    try {
      await adminFetch(
        `/api/admin/users/${resetFor.id}/password`,
        { method: "POST", json: { password: resetPassword } },
        "Failed to reset password"
      );
      toast.success(`Password reset for ${resetFor.name || resetFor.email}`);
      closeReset();
    } catch (err) {
      toast.error(errorMessage(err, "Failed to reset password"));
    } finally {
      setSaving(false);
    }
  };

  // ---- Role toggle
  const toggleRole = async (u: AdminUser) => {
    const promote = u.role !== "admin";
    const ok = await confirm({
      title: promote ? `Make ${u.name || u.email} an admin?` : `Remove admin access from ${u.name || u.email}?`,
      message: promote
        ? "Admins can manage every user, listing, payment and page on the site."
        : "They keep their account but lose access to the admin panel.",
      confirmLabel: promote ? "Make admin" : "Remove admin",
      destructive: !promote,
    });
    if (!ok) return;
    setBusyId(u.id);
    try {
      const role = promote ? "admin" : "user";
      await adminFetch(`/api/admin/users/${u.id}`, { method: "PATCH", json: { role } }, "Failed to update role");
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role } : x)));
      toast.success(promote ? "Admin access granted" : "Admin access removed");
      fetchUsers();
    } catch (err) {
      toast.error(errorMessage(err, "Failed to update role"));
    } finally {
      setBusyId(null);
    }
  };

  // ---- Delete
  const handleDeleteUser = async (u: AdminUser) => {
    const ok = await confirm({
      title: `Delete ${u.name || u.email}?`,
      message: "This permanently removes the account and everything that belongs to it. This cannot be undone.",
    });
    if (!ok) return;
    setBusyId(u.id);
    try {
      await adminFetch(`/api/admin/users/${u.id}`, { method: "DELETE" }, "Failed to delete user");
      toast.success("User deleted");
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      if (edit?.id === u.id) setEdit(null);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to delete user"));
    } finally {
      setBusyId(null);
    }
  };

  const columns: Column<AdminUser>[] = [
    {
      id: "name",
      header: "User",
      sortValue: (u) => (u.name || u.email).toLowerCase(),
      cell: (u) => (
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            aria-hidden="true"
          >
            {(u.name || u.email || "?").charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate font-semibold text-slate-900 dark:text-white">
              <span className="truncate">{u.name || "Unnamed"}</span>
              {u.id === me?.id && <Badge tone="emerald" dot={false} className="px-1.5 py-0 text-[10px]">You</Badge>}
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      id: "role",
      header: "Role",
      sortValue: (u) => u.role,
      cell: (u) => <StatusBadge kind="role" status={u.role} />,
    },
    {
      id: "verified",
      header: "Verified",
      sortValue: (u) => (u.verified ? 1 : 0),
      cell: (u) =>
        u.verified ? (
          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
            <BadgeCheck className="h-4 w-4" aria-hidden="true" /> Yes
          </span>
        ) : (
          <span className="text-slate-400 dark:text-slate-500">No</span>
        ),
    },
    {
      id: "items",
      header: "Listings",
      align: "right",
      sortValue: (u) => u._count?.items ?? 0,
      cell: (u) => <span className="tabular-nums">{(u._count?.items ?? 0).toLocaleString()}</span>,
    },
    {
      id: "earned",
      header: "Earned",
      align: "right",
      cell: (u) => {
        const entries = earnedEntries(u);
        if (entries.length === 0) return <span className="text-slate-400 dark:text-slate-500">—</span>;
        return (
          <div className="flex flex-col items-end gap-0.5 tabular-nums">
            {entries.map(([cur, amt]) => (
              <span key={cur} className="font-medium text-slate-900 dark:text-white">
                {safeCurrency(Number(amt), cur)}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      id: "createdAt",
      header: "Joined",
      sortValue: (u) => new Date(u.createdAt).getTime(),
      cell: (u) => <span className="whitespace-nowrap text-slate-500 dark:text-slate-400">{formatDate(u.createdAt)}</span>,
    },
  ];

  const rowActions = (u: AdminUser): MenuItem[] => {
    const self = u.id === me?.id;
    const isLastAdmin = lastAdmin(u);
    const busy = busyId === u.id;
    return [
      { label: "Edit", icon: Pencil, onSelect: () => openEdit(u) },
      { label: "Reset password", icon: KeyRound, onSelect: () => openReset(u), disabled: busy },
      u.role === "admin"
        ? {
            label: "Remove admin",
            icon: ShieldOff,
            onSelect: () => toggleRole(u),
            separator: true,
            disabled: self || isLastAdmin || busy,
            hint: self ? "You can't remove your own admin role." : isLastAdmin ? "This is the last admin." : undefined,
          }
        : { label: "Make admin", icon: Shield, onSelect: () => toggleRole(u), separator: true, disabled: busy },
      {
        label: "Delete user",
        icon: Trash2,
        danger: true,
        separator: true,
        onSelect: () => handleDeleteUser(u),
        disabled: self || isLastAdmin || busy,
        hint: self ? "You can't delete your own account here." : isLastAdmin ? "The last admin can't be deleted." : undefined,
      },
    ];
  };

  const roleLocked = editingSelf || lastAdmin(editOriginal);

  return (
    <PageContainer>
      <PageHeader
        title="Users"
        description="Everyone with an account, their role and activity on the platform."
        actions={
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Add user
          </Button>
        }
      />

      <DataTable
        caption="Users"
        rows={rows}
        columns={columns}
        getRowId={(u) => u.id}
        loading={loading}
        error={loadError}
        onRetry={reload}
        search={{
          placeholder: "Search by name, email or phone…",
          match: (u, q) => [u.name, u.email, u.phone].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)),
        }}
        toolbar={
          <FilterTabs<RoleFilter>
            label="Filter by role"
            value={roleFilter}
            onChange={setRoleFilter}
            options={[
              { value: "all", label: "All", count: counts.all },
              { value: "admin", label: "Admins", count: counts.admin },
              { value: "user", label: "Users", count: counts.user },
            ]}
          />
        }
        resetKey={roleFilter}
        initialSort={{ id: "createdAt", dir: "desc" }}
        rowActions={rowActions}
        onRowClick={openEdit}
        rowLabel={(u) => `Edit ${u.name || u.email}`}
        empty={{
          icon: UsersIcon,
          title: roleFilter === "all" ? "No users yet" : `No ${roleFilter === "admin" ? "admins" : "regular users"}`,
          description: roleFilter === "all" ? "Accounts appear here when people sign up." : undefined,
          action:
            roleFilter === "all" ? (
              <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" /> Add user
              </Button>
            ) : undefined,
        }}
      />

      {/* Create */}
      <Dialog
        open={showCreate}
        onClose={closeCreate}
        title="Add user"
        description="Creates an account immediately. Share the password with them securely."
        footer={
          <>
            <Button variant="ghost" onClick={closeCreate} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateUser} loading={saving}>
              {newUser.role === "admin" ? "Create admin" : "Create user"}
            </Button>
          </>
        }
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleCreateUser();
          }}
        >
          <Field label="Name" required error={newTouched ? newErrors.name : undefined}>
            <Input
              value={newUser.name}
              autoComplete="off"
              data-autofocus
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            />
          </Field>
          <Field label="Email" required error={newTouched ? newErrors.email : undefined}>
            <Input
              type="email"
              autoComplete="off"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            />
          </Field>
          <Field
            label="Password"
            required
            hint="At least 8 characters."
            error={newTouched ? newErrors.password : undefined}
          >
            <Input
              type="password"
              autoComplete="new-password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            />
          </Field>
          <Field label="Role" hint={newUser.role === "admin" ? "Admins have full access to this panel." : undefined}>
            <Select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </Select>
          </Field>
          <button type="submit" hidden />
        </form>
      </Dialog>

      {/* Reset password */}
      <Dialog
        open={!!resetFor}
        onClose={closeReset}
        title={resetFor ? `Reset password for ${resetFor.name || resetFor.email}` : "Reset password"}
        description="Sets a new password right away. Share it with the user securely and ask them to change it from their profile."
        footer={
          <>
            <Button variant="ghost" onClick={closeReset} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleResetPassword} loading={saving}>
              Reset password
            </Button>
          </>
        }
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleResetPassword();
          }}
        >
          <Field
            label="New password"
            required
            hint="A strong password is generated for you. You can also type your own (at least 8 characters)."
            error={resetTouched ? resetError : undefined}
          >
            <Input
              type="text"
              autoComplete="off"
              spellCheck={false}
              className="font-mono"
              data-autofocus
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => setResetPassword(generatePassword())}>
              <RefreshCw className="h-4 w-4" /> Generate new
            </Button>
            <Button type="button" variant="secondary" onClick={copyResetPassword} disabled={!resetPassword}>
              <Copy className="h-4 w-4" /> Copy
            </Button>
          </div>
          <button type="submit" hidden />
        </form>
      </Dialog>

      {/* Edit */}
      <Drawer
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit ? `Edit ${edit.name || edit.email}` : "Edit user"}
        description={editOriginal ? `Member since ${formatDate(editOriginal.createdAt)}` : undefined}
        headerExtra={
          editOriginal && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <StatusBadge kind="role" status={editOriginal.role} />
              <span>{editOriginal._count?.items ?? 0} listings</span>
              {earnedEntries(editOriginal).map(([cur, amt]) => (
                <span key={cur}>· earned {safeCurrency(Number(amt), cur)}</span>
              ))}
            </div>
          )
        }
        footer={
          edit && (
            <>
              {editOriginal && !editingSelf && !lastAdmin(editOriginal) && (
                <Button variant="dangerSoft" className="mr-auto" onClick={() => handleDeleteUser(editOriginal)}>
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              )}
              <Button variant="ghost" onClick={() => setEdit(null)} disabled={saving}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveUser} loading={saving}>
                Save changes
              </Button>
            </>
          )
        }
      >
        {edit && (
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveUser();
            }}
          >
            <Field label="Name" required error={editTouched ? editErrors.name : undefined}>
              <Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            </Field>
            <Field label="Email" required error={editTouched ? editErrors.email : undefined}>
              <Input type="email" value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} />
            </Field>
            <Field label="Phone" error={editTouched ? editErrors.phone : undefined}>
              <Input type="tel" value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} />
            </Field>
            <Field
              label="Role"
              hint={
                editingSelf
                  ? "You can't change your own role."
                  : lastAdmin(editOriginal)
                    ? "This is the last admin; promote someone else first."
                    : undefined
              }
            >
              <Select value={edit.role} disabled={roleLocked} onChange={(e) => setEdit({ ...edit, role: e.target.value })}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </Select>
            </Field>
            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
              <Switch
                checked={edit.verified}
                onChange={(v) => setEdit({ ...edit, verified: v })}
                label="Email verified"
                description="Unverified accounts may be limited until they confirm their email."
              />
            </div>
            <button type="submit" hidden />
          </form>
        )}
      </Drawer>
    </PageContainer>
  );
}
