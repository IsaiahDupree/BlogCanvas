"use client"

import * as React from "react"
import { HelpCircle } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface HelpTooltipProps {
  content: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  className?: string
  iconSize?: number
}

export function HelpTooltip({
  content,
  side = "right",
  className = "",
  iconSize = 16
}: HelpTooltipProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={`inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors ${className}`}
            aria-label="Help information"
          >
            <HelpCircle size={iconSize} />
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          <div className="text-sm">{content}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface FieldLabelWithHelpProps {
  label: string
  helpText: React.ReactNode
  required?: boolean
  htmlFor?: string
}

export function FieldLabelWithHelp({
  label,
  helpText,
  required = false,
  htmlFor
}: FieldLabelWithHelpProps) {
  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      <HelpTooltip content={helpText} />
    </div>
  )
}
