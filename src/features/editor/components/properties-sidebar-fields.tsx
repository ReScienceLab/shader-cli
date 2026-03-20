"use client"

import { motion } from "motion/react"
import type {
  AnimatedPropertyBinding,
  ParameterDefinition,
  ParameterValue,
  SelectParameterDefinition,
  TextParameterDefinition,
} from "@/features/editor/types"
import { cn } from "@/shared/lib/cn"
import { ColorPicker } from "@/shared/ui/color-picker"
import { IconButton } from "@/shared/ui/icon-button"
import { Select } from "@/shared/ui/select"
import { Slider } from "@/shared/ui/slider"
import { Toggle } from "@/shared/ui/toggle"
import { Typography } from "@/shared/ui/typography"
import { XYPad } from "@/shared/ui/xy-pad"
import { useTimelineStore } from "@/store/timelineStore"
import s from "./properties-sidebar.module.css"
import {
  hasTrackForBinding,
  toBooleanValue,
  toColorValue,
  toNumberValue,
  toTextValue,
  toVec2Value,
} from "./properties-sidebar-utils"

export type TimelineKeyframeControl = {
  binding: AnimatedPropertyBinding | null
  hasTrack: boolean
  layerId: string
  onKeyframe: (
    binding: AnimatedPropertyBinding,
    layerId: string,
    value: ParameterValue
  ) => void
  reduceMotion: boolean
  timelinePanelOpen: boolean
  value: ParameterValue
}

function RhombusIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 14 14">
      <path
        d="M7 1.8L12.2 7L7 12.2L1.8 7L7 1.8Z"
        fill="currentColor"
        fillOpacity="0.18"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  )
}

function TimelineKeyframeButton({
  control,
}: {
  control: TimelineKeyframeControl | null
}) {
  if (!control?.binding) {
    return null
  }

  let animation: { opacity: number; scale?: number }

  if (control.timelinePanelOpen) {
    animation = control.reduceMotion
      ? { opacity: 1 }
      : { opacity: 1, scale: 1 }
  } else {
    animation = control.reduceMotion
      ? { opacity: 0 }
      : { opacity: 0, scale: 0.82 }
  }

  return (
    <span className={s.fieldActionSlot}>
      <motion.span
        animate={animation}
        className={s.fieldActionWrap}
        initial={false}
        transition={
          control.reduceMotion
            ? { duration: 0.12, ease: "easeOut" }
            : { damping: 20, mass: 0.5, stiffness: 420, type: "spring" }
        }
      >
        <IconButton
          aria-hidden={!control.timelinePanelOpen}
          aria-label={`Create keyframe for ${control.binding.label}`}
          className={cn(
            s.timelineKeyframeButton,
            control.hasTrack && s.timelineKeyframeButtonActive
          )}
          disabled={!control.timelinePanelOpen}
          onClick={() =>
            control.onKeyframe(
              control.binding as AnimatedPropertyBinding,
              control.layerId,
              control.value
            )
          }
          tabIndex={control.timelinePanelOpen ? 0 : -1}
          variant="ghost"
        >
          <RhombusIcon />
        </IconButton>
      </motion.span>
    </span>
  )
}

export function renderFieldLabel(
  label: string,
  control: TimelineKeyframeControl | null
) {
  return (
    <span className={s.fieldLabelRow}>
      <span>{label}</span>
      <TimelineKeyframeButton control={control} />
    </span>
  )
}

export function ParameterField({
  definition,
  layerId,
  onChange,
  onTimelineKeyframe,
  reduceMotion,
  timelineBinding,
  timelinePanelOpen,
  value,
}: {
  definition: ParameterDefinition
  layerId: string
  onChange: (id: string, key: string, value: ParameterValue) => void
  onTimelineKeyframe: (
    binding: AnimatedPropertyBinding,
    layerId: string,
    value: ParameterValue
  ) => void
  reduceMotion: boolean
  timelineBinding: AnimatedPropertyBinding | null
  timelinePanelOpen: boolean
  value: ParameterValue
}) {
  const timelineTracks = useTimelineStore((state) => state.tracks)
  const timelineControl: TimelineKeyframeControl | null = timelineBinding
    ? {
        binding: timelineBinding,
        hasTrack: hasTrackForBinding(timelineTracks, layerId, timelineBinding),
        layerId,
        onKeyframe: onTimelineKeyframe,
        reduceMotion,
        timelinePanelOpen,
        value,
      }
    : null

  switch (definition.type) {
    case "number":
      return (
        <Slider
          label={renderFieldLabel(definition.label, timelineControl)}
          max={definition.max ?? 100}
          min={definition.min ?? 0}
          onValueChange={(nextValue) =>
            onChange(layerId, definition.key, nextValue)
          }
          step={definition.step ?? 0.01}
          value={toNumberValue(value, definition.defaultValue)}
          valueFormatOptions={{
            maximumFractionDigits: 2,
            minimumFractionDigits: 0,
          }}
        />
      )

    case "select":
      return (
        <div className={s.inlineField}>
          <Typography className={s.fieldLabel} tone="secondary" variant="label">
            {renderFieldLabel(definition.label, timelineControl)}
          </Typography>
          <Select
            className={s.select ?? ""}
            onValueChange={(nextValue) => {
              if (nextValue) {
                onChange(layerId, definition.key, nextValue)
              }
            }}
            options={(definition as SelectParameterDefinition).options}
            value={typeof value === "string" ? value : definition.defaultValue}
          />
        </div>
      )

    case "boolean":
      return (
        <div className={s.inlineFieldCompact}>
          <Typography className={s.fieldLabel} tone="secondary" variant="label">
            {renderFieldLabel(definition.label, timelineControl)}
          </Typography>
          <Toggle
            checked={toBooleanValue(value)}
            className={s.toggleWrap ?? ""}
            onCheckedChange={(nextValue) =>
              onChange(layerId, definition.key, nextValue)
            }
          />
        </div>
      )

    case "color":
      return (
        <div className={s.inlineField}>
          <Typography className={s.fieldLabel} tone="secondary" variant="label">
            {renderFieldLabel(definition.label, timelineControl)}
          </Typography>
          <ColorPicker
            onValueChange={(nextValue) =>
              onChange(layerId, definition.key, nextValue)
            }
            value={toColorValue(value)}
          />
        </div>
      )

    case "vec2":
      return (
        <XYPad
          label={renderFieldLabel(definition.label, timelineControl)}
          max={definition.max ?? 1}
          min={definition.min ?? -1}
          onValueChange={(nextValue) =>
            onChange(layerId, definition.key, nextValue)
          }
          step={definition.step ?? 0.01}
          value={toVec2Value(value)}
        />
      )

    case "text":
      return (
        <label className={s.textField}>
          <Typography className={s.fieldLabel} tone="secondary" variant="label">
            {renderFieldLabel(definition.label, timelineControl)}
          </Typography>
          <input
            className={s.textInput}
            maxLength={(definition as TextParameterDefinition).maxLength}
            onChange={(event) =>
              onChange(layerId, definition.key, event.currentTarget.value)
            }
            spellCheck={false}
            type="text"
            value={toTextValue(value, definition.defaultValue)}
          />
        </label>
      )

    default:
      return null
  }
}
