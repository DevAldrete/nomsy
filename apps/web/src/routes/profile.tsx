import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { RequireAuth } from "../components/RequireAuth";
import { useProfile } from "../features/profile/hooks/useProfile";

export const Route = createFileRoute("/profile")({
  component: () => (
    <RequireAuth>
      <ProfilePage />
    </RequireAuth>
  ),
});

type Tab = "overview" | "drafts" | "favorites" | "settings";

function ProfilePage() {
  const { profile, loading, error, updateProfile } = useProfile();
  const [tab, setTab] = useState<Tab>("overview");
  const [form, setForm] = useState({
    displayName: "",
    avatar: "",
    bio: "",
    username: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        displayName: profile.displayName ?? "",
        avatar: profile.avatar ?? "",
        bio: profile.bio ?? "",
        username: profile.username ?? "",
      });
    }
  }, [profile]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!profile) return <div className="p-8 text-center">Please log in</div>;

  const handleSave = async () => {
    await updateProfile(form);
  };

  return (
    <div className="mx-auto max-w-4xl p-4">
      <div className="mb-8 flex items-center gap-4">
        <img
          src={profile.avatar}
          alt={profile.displayName}
          className="h-20 w-20 rounded-full"
        />
        <div>
          <h1 className="text-2xl font-bold">{profile.displayName}</h1>
          {profile.username && (
            <p className="text-gray-500">@{profile.username}</p>
          )}
        </div>
      </div>

      <div className="mb-4 flex gap-4 border-b">
        {(["overview", "drafts", "favorites", "settings"] as Tab[]).map(
          (t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2 ${tab === t ? "border-b-2 border-blue-500 font-medium" : ""}`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ),
        )}
      </div>

      {tab === "overview" && (
        <p className="text-gray-500">
          Your recipes and activity. Use Settings to edit your profile.
        </p>
      )}

      {tab === "drafts" && (
        <p className="text-gray-500">Draft recipes will appear here.</p>
      )}

      {tab === "favorites" && (
        <p className="text-gray-500">Your favorite recipes will appear here.</p>
      )}

      {tab === "settings" && (
        <div className="space-y-4">
          <input
            placeholder="Display Name"
            value={form.displayName}
            onChange={(e) =>
              setForm({ ...form, displayName: e.target.value })
            }
            className="w-full border p-2"
          />
          <input
            placeholder="Avatar URL"
            value={form.avatar}
            onChange={(e) => setForm({ ...form, avatar: e.target.value })}
            className="w-full border p-2"
          />
          <textarea
            placeholder="Bio"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className="w-full border p-2"
          />
          <input
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="w-full border p-2"
          />
          <button
            type="button"
            onClick={handleSave}
            className="rounded bg-blue-500 px-4 py-2 text-white"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}
