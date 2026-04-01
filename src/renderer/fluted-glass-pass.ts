import * as THREE from "three/webgpu"
import {
  cos,
  float,
  sin,
  texture as tslTexture,
  type TSLNode,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
} from "three/tsl"
import { PassNode } from "@/renderer/pass-node"
import type { LayerParameterValues } from "@/types/editor"

type Node = TSLNode

export class FlutedGlassPass extends PassNode {
  private readonly frequencyUniform: Node
  private readonly amplitudeUniform: Node
  private readonly angleUniform: Node
  private readonly chromaticSplitUniform: Node

  private readonly placeholder: THREE.Texture
  private sourceTextureNodes: Node[] = []

  constructor(layerId: string) {
    super(layerId)
    this.placeholder = new THREE.Texture()
    this.frequencyUniform = uniform(20)
    this.amplitudeUniform = uniform(0.02)
    this.angleUniform = uniform(0)
    this.chromaticSplitUniform = uniform(0.3)
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

  override updateParams(params: LayerParameterValues): void {
    this.frequencyUniform.value =
      typeof params.frequency === "number"
        ? Math.max(2, Math.min(100, params.frequency))
        : 20
    this.amplitudeUniform.value =
      typeof params.amplitude === "number"
        ? Math.max(0, Math.min(0.1, params.amplitude))
        : 0.02
    this.angleUniform.value =
      typeof params.angle === "number"
        ? Math.max(0, Math.min(360, params.angle))
        : 0
    this.chromaticSplitUniform.value =
      typeof params.chromaticSplit === "number"
        ? Math.max(0, Math.min(1, params.chromaticSplit))
        : 0.3
  }

  private trackSourceTextureNode(uvNode: Node): Node {
    const node = tslTexture(this.placeholder, uvNode)
    this.sourceTextureNodes.push(node)
    return node
  }

  protected override buildEffectNode(): Node {
    if (!this.frequencyUniform) {
      return this.inputNode
    }

    this.sourceTextureNodes = []

    const renderTargetUv = vec2(uv().x, float(1).sub(uv().y))
    const angleRadians = this.angleUniform.mul(Math.PI / 180)
    const cosA = cos(angleRadians)
    const sinA = sin(angleRadians)

    // Project UV along rib direction
    const projected = renderTargetUv.x.mul(cosA).add(renderTargetUv.y.mul(sinA))
    const ribPhase = sin(projected.mul(this.frequencyUniform).mul(Math.PI))

    // Perpendicular direction for displacement
    const perpX = sinA.negate()
    const perpY = cosA

    // Base displacement
    const baseDisp = ribPhase.mul(this.amplitudeUniform)

    // Chromatic split: offset R/G/B by slightly different amounts
    const splitAmount = this.chromaticSplitUniform.mul(this.amplitudeUniform).mul(float(0.5))
    const dispR = baseDisp.add(splitAmount)
    const dispG = baseDisp
    const dispB = baseDisp.sub(splitAmount)

    const uvR = vec2(
      renderTargetUv.x.add(perpX.mul(dispR)),
      renderTargetUv.y.add(perpY.mul(dispR))
    )
    const uvG = vec2(
      renderTargetUv.x.add(perpX.mul(dispG)),
      renderTargetUv.y.add(perpY.mul(dispG))
    )
    const uvB = vec2(
      renderTargetUv.x.add(perpX.mul(dispB)),
      renderTargetUv.y.add(perpY.mul(dispB))
    )

    const sampleR = this.trackSourceTextureNode(uvR)
    const sampleG = this.trackSourceTextureNode(uvG)
    const sampleB = this.trackSourceTextureNode(uvB)

    return vec4(vec3(sampleR.r, sampleG.g, sampleB.b), float(1))
  }
}
