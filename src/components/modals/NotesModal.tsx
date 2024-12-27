import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import type { VirtualCard, Note } from '../../types';

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: VirtualCard;
}

export function NotesModal({ isOpen, onClose, card }: NotesModalProps) {
  const [newNote, setNewNote] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    const note: Note = {
      id: Date.now().toString(),
      cardId: card.id,
      content: newNote,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setNotes([note, ...notes]);
    setNewNote('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Notes">
      <div className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={3}
            placeholder="Add a note..."
          />
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Add Note
            </button>
          </div>
        </form>
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm text-gray-700">{note.content}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(note.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}