import * as THREE from "three/webgpu"
import {
  float,
  max,
  pow,
  step,
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

const MAX_COPIES = 8

export class EchoPass extends PassNode {
  private readonly copiesUniform: Node
  private readonly offsetXUniform: Node
  private readonly offsetYUniform: Node
  private readonly decayUniform: Node

  private readonly placeholder: THREE.Texture
  private sourceTextureNodes: Node[] = []

  constructor(layerId: string) {
    super(layerId)
    this.placeholder = new THREE.Texture()
    this.copiesUniform = uniform(3)
    this.offsetXUniform = uniform(0.03)
    this.offsetYUniform = uniform(0.02)
    this.decayUniform = uniform(0.5)
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
    this.copiesUniform.value =
      typeof params.copies === "number"
        ? Math.max(1, Math.min(MAX_COPIES, Math.round(params.copies)))
        : 3
    this.offsetXUniform.value =
      typeof params.offsetX === "number"
        ? Math.max(-0.5, Math.min(0.5, params.offsetX))
        : 0.03
    this.offsetYUniform.value =
      typeof params.offsetY === "number"
        ? Math.max(-0.5, Math.min(0.5, params.offsetY))
        : 0.02
    this.decayUniform.value =
      typeof params.decay === "number"
        ? Math.max(0.1, Math.min(0.95, params.decay))
        : 0.5
  }

  private trackSourceTextureNode(uvNode: Node): Node {
    const node = tslTexture(this.placeholder, uvNode)
    this.sourceTextureNodes.push(node)
    return node
  }

  protected override buildEffectNode(): Node {
    if (!this.copiesUniform) {
      return this.inputNode
    }

    this.sourceTextureNodes = []

    const renderTargetUv = vec2(uv().x, float(1).sub(uv().y))

    // Sample original (always visible at full strength)
    const original = this.trackSourceTextureNode(renderTargetUv)
    let resultR = float(original.r)
    let resultG = float(original.g)
    let resultB = float(original.b)

    // Additive-blend echo copies behind the original using screen compositing
    // For each copy: result = result + copy * weight * (1 - result)
    // This ensures echoes are visible without washing out the original
    for (let index = 1; index <= MAX_COPIES; index += 1) {
      const sampleUv = vec2(
        renderTargetUv.x.sub(this.offsetXUniform.mul(float(index))),
        renderTargetUv.y.sub(this.offsetYUniform.mul(float(index)))
      )
      const sample = this.trackSourceTextureNode(sampleUv)
      const weight = pow(this.decayUniform, float(index))
      const isActive = step(float(index - 0.5), this.copiesUniform)

      const effectiveWeight = weight.mul(isActive)
      // Screen blend: a + b * (1 - a), scaled by weight
      resultR = resultR.add(float(sample.r).mul(effectiveWeight).mul(float(1).sub(resultR)))
      resultG = resultG.add(float(sample.g).mul(effectiveWeight).mul(float(1).sub(resultG)))
      resultB = resultB.add(float(sample.b).mul(effectiveWeight).mul(float(1).sub(resultB)))
    }

    return vec4(
      vec3(
        max(resultR, float(0)),
        max(resultG, float(0)),
        max(resultB, float(0))
      ),
      float(1)
    )
  }
}
