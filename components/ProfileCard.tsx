'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/auth'

export default function ProfileCard() {
  const { user, displayName, signOut, deleteAccount, updateDisplayName } = useAuth()
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(displayName)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function saveName() {
    setSaving(true)
    await updateDisplayName(nameInput.trim())
    setSaving(false)
    setEditingName(false)
  }

  async function handleDelete() {
    setDeleting(true)
    await deleteAccount()
  }

  return (
    <div className="t-card rounded-2xl p-4">
      <p className="font-semibold text-sm t-text mb-0.5">Profile</p>
      <p className="text-xs t-muted mb-4">{user?.email}</p>

      {/* Display name */}
      <div className="mb-4">
        <label className="text-xs t-muted uppercase tracking-wider">Display name</label>
        {!editingName ? (
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm font-medium t-text">{displayName || 'Not set'}</span>
            <button
              onClick={() => { setNameInput(displayName); setEditingName(true) }}
              className="text-xs t-accent"
            >Edit</button>
          </div>
        ) : (
          <div className="flex items-center gap-2 mt-1">
            <input
              autoFocus
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="flex-1 t-input rounded-xl px-3 py-2 text-sm"
              placeholder="Your name"
            />
            <button onClick={saveName} disabled={saving} className="btn-confirm rounded-xl px-3 py-2 text-xs font-semibold">
              {saving ? '...' : 'Save'}
            </button>
            <button onClick={() => setEditingName(false)} className="btn-secondary rounded-xl px-3 py-2 text-xs">
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Sign out */}
      <button
        onClick={signOut}
        className="w-full btn-secondary rounded-xl py-2.5 text-sm font-medium mb-2"
      >
        Sign Out
      </button>

      {/* Delete account */}
      {!confirmDelete ? (
        <button
          onClick={() => setConfirmDelete(true)}
          className="w-full rounded-xl py-2.5 text-sm font-medium"
          style={{ border: '1px solid rgba(239,68,68,0.3)', color: 'var(--red)' }}
        >
          Delete Account
        </button>
      ) : (
        <div className="rounded-xl p-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <p className="text-xs mb-3" style={{ color: 'var(--red)' }}>
            This permanently deletes your account and all logged meals, history, and reports. This cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 rounded-xl py-2 text-xs font-bold text-white disabled:opacity-60"
              style={{ background: 'var(--red)' }}
            >
              {deleting ? 'Deleting...' : 'Yes, delete everything'}
            </button>
            <button onClick={() => setConfirmDelete(false)} className="btn-secondary rounded-xl px-3 py-2 text-xs">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
