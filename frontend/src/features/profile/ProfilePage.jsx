import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, LogOut, Mail, Pencil, Trash2, UserRound, X } from "lucide-react";
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

export default function ProfilePage({ logout }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(() => getCurrentUser() || {});
  const [name, setName] = useState(profile.name || "");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState("");
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

  const handleLogout = () => {
    if (loggingOut || typeof logout !== "function") return;
    setLoggingOut(true);
    logout();
    navigate("/login", { replace: true });
  };

  const openDeleteModal = () => {
    setDeletePassword("");
    setDeleteError("");
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (deletingAccount) return;
    setDeleteModalOpen(false);
    setDeletePassword("");
    setDeleteError("");
  };

  const handleDeleteAccount = async (event) => {
    event.preventDefault();
    if (deletingAccount || !deletePassword || typeof logout !== "function") return;

    setDeletingAccount(true);
    setDeleteError("");
    try {
      await api.delete("/user/account", { data: { password: deletePassword } });
      logout();
      navigate("/login", { replace: true });
    } catch (deleteAccountError) {
      setDeleteError(
        deleteAccountError?.response?.data?.error ||
        deleteAccountError?.message ||
        "Unable to delete your account. Please try again."
      );
    } finally {
      setDeletePassword("");
      setDeletingAccount(false);
    }
  };

  const handleDeleteBackdropMouseDown = (event) => {
    if (event.target === event.currentTarget) closeDeleteModal();
  };

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

      <section className="profile-card profile-actions-card" aria-labelledby="profile-actions-title">
        <div className="profile-card-header">
          <div>
            <h2 id="profile-actions-title">Account Actions</h2>
            <p>Manage your current session and account.</p>
          </div>
        </div>
        <div className="profile-actions-list">
          <div className="profile-action-row">
            <span className="profile-action-icon profile-action-icon--neutral" aria-hidden="true">
              <LogOut size={18} />
            </span>
            <span className="profile-action-copy">
              <strong>Log Out</strong>
              <small>End your current session on this device.</small>
            </span>
            <button
              type="button"
              className="profile-button profile-button--secondary"
              onClick={handleLogout}
              disabled={loggingOut || typeof logout !== "function"}
            >
              <LogOut size={15} aria-hidden="true" />
              {loggingOut ? "Logging out..." : "Log Out"}
            </button>
          </div>
          <div className="profile-action-row profile-action-row--danger">
            <span className="profile-action-icon profile-action-icon--danger" aria-hidden="true">
              <Trash2 size={18} />
            </span>
            <span className="profile-action-copy">
              <strong>Delete Account</strong>
              <small>Permanently delete your account and associated financial records.</small>
            </span>
            <button
              type="button"
              className="profile-button profile-button--danger"
              onClick={openDeleteModal}
              disabled={deletingAccount || typeof logout !== "function"}
            >
              <Trash2 size={15} aria-hidden="true" />
              Delete Account
            </button>
          </div>
        </div>
      </section>

      {deleteModalOpen ? (
        <div className="profile-delete-backdrop" onMouseDown={handleDeleteBackdropMouseDown}>
          <section
            className="profile-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-delete-title"
            aria-describedby="profile-delete-description"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="profile-delete-heading">
              <span className="profile-action-icon profile-action-icon--danger" aria-hidden="true">
                <Trash2 size={18} />
              </span>
              <div>
                <h2 id="profile-delete-title">Delete your account?</h2>
                <p id="profile-delete-description">
                  This permanently deletes your account and its associated financial records. This action cannot be undone.
                </p>
              </div>
            </div>
            <form onSubmit={handleDeleteAccount} className="profile-delete-form">
              <label className="profile-field" htmlFor="profile-delete-password">
                <span>Current Password</span>
                <input
                  id="profile-delete-password"
                  type="password"
                  value={deletePassword}
                  onChange={(event) => setDeletePassword(event.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={deletingAccount}
                  aria-invalid={Boolean(deleteError)}
                  aria-describedby={deleteError ? "profile-delete-error" : undefined}
                />
              </label>
              {deleteError ? (
                <p className="profile-feedback profile-feedback--error" id="profile-delete-error" role="alert">
                  {deleteError}
                </p>
              ) : null}
              <div className="profile-delete-actions">
                <button
                  type="button"
                  className="profile-button profile-button--secondary"
                  onClick={closeDeleteModal}
                  disabled={deletingAccount}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="profile-button profile-button--danger"
                  disabled={deletingAccount || !deletePassword}
                >
                  <Trash2 size={15} aria-hidden="true" />
                  {deletingAccount ? "Deleting..." : "Delete Account"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  );
}
