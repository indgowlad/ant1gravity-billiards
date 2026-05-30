import {
  Vector3,
  Mesh,
  CylinderGeometry,
  BoxGeometry,
  PlaneGeometry,
  MeshPhongMaterial,
  MeshBasicMaterial,
  CanvasTexture,
  PointLight,
  Group,
} from "three"
import { TableGeometry } from "./tablegeometry"
import { PocketGeometry } from "./pocketgeometry"
import { R } from "../model/physics/constants"

export class TableMesh {
  logger = (_) => {}

  static mesh

  private static readonly cylinderCache = new Map<string, CylinderGeometry>()
  private static readonly boxCache = new Map<string, BoxGeometry>()

  generateTable(hasPockets: boolean) {
    const group = new Group()
    const light = new PointLight(0xf0f0e8, 22)
    light.position.set(0, 0, R * 50)
    group.add(light)
    this.addCushions(group, hasPockets)
    this.addAnt1GravityLogo(group)

    if (hasPockets) {
      PocketGeometry.knuckles.forEach((k) => this.knuckleCylinder(k, group))
      PocketGeometry.pocketCenters.forEach((p) =>
        this.knuckleCylinder(p, group, this.pocket)
      )

      const p = PocketGeometry.pockets.pocketNW.pocket
      const k = PocketGeometry.pockets.pocketNW.knuckleNE
      this.logger(
        "knuckle-pocket gap = " +
          (p.pos.distanceTo(k.pos) - p.radius - k.radius)
      )
    }
    return group
  }

  // ANT1GRAVITY watermark — text rendered on the felt
  private addAnt1GravityLogo(group: Group) {
    const canvas = document.createElement("canvas")
    canvas.width = 2048
    canvas.height = 512
    const ctx = canvas.getContext("2d")!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.font = "900 220px 'Arial Black', Arial, sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillStyle = "rgba(255,255,255,0.14)"
    ctx.fillText("ANT1GRAVITY", canvas.width / 2, canvas.height / 2)

    const texture = new CanvasTexture(canvas)
    texture.anisotropy = 8
    const material = new MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    })
    // Logo dimensions: ~50R wide × 12R tall, centered on the felt
    const geometry = new PlaneGeometry(R * 50, R * 12)
    const mesh = new Mesh(geometry, material)
    // Just above the cloth top (z=-R) so it floats on the felt surface
    mesh.position.set(0, 0, -R + 0.02)
    group.add(mesh)
  }

  private readonly cloth = new MeshPhongMaterial({
    color: 0x243599,
    wireframe: false,
    flatShading: true,
    transparent: false,
  })

  private readonly cushion = new MeshPhongMaterial({
    color: 0x4455a9,
    wireframe: false,
    flatShading: true,
    transparent: false,
  })

  private readonly pocket = new MeshPhongMaterial({
    color: 0x445599,
    wireframe: false,
    flatShading: true,
    transparent: true,
    opacity: 0.3,
  })

  private knuckleCylinder(knuckle, scene, material = this.cloth) {
    const k = this.cylinder(
      knuckle.pos,
      knuckle.radius,
      (R * 0.75) / 0.5,
      scene,
      material
    )
    k.position.setZ((-R * 0.25) / 0.5 / 2)
  }

  private cylinder(pos, radius, depth, scene, material) {
    const key = `${radius}_${depth}`
    let geometry = TableMesh.cylinderCache.get(key)
    if (!geometry) {
      geometry = new CylinderGeometry(radius, radius, depth, 16)
      TableMesh.cylinderCache.set(key, geometry)
    }
    const mesh = new Mesh(geometry, material)
    mesh.position.copy(pos)
    mesh.rotation.x = Math.PI / 2
    scene.add(mesh)
    return mesh
  }

  addCushions(scene, hasPockets) {
    const th = (R * 10) / 0.5
    this.plane(
      new Vector3(0, 0, -R - th / 2),
      2 * TableGeometry.X,
      2 * TableGeometry.Y,
      th,
      scene,
      this.cloth
    )

    const d = (R * 1) / 0.5
    const h = (R * 0.75) / 0.5
    const e = (-R * 0.25) / 0.5 / 2
    const X = TableGeometry.X
    const Y = TableGeometry.Y

    let lengthN = Math.abs(
      PocketGeometry.pockets.pocketNW.knuckleNE.pos.x -
        PocketGeometry.pockets.pocketN.knuckleNW.pos.x
    )
    let lengthE = Math.abs(
      PocketGeometry.pockets.pocketNW.knuckleSW.pos.y -
        PocketGeometry.pockets.pocketSW.knuckleNW.pos.y
    )

    if (!hasPockets) {
      lengthN = 2 * TableGeometry.Y
      lengthE = 2 * TableGeometry.Y + 4 * R
    }

    this.plane(new Vector3(X + d / 2, 0, e), d, lengthE, h, scene)
    this.plane(new Vector3(-X - d / 2, 0, e), d, lengthE, h, scene)

    this.plane(new Vector3(-X / 2, Y + d / 2, e), lengthN, d, h, scene)
    this.plane(new Vector3(-X / 2, -Y - d / 2, e), lengthN, d, h, scene)

    this.plane(new Vector3(X / 2, Y + d / 2, e), lengthN, d, h, scene)
    this.plane(new Vector3(X / 2, -Y - d / 2, e), lengthN, d, h, scene)
  }

  private plane(pos, x, y, z, scene, material = this.cushion) {
    const key = `${x}_${y}_${z}`
    let geometry = TableMesh.boxCache.get(key)
    if (!geometry) {
      geometry = new BoxGeometry(x, y, z)
      TableMesh.boxCache.set(key, geometry)
    }
    const mesh = new Mesh(geometry, material)
    mesh.receiveShadow = true
    mesh.position.copy(pos)
    scene.add(mesh)
  }
}
