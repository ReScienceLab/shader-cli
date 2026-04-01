import * as THREE from "three/webgpu"
import {
  clamp,
  cos,
  float,
  max,
  min,
  sin,
  smoothstep,
  step,
  texture as tslTexture,
  type TSLNode,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
} from "three/tsl"
import type { LayerParameterValues } from "../types/editor"
import { PassNode } from "./pass-node"

type Node = TSLNode

const MAX_SAMPLES = 32

export class SmearPass extends PassNode {
  private readonly angleUniform: Node
  private readonly startUniform: Node
  private readonly endUniform: Node
  private readonly strengthUniform: Node
  private readonly samplesUniform: Node
  private readonly widthUniform: Node
  private readonly heightUniform: Node

  private readonly placeholder: THREE.Texture
  private sourceTextureNodes: Node[] = []

  constructor(layerId: string) {
    super(layerId)
    this.placeholder = new THREE.Texture()
    this.angleUniform = uniform(0)
    this.startUniform = uniform(0.25)
    this.endUniform = uniform(0.75)
    this.strengthUniform = uniform(24)
    this.samplesUniform = uniform(12)
    this.widthUniform = uniform(1)
    this.heightUniform = uniform(1)
    this.rebuildEffectNode()
  }

  override render(
    renderer: THREE.WebGPURenderer,
    inputTexture: THREE.Texture,
    outputTarget: THREE.WebGLRenderTarget,
    time: number,
    delta: number
  ): void {
    for (const node of this.sourceTextureNodes) {
      node.value = inputTexture
    }

    super.render(renderer, inputTexture, outputTarget, time, delta)
  }

  override resize(width: number, height: number): void {
    this.widthUniform.value = Math.max(1, width)
    this.heightUniform.value = Math.max(1, height)
  }

  override updateParams(params: LayerParameterValues): void {
    this.angleUniform.value =
      typeof params.angle === "number"
        ? Math.max(0, Math.min(360, params.angle))
        : 0
    this.startUniform.value =
      typeof params.start === "number"
        ? Math.max(0, Math.min(1, params.start))
        : 0.25
    this.endUniform.value =
      typeof params.end === "number"
        ? Math.max(0, Math.min(1, params.end))
        : 0.75
    this.strengthUniform.value =
      typeof params.strength === "number"
        ? Math.max(0, Math.min(64, params.strength))
        : 24
    this.samplesUniform.value =
      typeof params.samples === "number"
        ? Math.max(4, Math.min(MAX_SAMPLES, Math.round(params.samples)))
        : 12
  }

  private trackSourceTextureNode(uvNode: Node): Node {
    const node = tslTexture(this.placeholder, uvNode)
    this.sourceTextureNodes.push(node)
    return node
  }

  protected override buildEffectNode(): Node {
    if (!this.angleUniform) {
      return this.inputNode
    }

    this.sourceTextureNodes = []

    const renderTargetUv = vec2(uv().x, float(1).sub(uv().y))
    const angleRadians = this.angleUniform.mul(Math.PI / 180)
    const cosA = cos(angleRadians)
    const sinA = sin(angleRadians)

    const projected = renderTargetUv.x.mul(cosA).add(renderTargetUv.y.mul(sinA))

    const safeStart = min(this.startUniform, this.endUniform)
    const safeEnd = max(this.startUniform, this.endUniform)
    const blurAmount = smoothstep(safeStart, safeEnd, projected)

    const blurRadius = blurAmount.mul(this.strengthUniform)
    const blurDirection = vec2(cosA, sinA)

    let accumR = float(0)
    let accumG = float(0)
    let accumB = float(0)
    let weightSum = float(0)

    for (let index = 0; index < MAX_SAMPLES; index += 1) {
      const t = index / (MAX_SAMPLES - 1) - 0.5
      const offset = vec2(
        blurDirection.x.mul(blurRadius).mul(float(t)).div(this.widthUniform),
        blurDirection.y.mul(blurRadius).mul(float(t)).div(this.heightUniform)
      )
      const sampleUv = vec2(
        clamp(renderTargetUv.x.add(offset.x), float(0), float(1)),
        clamp(renderTargetUv.y.add(offset.y), float(0), float(1))
      )
      const sample = this.trackSourceTextureNode(sampleUv)
      const activeWeight = step(float(index + 0.5), this.samplesUniform)
      accumR = accumR.add(float(sample.r).mul(activeWeight))
      accumG = accumG.add(float(sample.g).mul(activeWeight))
      accumB = accumB.add(float(sample.b).mul(activeWeight))
      weightSum = weightSum.add(activeWeight)
    }

    const safeWeight = max(weightSum, float(1))
    return vec4(
      vec3(
        accumR.div(safeWeight),
        accumG.div(safeWeight),
        accumB.div(safeWeight)
      ),
      float(1)
    )
  }
}
