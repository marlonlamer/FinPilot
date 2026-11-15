import { useState } from "react";
import { Check, Mail, Pencil, UserRound, X } from "lucide-react";
import { api, getCurrentUser, setCurrentUser } from "../../services/api";
import "../../pages/Profile/ProfileModule.css";

const getInitials = (user) => {
  const name = String(user?.name || "").trim();
  if (name) {
    return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  }
  const emailName = String(user?.email || "").split("@")[0];
  return emailName ? emailName.slice(0, 2).toUpperCase() : "?";
};

export default function ProfilePage() {
  const [profile, setProfile] = useState(() => getCurrentUser() || {});
  const [name, setName] = useState(profile.name || "");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const startEditing = () => {
    setName(profile.name || "");
    setError("");
    setSuccess("");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setName(profile.name || "");
    setError("");
    setIsEditing(false);
  };

  const save = async (event) => {
    event.preventDefault();
    const trimmedName = String(name).trim();
    setError("");
    setSuccess("");
    if (!trimmedName) {
      setError("Display name is required.");
      return;
    }

    setSaving(true);
    try {
      const response = await api.put("/user/profile", { name: trimmedName });
      const updatedProfile = { ...profile, ...response, name: response.name || trimmedName };
      setCurrentUser(updatedProfile);
      setProfile(updatedProfile);
      setName(updatedProfile.name);
      setIsEditing(false);
      setSuccess("Profile updated successfully.");
    } catch (saveError) {
      setError(saveError?.response?.data?.error || saveError?.message || "Unable to update your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const displayName = profile.name || "Name not provided";
  const email = profile.email || "Email unavailable";

  return (
    <main className="profile-page">
      <header className="profile-page-header">
        <div>
          <h1>My Profile</h1>
          <p>Manage your personal information and account details.</p>
        </div>
      </header>

      <section className="profile-overview" aria-label="Profile overview">
        <div className="profile-avatar" aria-hidden="true">
          <span>{getInitials(profile)}</span>
        </div>
        <div className="profile-overview-copy">
          <span className="profile-section-eyebrow">Personal account</span>
          <h2>{displayName}</h2>
          <p><Mail size={15} aria-hidden="true" />{email}</p>
        </div>
        {!isEditing ? (
          <button type="button" className="profile-button profile-button--secondary profile-overview-action" onClick={startEditing}>
            <Pencil size={15} aria-hidden="true" />
            Edit Profile
          </button>
        ) : null}
      </section>

      <div className="profile-content-grid">
        <section className="profile-card profile-personal-card" aria-labelledby="profile-personal-title">
          <div className="profile-card-header">
            <div>
              <h2 id="profile-personal-title">Personal Information</h2>
              <p>Update the name associated with your account.</p>
            </div>
            <span className="profile-card-icon" aria-hidden="true"><UserRound size={18} /></span>
          </div>

          <form onSubmit={save} className="profile-form">
            <label className="profile-field" htmlFor="profile-display-name">
              <span>Display Name</span>
              <input
                id="profile-display-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                readOnly={!isEditing}
                autoComplete="name"
                maxLength={100}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "profile-form-error" : undefined}
              />
            </label>

            <label className="profile-field" htmlFor="profile-email">
              <span>Email Address</span>
              <input
                id="profile-email"
                type="email"
                value={profile.email || ""}
                readOnly
                aria-readonly="true"
                placeholder="Email unavailable"
              />
              <small>Email address changes are not supported here.</small>
            </label>

            {error ? <p className="profile-feedback profile-feedback--error" id="profile-form-error" role="alert">{error}</p> : null}
            {success ? <p className="profile-feedback profile-feedback--success" role="status">{success}</p> : null}

            {isEditing ? (
              <div className="profile-form-actions">
                <button type="button" className="profile-button profile-button--secondary" onClick={cancelEditing} disabled={saving}>
                  <X size={16} aria-hidden="true" />
                  Cancel
                </button>
                <button type="submit" className="profile-button profile-button--primary" disabled={saving}>
                  <Check size={16} aria-hidden="true" />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            ) : null}
          </form>
        </section>

        <aside className="profile-card profile-account-card" aria-labelledby="profile-account-title">
          <div className="profile-card-header">
            <div>
              <h2 id="profile-account-title">Account Information</h2>
              <p>Details available for your account.</p>
            </div>
          </div>
          <dl className="profile-account-list">
            <div>
              <dt>Account ID</dt>
              <dd>{profile.id != null ? profile.id : "Unavailable"}</dd>
            </div>
          </dl>
          <p className="profile-account-note">
            Account status and creation date aren’t provided by the available profile data.
          </p>
        </aside>
      </div>
    </main>
  );
}
