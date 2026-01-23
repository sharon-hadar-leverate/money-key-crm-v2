'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Lead } from '@/types/leads'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { toast } from 'sonner'

export function useLeadsRealtime(initialLeads: Lead[]) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const supabase = createClient()

  const handleChange = useCallback(
    (payload: RealtimePostgresChangesPayload<Lead>) => {
      if (payload.eventType === 'INSERT') {
        const newLead = payload.new as Lead
        // Only add if not soft-deleted
        if (!newLead.deleted_at) {
          setLeads((current) => [newLead, ...current])
          toast.info(`ליד חדש: ${newLead.name}`)
        }
      } else if (payload.eventType === 'UPDATE') {
        const updatedLead = payload.new as Lead
        setLeads((current) =>
          current
            .map((lead) => (lead.id === updatedLead.id ? updatedLead : lead))
            .filter((lead) => !lead.deleted_at)
        )
      } else if (payload.eventType === 'DELETE') {
        const deletedId = (payload.old as Lead).id
        setLeads((current) => current.filter((lead) => lead.id !== deletedId))
      }
    },
    []
  )

  useEffect(() => {
    const channel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
        },
        handleChange
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, handleChange])

  // Sync with prop changes
  useEffect(() => {
    setLeads(initialLeads)
  }, [initialLeads])

  return leads
}

// Hook for single lead updates
export function useLeadRealtime(leadId: string, initialLead: Lead) {
  const [lead, setLead] = useState<Lead>(initialLead)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`lead-${leadId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leads',
          filter: `id=eq.${leadId}`,
        },
        (payload) => {
          setLead(payload.new as Lead)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, leadId])

  useEffect(() => {
    setLead(initialLead)
  }, [initialLead])

  return lead
}
