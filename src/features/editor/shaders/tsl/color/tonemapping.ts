import { Fn, dot, exp, mix, pow, smoothstep, vec3 } from "three/tsl"

export const reinhardTonemap = Fn(([color]) => {
  return color.div(color.add(1.0))
})

export const uncharted2Tonemap = Fn(([color]) => {
  const a = 0.15
  const b = 0.5
  const c = 0.1
  const d = 0.2
  const e = 0.02
  const f = 0.3

  return color
    .mul(a)
    .add(color.mul(color).mul(b))
    .div(color.mul(color).mul(c).add(color.mul(d)).add(e))
    .sub(f / e)
})

export const acesTonemap = Fn(([color]) => {
  const a = 2.51
  const b = 0.03
  const c = 2.43
  const d = 0.59
  const e = 0.14

  return color.mul(a).add(b).div(color.mul(c).add(color.mul(d)).add(e)).clamp(0.0, 1.0)
})

export const crossProcessTonemap = Fn(([color]) => {
  const r = pow(color.x, 0.8)
  const g = pow(color.y, 1.2)
  const b = pow(color.z, 1.5)

  return vec3(r, g, b).clamp(0.0, 1.0)
})

export const bleachBypassTonemap = Fn(([color]) => {
  const lum = dot(color, vec3(0.2126, 0.7152, 0.0722))
  const mixAmount = 0.7

  return mix(vec3(lum), color, mixAmount).mul(1.2).clamp(0.0, 1.0)
})

export const technicolorTonemap = Fn(([color]) => {
  const r = color.x.mul(1.5)
  const g = color.y.mul(1.2)
  const b = color.z.mul(0.8).add(color.x.mul(0.2))

  return vec3(r, g, b).clamp(0.0, 1.0)
})

export const cinematicTonemap = Fn(([color]) => {
  const r = smoothstep(0.05, 0.95, color.x.mul(0.95).add(0.02))
  const g = smoothstep(0.05, 0.95, color.y.mul(1.05))
  const b = smoothstep(0.05, 0.95, color.z.mul(1.1))

  return vec3(r, g, b).clamp(0.0, 1.0)
})

export const tanh = Fn(([x]) => {
  const e2x = exp(x.mul(2.0))

  return e2x.sub(1.0).div(e2x.add(1.0))
})
