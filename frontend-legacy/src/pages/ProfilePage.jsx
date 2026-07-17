import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { authApi } from '../api/auth.api';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import { formatDate } from '../utils/format';

export default function ProfilePage() {
  const { user, setUser, logout } = useAuthStore();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const showToast = useToast();
  const navigate = useNavigate();

  // Keep local fields in sync when store user loads
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      showToast('First name and last name cannot be empty', 'warning');
      return;
    }
    setSaving(true);
    try {
      const res = await authApi.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      const updatedUser = res.data?.user || res.data || res;
      // Merge with existing user context to preserve role/email
      setUser({ ...user, ...updatedUser });
      showToast('Profile updated successfully!', 'success');
      setIsEditing(false);
    } catch (err) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await authApi.deleteProfile();
      showToast('Your account has been deleted successfully.', 'success');
      logout();
      navigate('/login');
    } catch (err) {
      showToast(err.message || 'Failed to delete account', 'error');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>

      <div className="card mb-6">
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
            <p className="text-sm text-gray-500">Manage your profile details and preferences</p>
          </div>
          {!isEditing && (
            <Button variant="secondary" onClick={() => setIsEditing(true)}>
              Edit Info
            </Button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <Input
                label="Last Name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Email (Read Only)</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="input-field bg-gray-100 cursor-not-allowed text-gray-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={saving}>
                Save Changes
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setFirstName(user.firstName || '');
                  setLastName(user.lastName || '');
                  setIsEditing(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-y-4 text-sm">
              <div>
                <p className="text-gray-500 font-medium">First Name</p>
                <p className="text-gray-900 text-base">{user.firstName || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500 font-medium">Last Name</p>
                <p className="text-gray-900 text-base">{user.lastName || '—'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500 font-medium">Email Address</p>
                <p className="text-gray-900 text-base">{user.email}</p>
              </div>
              <div>
                <p className="text-gray-500 font-medium">Account Role</p>
                <p className="text-gray-900 text-base font-mono text-xs uppercase bg-gray-100 rounded px-1.5 py-0.5 inline-block border mt-1">
                  {user.role || 'USER'}
                </p>
              </div>
              <div>
                <p className="text-gray-500 font-medium">Joined Date</p>
                <p className="text-gray-900 text-base">{formatDate(user.createdAt)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card border-red-200 bg-red-50/50">
        <h3 className="text-lg font-semibold text-red-900 mb-2">Danger Zone</h3>
        <p className="text-sm text-red-700 mb-4">
          Permanently delete your profile and cancel any held active seat bookings. This action cannot be undone.
        </p>
        <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
          Delete Account
        </Button>
      </div>

      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Your Account?"
        confirmText="Yes, Delete Permanently"
        onConfirm={handleDeleteAccount}
        loading={deleting}
        danger
      >
        Are you sure you want to delete your profile? All profile settings and active transactions will be permanently purged. This action is irreversible.
      </Modal>
    </div>
  );
}
