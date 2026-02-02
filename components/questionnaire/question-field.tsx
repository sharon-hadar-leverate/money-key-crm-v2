'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Check, ChevronDown } from 'lucide-react'
import type { QuestionnaireField, AnswerValue, FieldConfig } from '@/types/questionnaire'

interface QuestionFieldProps {
  field: QuestionnaireField
  value: AnswerValue
  onChange: (value: AnswerValue) => void
  disabled?: boolean
  error?: string
}

export function QuestionField({ field, value, onChange, disabled, error }: QuestionFieldProps) {
  const config = field.config

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-[#323338]">
        {field.label}
        {field.is_required && <span className="text-[#D83A52]">*</span>}
      </label>

      {config.helperText && (
        <p className="text-xs text-[#9B9BAD]">{config.helperText}</p>
      )}

      <FieldInput
        field={field}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />

      {error && (
        <p className="text-xs text-[#D83A52]">{error}</p>
      )}
    </div>
  )
}

function FieldInput({ field, value, onChange, disabled }: Omit<QuestionFieldProps, 'error'>) {
  switch (field.field_type) {
    case 'text':
      return <TextField field={field} value={value} onChange={onChange} disabled={disabled} />
    case 'number':
      return <NumberField field={field} value={value} onChange={onChange} disabled={disabled} />
    case 'boolean':
      return <BooleanField field={field} value={value} onChange={onChange} disabled={disabled} />
    case 'select':
      return <SelectField field={field} value={value} onChange={onChange} disabled={disabled} />
    case 'multiselect':
      return <MultiselectField field={field} value={value} onChange={onChange} disabled={disabled} />
    case 'scale':
      return <ScaleField field={field} value={value} onChange={onChange} disabled={disabled} />
    case 'date':
      return <DateField field={field} value={value} onChange={onChange} disabled={disabled} />
    default:
      return <TextField field={field} value={value} onChange={onChange} disabled={disabled} />
  }
}

// Text Field
function TextField({ field, value, onChange, disabled }: Omit<QuestionFieldProps, 'error'>) {
  const config = field.config
  const isMultiline = config.multiline

  if (isMultiline) {
    return (
      <textarea
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={config.placeholder}
        rows={3}
        className={cn(
          "w-full px-4 py-3 rounded-lg bg-white border border-[#E6E9EF] text-[#323338] text-sm",
          "focus:outline-none focus:border-[#00A0B0] focus:ring-2 focus:ring-[#00A0B0]/20",
          "disabled:bg-[#F5F6F8] disabled:cursor-not-allowed",
          "resize-none transition-all"
        )}
      />
    )
  }

  return (
    <input
      type="text"
      value={(value as string) ?? ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={config.placeholder}
      className={cn(
        "w-full h-10 px-4 rounded-lg bg-white border border-[#E6E9EF] text-[#323338] text-sm",
        "focus:outline-none focus:border-[#00A0B0] focus:ring-2 focus:ring-[#00A0B0]/20",
        "disabled:bg-[#F5F6F8] disabled:cursor-not-allowed",
        "transition-all"
      )}
    />
  )
}

// Number Field
function NumberField({ field, value, onChange, disabled }: Omit<QuestionFieldProps, 'error'>) {
  const config = field.config

  return (
    <div className="relative">
      {config.prefix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#9B9BAD]">
          {config.prefix}
        </span>
      )}
      <input
        type="number"
        value={value !== null && value !== undefined ? String(value) : ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        disabled={disabled}
        placeholder={config.placeholder}
        min={config.min}
        max={config.max}
        className={cn(
          "w-full h-10 rounded-lg bg-white border border-[#E6E9EF] text-[#323338] text-sm",
          "focus:outline-none focus:border-[#00A0B0] focus:ring-2 focus:ring-[#00A0B0]/20",
          "disabled:bg-[#F5F6F8] disabled:cursor-not-allowed",
          "transition-all",
          config.prefix ? "pr-10 pl-4" : "px-4",
          config.suffix ? "pl-10 pr-4" : ""
        )}
        dir="ltr"
      />
      {config.suffix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#9B9BAD]">
          {config.suffix}
        </span>
      )}
    </div>
  )
}

// Boolean Field (Checkbox or Toggle)
function BooleanField({ field, value, onChange, disabled }: Omit<QuestionFieldProps, 'error'>) {
  const config = field.config
  const isChecked = value === true

  return (
    <button
      type="button"
      onClick={() => onChange(!isChecked)}
      disabled={disabled}
      className={cn(
        "flex items-center gap-3 w-full p-3 rounded-lg border transition-all text-right",
        isChecked
          ? "bg-[#E5F6F7] border-[#00A0B0]"
          : "bg-white border-[#E6E9EF] hover:border-[#D0D4DB]",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className={cn(
        "w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0",
        isChecked
          ? "bg-[#00A0B0] border-[#00A0B0]"
          : "bg-white border-[#D0D4DB]"
      )}>
        {isChecked && <Check className="w-3 h-3 text-white" />}
      </div>
      <span className="text-sm text-[#323338]">
        {config.checkboxLabel || (isChecked ? 'כן' : 'לא')}
      </span>
    </button>
  )
}

// Select Field
function SelectField({ field, value, onChange, disabled }: Omit<QuestionFieldProps, 'error'>) {
  const [isOpen, setIsOpen] = useState(false)
  const config = field.config
  const options = config.options ?? []
  const selectedOption = options.find(o => o.value === value)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full h-10 px-4 rounded-lg bg-white border border-[#E6E9EF] text-sm text-right",
          "flex items-center justify-between",
          "focus:outline-none focus:border-[#00A0B0] focus:ring-2 focus:ring-[#00A0B0]/20",
          "disabled:bg-[#F5F6F8] disabled:cursor-not-allowed",
          "transition-all"
        )}
      >
        <span className={selectedOption ? "text-[#323338]" : "text-[#9B9BAD]"}>
          {selectedOption?.label ?? config.placeholder ?? 'בחר...'}
        </span>
        <ChevronDown className={cn(
          "w-4 h-4 text-[#9B9BAD] transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 w-full mt-1 py-1 bg-white border border-[#E6E9EF] rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={cn(
                  "w-full px-4 py-2 text-sm text-right hover:bg-[#F5F6F8] transition-colors",
                  "flex items-center justify-between",
                  option.value === value && "bg-[#E5F6F7] text-[#00A0B0]"
                )}
              >
                {option.label}
                {option.value === value && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// Multiselect Field
function MultiselectField({ field, value, onChange, disabled }: Omit<QuestionFieldProps, 'error'>) {
  const config = field.config
  const options = config.options ?? []
  const selectedValues = (value as string[]) ?? []

  const toggleOption = (optionValue: string) => {
    if (selectedValues.includes(optionValue)) {
      onChange(selectedValues.filter(v => v !== optionValue))
    } else {
      onChange([...selectedValues, optionValue])
    }
  }

  return (
    <div className="space-y-2">
      {options.map((option) => {
        const isSelected = selectedValues.includes(option.value)
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => !disabled && toggleOption(option.value)}
            disabled={disabled}
            className={cn(
              "flex items-center gap-3 w-full p-3 rounded-lg border transition-all text-right",
              isSelected
                ? "bg-[#E5F6F7] border-[#00A0B0]"
                : "bg-white border-[#E6E9EF] hover:border-[#D0D4DB]",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className={cn(
              "w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0",
              isSelected
                ? "bg-[#00A0B0] border-[#00A0B0]"
                : "bg-white border-[#D0D4DB]"
            )}>
              {isSelected && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className="text-sm text-[#323338]">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}

// Scale Field
function ScaleField({ field, value, onChange, disabled }: Omit<QuestionFieldProps, 'error'>) {
  const config = field.config
  const min = config.min ?? 1
  const max = config.max ?? 5
  const labels = config.labels ?? ['', '']
  const currentValue = value as number | null

  const scaleValues = Array.from({ length: max - min + 1 }, (_, i) => min + i)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        {scaleValues.map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onChange(num)}
            disabled={disabled}
            className={cn(
              "flex-1 h-10 rounded-lg border-2 text-sm font-medium transition-all",
              currentValue === num
                ? "bg-[#00A0B0] border-[#00A0B0] text-white"
                : "bg-white border-[#E6E9EF] text-[#676879] hover:border-[#00A0B0]",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {num}
          </button>
        ))}
      </div>
      {(labels[0] || labels[1]) && (
        <div className="flex justify-between text-xs text-[#9B9BAD]">
          <span>{labels[0]}</span>
          <span>{labels[1]}</span>
        </div>
      )}
    </div>
  )
}

// Date Field
function DateField({ field, value, onChange, disabled }: Omit<QuestionFieldProps, 'error'>) {
  const config = field.config

  return (
    <input
      type="date"
      value={(value as string) ?? ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        "w-full h-10 px-4 rounded-lg bg-white border border-[#E6E9EF] text-[#323338] text-sm",
        "focus:outline-none focus:border-[#00A0B0] focus:ring-2 focus:ring-[#00A0B0]/20",
        "disabled:bg-[#F5F6F8] disabled:cursor-not-allowed",
        "transition-all"
      )}
      dir="ltr"
    />
  )
}
