'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { TaskCard } from './task-card'
import { CheckSquare, Loader2 } from 'lucide-react'
import type { Task } from '@/types/tasks'

interface TaskListProps {
  tasks: Task[]
  title?: string
  emptyMessage?: string
}

export function TaskList({
  tasks,
  title = 'משימות',
  emptyMessage = 'אין משימות',
}: TaskListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleTaskComplete = () => {
    startTransition(() => {
      router.refresh()
    })
  }

  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress')
  const completedTasks = tasks.filter(t => t.status === 'completed')

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckSquare className="h-12 w-12 mx-auto mb-3 text-[#9B9BAD] opacity-50" />
        <p className="text-[#9B9BAD]">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[#323338] flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-[#676879]" />
          {title} ({pendingTasks.length})
          {isPending && <Loader2 className="h-4 w-4 animate-spin text-[#00A0B0]" />}
        </h3>
      </div>

      {/* Pending Tasks */}
      <div className="space-y-2">
        {pendingTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onComplete={handleTaskComplete}
          />
        ))}
      </div>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm text-[#9B9BAD] mb-2">
            הושלמו ({completedTasks.length})
          </h4>
          <div className="space-y-2">
            {completedTasks.slice(0, 5).map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={handleTaskComplete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
