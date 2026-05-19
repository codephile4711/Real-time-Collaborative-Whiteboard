import React, { useState } from 'react';
import { useUIStore } from '../store/uiStore.js';
import { User, Edit2, Check } from 'lucide-react';

export default function PresenceBar({ states }) {
  const { user, setUser } = useUIStore();
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState(user.name);

  // Group collaborators from awareness state map
  const collaborators = [];
  states.forEach((state, clientID) => {
    if (state.user) {
      collaborators.push({
        clientID,
        name: state.user.name,
        color: state.user.color,
        id: state.user.id,
      });
    }
  });

  const handleSave = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setUser({ ...user, name: newName });
    setEditing(false);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="fixed right-4 top-4 flex flex-col items-end gap-2 z-40">
      <div className="flex items-center gap-3 bg-white border border-gray-200/80 rounded-xl shadow-lg px-4 py-2">
        {/* Avatars Row */}
        <div className="flex -space-x-1.5 overflow-hidden">
          {collaborators.map((collab) => {
            const isSelf = collab.id === user.id;
            return (
              <div
                key={collab.clientID}
                title={collab.name + (isSelf ? ' (You)' : '')}
                className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white select-none transition-transform hover:scale-105"
                style={{ backgroundColor: collab.color || '#3B82F6' }}
              >
                {getInitials(collab.name)}
              </div>
            );
          })}
        </div>

        {/* Separator */}
        <div className="w-[1px] h-5 bg-gray-200" />

        {/* Visitor Config Trigger */}
        {!editing ? (
          <button
            onClick={() => {
              setNewName(user.name);
              setEditing(true);
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit Profile
          </button>
        ) : (
          <form onSubmit={handleSave} className="flex items-center gap-1.5">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="text-xs px-2 py-1 border border-gray-200 rounded max-w-[120px] focus:outline-none focus:border-blue-500"
              placeholder="Your Name"
              maxLength={20}
              autoFocus
            />
            <button
              type="submit"
              className="p-1 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
