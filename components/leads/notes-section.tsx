'use client'

import { useState, useEffect, useCallback } from 'react'
import { MessageSquare, Plus, Pencil, Trash2, Check, User } from 'lucide-react'
import { RelativeTime } from '@/components/relative-time'
import { createNote, getNotes, updateNote, deleteNote, type NoteWithUser } from '@/actions/notes'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface NotesSectionProps {
  leadId: string
  initialNotes?: NoteWithUser[]
  isEmbedded?: boolean
}

export function NotesSection({ leadId, initialNotes = [], isEmbedded = false }: NotesSectionProps) {
  const [notes, setNotes] = useState<NoteWithUser[]>(initialNotes)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newContent, setNewContent] = useState('')
  const [editContent, setEditContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load notes callback
  const loadNotes = useCallback(async () => {
    const data = await getNotes(leadId)
    setNotes(data)
  }, [leadId])

  // Load notes if not provided initially
  useEffect(() => {
    if (initialNotes.length === 0) {
      loadNotes()
    }
  }, [initialNotes.length, loadNotes])

  async function handleAddNote() {
    if (!newContent.trim()) return

    setIsSubmitting(true)
    const result = await createNote(leadId, newContent)

    if (result.success && result.data) {
      setNotes([result.data, ...notes])
      setNewContent('')
      setIsAdding(false)
      toast.success('ההערה נוספה בהצלחה')
    } else {
      toast.error(result.error || 'שגיאה בהוספת ההערה')
    }
    setIsSubmitting(false)
  }

  async function handleUpdateNote(noteId: string) {
    if (!editContent.trim()) return

    setIsSubmitting(true)
    const result = await updateNote(noteId, editContent)

    if (result.success && result.data) {
      setNotes(notes.map(n => n.id === noteId ? result.data! : n))
      setEditingId(null)
      setEditContent('')
      toast.success('ההערה עודכנה בהצלחה')
    } else {
      toast.error(result.error || 'שגיאה בעדכון ההערה')
    }
    setIsSubmitting(false)
  }

  async function handleDeleteNote(noteId: string) {
    if (!confirm('האם אתה בטוח שברצונך למחוק את ההערה?')) return

    const result = await deleteNote(noteId)

    if (result.success) {
      setNotes(notes.filter(n => n.id !== noteId))
      toast.success('ההערה נמחקה בהצלחה')
    } else {
      toast.error(result.error || 'שגיאה במחיקת ההערה')
    }
  }

  function startEdit(note: NoteWithUser) {
    setEditingId(note.id)
    setEditContent(note.content)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditContent('')
  }

  function cancelAdd() {
    setIsAdding(false)
    setNewContent('')
  }

  return (
    <div className={cn("monday-card overflow-hidden", isEmbedded && "border-none shadow-none rounded-none")}>
      {/* Header */}
      {!isEmbedded && (
        <div className="px-5 py-4 border-b border-[#E6E9EF] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#FDEBDC]">
              <MessageSquare className="h-4 w-4 text-[#E07239]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#323338]">הערות</h3>
              <p className="text-xs text-[#9B9BAD]">{notes.length} הערות</p>
            </div>
          </div>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00A0B0] text-white text-sm hover:bg-[#008A99] transition-colors"
            >
              <Plus className="h-4 w-4" />
              הוסף הערה
            </button>
          )}
        </div>
      )}

      {/* Content */}
      <div className={cn("p-5 space-y-4", isEmbedded && "p-3")}>
        {/* Add note button for embedded mode */}
        {isEmbedded && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-[#E6E9EF] text-[#676879] text-sm hover:bg-[#F5F6F8] hover:border-[#00A0B0] hover:text-[#00A0B0] transition-all"
          >
            <Plus className="h-4 w-4" />
            הוסף הערה חדשה
          </button>
        )}
        {/* Add note form */}
        {isAdding && (
          <div className="p-4 rounded-lg bg-[#F5F6F8] border border-[#E6E9EF]">
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="כתוב את ההערה שלך..."
              className="w-full h-24 p-3 rounded-lg bg-white border border-[#E6E9EF] text-[#323338] resize-none focus:outline-none focus:border-[#00A0B0] focus:ring-2 focus:ring-[#00A0B0]/20 transition-all"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={cancelAdd}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg text-sm text-[#676879] hover:bg-[#E6E9EF] transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={handleAddNote}
                disabled={isSubmitting || !newContent.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm bg-[#00A0B0] text-white hover:bg-[#008A99] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Check className="h-4 w-4" />
                {isSubmitting ? 'שומר...' : 'שמור'}
              </button>
            </div>
          </div>
        )}

        {/* Notes list */}
        {notes.length === 0 && !isAdding ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-[#F5F6F8] flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-6 h-6 text-[#9B9BAD]" />
            </div>
            <p className="text-[#676879]">אין הערות עדיין</p>
            <p className="text-sm text-[#9B9BAD] mt-1">לחץ על &quot;הוסף הערה&quot; כדי להוסיף את ההערה הראשונה</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className={cn(
                  "p-4 rounded-lg border transition-all",
                  editingId === note.id
                    ? "bg-[#F5F6F8] border-[#00A0B0]"
                    : "bg-white border-[#E6E9EF] hover:border-[#00A0B0]/30"
                )}
              >
                {editingId === note.id ? (
                  // Edit mode
                  <>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full h-24 p-3 rounded-lg bg-white border border-[#E6E9EF] text-[#323338] resize-none focus:outline-none focus:border-[#00A0B0] focus:ring-2 focus:ring-[#00A0B0]/20 transition-all"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2 mt-3">
                      <button
                        onClick={cancelEdit}
                        disabled={isSubmitting}
                        className="px-3 py-1.5 rounded-lg text-sm text-[#676879] hover:bg-[#E6E9EF] transition-colors"
                      >
                        ביטול
                      </button>
                      <button
                        onClick={() => handleUpdateNote(note.id)}
                        disabled={isSubmitting || !editContent.trim()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-[#00A0B0] text-white hover:bg-[#008A99] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Check className="h-3.5 w-3.5" />
                        {isSubmitting ? 'שומר...' : 'שמור'}
                      </button>
                    </div>
                  </>
                ) : (
                  // View mode
                  <>
                    {/* Note header with user info */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#00A0B0] flex items-center justify-center">
                          <span className="text-xs font-medium text-white">
                            {note.user_display_name?.charAt(0) || <User className="h-3 w-3" />}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-[#323338]">
                            {note.user_display_name}
                          </span>
                          <RelativeTime date={note.created_at} className="text-xs text-[#9B9BAD] mr-2" />
                        </div>
                      </div>
                      {/* Actions - only show for own notes */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(note)}
                          className="p-1.5 rounded-md hover:bg-[#F5F6F8] text-[#676879] hover:text-[#323338] transition-colors"
                          title="ערוך"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1.5 rounded-md hover:bg-[#FFD6D9]/30 text-[#676879] hover:text-[#D83A52] transition-colors"
                          title="מחק"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    {/* Note content */}
                    <p className="text-sm text-[#323338] whitespace-pre-wrap leading-relaxed">
                      {note.content}
                    </p>
                    {/* Show if edited */}
                    {note.updated_at && note.updated_at !== note.created_at && (
                      <p className="text-xs text-[#9B9BAD] mt-2">
                        נערך <RelativeTime date={note.updated_at} />
                      </p>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
