import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { authApi } from '../api/auth.api';
import { toast } from '../stores/toast.store';
import { formatDate } from '../utils/format';
import { ShieldAlert, Mail } from 'lucide-react';

export default function ProfilePage() {
  const { user, logout, updateProfile } = useAuthStore();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const navigate = useNavigate();

  const handleEditClick = () => {
    setFirstName(user?.firstName || '');
    setLastName(user?.lastName || '');
    setIsEditing(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('First name and last name are required');
      return;
    }
    setSaving(true);
    try {
      // Dispatch API and update local store context
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim()
      });
      toast.success('Your profile details were updated!');
      setIsEditing(false);
    } catch (err) {
      toast.error(err.message || 'Profile save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await authApi.deleteProfile();
      toast.success('Your profile has been deleted');
      logout();
      navigate('/login');
    } catch (err) {
      toast.error(err.message || 'Failed to delete account');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-3xl mx-auto w-full font-sans">
      
      {/* Profile Header Panel */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-premium flex flex-col sm:flex-row items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-secondary-50 text-secondary-650 flex items-center justify-center font-bold text-2xl uppercase border border-secondary-100 shadow-inner">
          {user.firstName?.charAt(0) || 'U'}
        </div>
        <div className="text-center sm:text-left">
          <h1 className="text-xl font-extrabold text-primary-950">
            {user.firstName} {user.lastName}
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1 flex items-center gap-1">
            <Mail className="w-3.5 h-3.5" />
            {user.email}
          </p>
        </div>

        <div className="sm:ml-auto flex items-center gap-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Joined:</span>
          <span className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-100 px-3 py-1 rounded-full">
            {formatDate(user.createdAt)}
          </span>
        </div>
      </div>

      {/* Main Form Information Card */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-premium">
        <div className="flex justify-between items-center border-b border-slate-50 pb-4 mb-6">
          <div>
            <h2 className="text-sm font-extrabold text-primary-950 uppercase tracking-wide">Personal Details</h2>
            <p className="text-xs text-slate-400">View or modify your profile specifications</p>
          </div>
          {!isEditing && (
            <button
              onClick={handleEditClick}
              className="px-4 py-2 text-xs font-bold border border-slate-200 hover:border-slate-350 text-slate-650 rounded-xl transition-all shadow-sm bg-white cursor-pointer"
            >
              Edit Details
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold tracking-wider text-slate-500 uppercase mb-1.5 pl-0.5">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:border-secondary-500 focus:ring-1 focus:ring-secondary-500 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold tracking-wider text-slate-500 uppercase mb-1.5 pl-0.5">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:border-secondary-500 focus:ring-1 focus:ring-secondary-500 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold tracking-wider text-slate-400 uppercase mb-1.5 pl-0.5">
                Email Address (Locked)
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-4 py-2.5 rounded-xl border border-slate-100 text-sm text-slate-450 bg-slate-50 cursor-not-allowed outline-none"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-50 mt-6">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-secondary-600 hover:bg-secondary-700 text-white font-bold transition-all text-xs shadow-md cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFirstName(user.firstName || '');
                  setLastName(user.lastName || '');
                  setIsEditing(false);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-550 transition-all text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-semibold text-slate-550">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">First Name</p>
              <p className="text-sm font-bold text-slate-800">{user.firstName || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Last Name</p>
              <p className="text-sm font-bold text-slate-800">{user.lastName || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Identity Role</p>
              <span className="text-[10px] font-bold text-secondary-650 bg-secondary-50 border border-secondary-100 px-2.5 py-0.5 rounded-md uppercase inline-block mt-0.5">
                {user.role || 'USER'}
              </span>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Email Status</p>
              <p className="text-sm font-bold text-slate-800">Verified Credentials</p>
            </div>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50/40 border border-red-200 rounded-3xl p-6 shadow-premium">
        <h3 className="text-sm font-extrabold text-red-950 flex items-center gap-1.5 uppercase tracking-wide mb-2">
          <ShieldAlert className="w-4.5 h-4.5 text-red-650" />
          Danger Zone
        </h3>
        <p className="text-xs text-red-700 leading-relaxed mb-4">
          Permanently delete your profile account records. This action immediately cancels any active seat reservation holds and is irreversible.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md text-xs transition-colors cursor-pointer"
        >
          Delete Profile Account
        </button>
      </div>

      {/* Delete Confirmation Modal Dialog */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-slide-in">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 w-full max-w-md shadow-premium-lg relative">
            <h3 className="text-lg font-bold text-red-950 mb-2">Delete Account permanently?</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Are you sure you want to delete your profile? All profile settings and active transactions will be permanently purged. This action is irreversible.
            </p>
            
            <div className="flex gap-3 justify-end mt-6">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-550 transition-all text-xs font-semibold cursor-pointer"
              >
                No, Keep Profile
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl bg-red-650 hover:bg-red-750 text-white font-bold transition-all text-xs shadow-md cursor-pointer"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
