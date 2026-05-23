#!/usr/bin/env python3
"""
PILO 云梦枕 3D Model — V7 (complete blueprint, full bottom outline)

All vertex coordinates from PILO Blueprint.pdf Page 1.
Bottom outline uses all 9 perimeter vertices from the blueprint.

32 vertices, 60 triangular faces, closed manifold (Euler V-E+F=2).

Coordinate system: X=left/right, Y=back(+)/front(-), Z=height(+up)
"""

import numpy as np
import struct


def build_pilo():
    verts = np.array([
        # === EQUATOR RING (12 vertices, 0-11) ===
        # Numbered 1-6 back→front, L=left R=right
        [-21,  18,  9],   # 0:  1L — back-left groove
        [-30,  14,  5],   # 1:  2L — mid-left
        [-27,   1,  8],   # 2:  3L — wing left
        [-32, -11, 11],   # 3:  4L — front-left upper
        [-31, -18,  8],   # 4:  5L — front-left lower
        [-12, -20, 11],   # 5:  6L — front center-left
        [ 12, -20, 11],   # 6:  6R — front center-right
        [ 31, -18,  8],   # 7:  5R — front-right lower
        [ 32, -11, 11],   # 8:  4R — front-right upper
        [ 27,   1,  8],   # 9:  3R — wing right
        [ 30,  14,  5],   # 10: 2R — mid-right
        [ 21,  18,  9],   # 11: 1R — back-right groove

        # === TOP INTERIOR (10 vertices, 12-21) ===
        # G=Groove, M=Mid, P=Peak, S=Slope, O=Origin, N=Nose
        [ -4,  15,  7],   # 12: GL — groove left
        [  4,  15,  7],   # 13: GR — groove right
        [-10,   0,  8],   # 14: ML — mid left
        [ 10,   0,  8],   # 15: MR — mid right
        [-13, -12, 13],   # 16: PL — PEAK LEFT (lobe summit)
        [ 13, -12, 13],   # 17: PR — PEAK RIGHT (lobe summit)
        [ -6, -11, 10],   # 18: SL — slope left
        [  6, -11, 10],   # 19: SR — slope right
        [  0,   0,  5],   # 20: O  — origin (center valley)
        [  0, -16,  7],   # 21: N  — nose (front center)

        # === BOTTOM PERIMETER (9 vertices, 22-30) ===
        [-28,  14,  0],   # 22: B0 — back-left
        [  0,  17,  0],   # 23: B1 — back center
        [ 28,  14,  0],   # 24: B2 — back-right
        [ 33,   0,  0],   # 25: B3 — right
        [ 29, -13,  0],   # 26: B4 — front-right
        [ 10, -18,  0],   # 27: B5 — front center-right
        [-10, -18,  0],   # 28: B6 — front center-left
        [-29, -13,  0],   # 29: B7 — front-left
        [-33,   0,  0],   # 30: B8 — left

        # === BOTTOM CENTER (1 vertex, 31) ===
        [  0,   0,  0],   # 31: BC
    ], dtype=np.float64)

    # Named indices
    L1, L2, L3, L4, L5, L6 = 0, 1, 2, 3, 4, 5
    R6, R5, R4, R3, R2, R1 = 6, 7, 8, 9, 10, 11
    Ap, A  = 12, 13
    Bp, B  = 14, 15
    Cp, C  = 16, 17
    Dp, D  = 18, 19
    O,  F  = 20, 21
    b0, b1, b2, b3, b4, b5, b6, b7, b8 = 22, 23, 24, 25, 26, 27, 28, 29, 30
    BC = 31

    faces = []

    # ======== TOP SURFACE: 27 faces ========

    # Center-spanning (3 faces — V-groove & front now open valleys to bottom)
    faces += [
        [Ap, O, A],       # groove floor → center
        [O, D, Dp],       # center valley (D-D' seam across lobe valley)
        [D, F, Dp],       # front valley floor
    ]

    # Right half (12 faces)
    faces += [
        [R1, A, B],       # back-right upper
        [R1, R2, R3],     # back-right arc (R1-R3 diagonal)
        [R1, R3, B],      # back-right inner
        [A, O, B],        # center-right upper
        [R3, B, C],       # right middle
        [R3, C, R4],      # right lower edge
        [R4, R6, C],      # front-right outer (R4-R6 diagonal)
        [R4, R5, R6],     # front-right arc
        [B, O, D],        # center-right mid
        [B, D, C],        # right lobe connect
        [D, F, R6],       # slope → front → equator
        [D, R6, C],       # slope → equator → lobe peak
    ]

    # Left half (12 faces — mirror of right)
    faces += [
        [L1, Bp, Ap],     # back-left upper
        [L1, L2, L3],     # back-left arc (L1-L3 diagonal)
        [L1, L3, Bp],     # back-left inner
        [Ap, Bp, O],      # center-left upper
        [L3, Cp, Bp],     # left middle
        [L3, L4, Cp],     # left lower edge
        [L4, L6, Cp],     # front-left outer (L4-L6 diagonal)
        [L4, L5, L6],     # front-left arc
        [Bp, Dp, O],      # center-left mid
        [Bp, Cp, Dp],     # left lobe connect
        [Dp, F, L6],      # slope → front → equator
        [Dp, L6, Cp],     # slope → equator → lobe peak
    ]

    assert len(faces) == 27, f"Top faces: {len(faces)}"

    # ======== SIDE BAND: 24 faces ========
    # Connects equator + interior vertices to bottom perimeter.
    # Back: A'/A drop into V-groove valley → b1
    # Front: F drops into front valley → b5/b6
    side = [
        # Back V-groove valley (A' and A drop to b1)
        [b1, L1, Ap],     # V-groove left wall → bottom
        [b1, Ap, A],      # V-groove floor → bottom
        [b1, A, R1],      # V-groove right wall → bottom
        [b1, b0, L1],     # back → left
        [b0, L2, L1],     # back-left

        # Left
        [b0, b8, L2],     # left transition
        [b8, L3, L2],     # left upper
        [b8, L4, L3],     # left lower

        # Front-left (diagonal 4L-B7)
        [L4, L5, b7],     # front-left upper
        [L4, b7, b8],     # front-left transition
        [b7, b6, L5],     # front-left lower
        [b6, L6, L5],     # front-left

        # Front center valley (F drops to b5, b6)
        [b6, L6, F],      # front-left → F → bottom
        [b6, F, b5],      # F spans front bottom
        [b5, F, R6],      # F → front-right

        # Front-right
        [b5, R5, R6],     # front-right lower
        [b5, b4, R5],     # front-right transition

        # Right (diagonal 4R-B4)
        [R4, R5, b4],     # right upper
        [R4, b4, b3],     # right mid
        [b3, R3, R4],     # right lower

        # Back-right (diagonal R2-b3 instead of R3-b2)
        [b3, R2, R3],     # back-right upper
        [b3, b2, R2],     # back-right lower
        [b2, R1, R2],     # back-right edge

        # Close loop
        [b2, b1, R1],     # close
    ]

    assert len(side) == 24, f"Side faces: {len(side)}"
    faces += side

    # ======== BOTTOM: 9 faces ========
    bottom_ring = [b0, b1, b2, b3, b4, b5, b6, b7, b8]
    for i in range(9):
        j = (i + 1) % 9
        faces.append([BC, bottom_ring[j], bottom_ring[i]])

    assert len(faces) == 60, f"Total faces: {len(faces)}"
    return verts, np.array(faces, dtype=np.int32)


def fix_normals(verts, faces):
    """Fix face winding: top→+Z, side→outward XY, bottom→-Z."""
    fixed = 0
    for i, face in enumerate(faces):
        v0, v1, v2 = verts[face[0]], verts[face[1]], verts[face[2]]
        normal = np.cross(v1 - v0, v2 - v0)
        min_z = min(v0[2], v1[2], v2[2])
        max_z = max(v0[2], v1[2], v2[2])

        flip = False
        if max_z < 0.01:
            flip = normal[2] > 0
        elif min_z < 0.01:
            fc = (v0 + v1 + v2) / 3.0
            flip = np.dot(normal[:2], fc[:2]) < 0
        else:
            flip = normal[2] < 0

        if flip:
            faces[i] = [face[0], face[2], face[1]]
            fixed += 1

    print(f"  Fixed {fixed} face normals")
    return faces


def compute_normals(verts, faces):
    v0 = verts[faces[:, 0]]
    v1 = verts[faces[:, 1]]
    v2 = verts[faces[:, 2]]
    n = np.cross(v1 - v0, v2 - v0)
    mag = np.linalg.norm(n, axis=1, keepdims=True)
    mag[mag == 0] = 1
    return n / mag


def to_yup(v):
    return [v[0], v[2], -v[1]]


def export_obj(verts, faces, path):
    normals = compute_normals(verts, faces)
    with open(path, 'w') as f:
        f.write("# PILO 云梦枕 — Low Poly Model (v7)\n")
        f.write(f"# {len(verts)} vertices, {len(faces)} faces\n")
        f.write("# Units: cm, Y-up\n\n")
        f.write("mtllib pilo.mtl\nusemtl pilo_fabric\n\n")
        for v in verts:
            yup = to_yup(v)
            f.write(f"v {yup[0]:.4f} {yup[1]:.4f} {yup[2]:.4f}\n")
        f.write("\n")
        for n in normals:
            nup = to_yup(n)
            f.write(f"vn {nup[0]:.6f} {nup[1]:.6f} {nup[2]:.6f}\n")
        f.write("\n")
        for i, face in enumerate(faces):
            ni = i + 1
            f.write(f"f {face[0]+1}//{ni} {face[1]+1}//{ni} {face[2]+1}//{ni}\n")
    print(f"  OBJ → {path}")


def export_mtl(path):
    with open(path, 'w') as f:
        f.write("# PILO Materials\n\n")
        f.write("newmtl pilo_fabric\nKa 0.15 0.15 0.16\n")
        f.write("Kd 0.55 0.56 0.58\nKs 0.03 0.03 0.03\n")
        f.write("Ns 8.0\nd 1.0\nillum 2\n\n")
        f.write("newmtl pilo_blue\nKa 0.04 0.08 0.18\n")
        f.write("Kd 0.14 0.33 0.62\nKs 0.02 0.02 0.04\n")
        f.write("Ns 8.0\nd 1.0\nillum 2\n")
    print(f"  MTL → {path}")


def export_stl(verts, faces, path):
    normals = compute_normals(verts, faces)
    with open(path, 'wb') as f:
        f.write((b'PILO Low Poly Pillow v7' + b'\0' * 80)[:80])
        f.write(struct.pack('<I', len(faces)))
        for i, face in enumerate(faces):
            n = to_yup(normals[i])
            f.write(struct.pack('<3f', *n))
            for vi in face:
                v = to_yup(verts[vi])
                f.write(struct.pack('<3f', *v))
            f.write(struct.pack('<H', 0))
    print(f"  STL → {path}")


def export_ply(verts, faces, path, rgb):
    normals = compute_normals(verts, faces)
    nf = len(faces)
    with open(path, 'w') as f:
        f.write("ply\nformat ascii 1.0\n")
        f.write(f"element vertex {nf * 3}\n")
        f.write("property float x\nproperty float y\nproperty float z\n")
        f.write("property float nx\nproperty float ny\nproperty float nz\n")
        f.write("property uchar red\nproperty uchar green\nproperty uchar blue\n")
        f.write(f"element face {nf}\n")
        f.write("property list uchar int vertex_indices\nend_header\n")
        for i, face in enumerate(faces):
            n = to_yup(normals[i])
            np.random.seed(i * 7 + 3)
            dr = int(np.random.normal(0, 5))
            for j in range(3):
                v = to_yup(verts[face[j]])
                r = max(0, min(255, rgb[0] + dr))
                g = max(0, min(255, rgb[1] + dr))
                b = max(0, min(255, rgb[2] + dr))
                f.write(f"{v[0]:.4f} {v[1]:.4f} {v[2]:.4f} "
                        f"{n[0]:.4f} {n[1]:.4f} {n[2]:.4f} {r} {g} {b}\n")
        for i in range(nf):
            f.write(f"3 {i*3} {i*3+1} {i*3+2}\n")
    print(f"  PLY → {path}")


def validate(verts, faces):
    nv, nf = len(verts), len(faces)
    edge_count = {}
    for face in faces:
        for k in range(3):
            a, b = int(face[k]), int(face[(k + 1) % 3])
            e = (min(a, b), max(a, b))
            edge_count[e] = edge_count.get(e, 0) + 1
    ne = len(edge_count)
    euler = nv - ne + nf
    print(f"  V={nv}  E={ne}  F={nf}  Euler={euler}",
          "(closed ✓)" if euler == 2 else "(OPEN!)")

    non_manifold = [e for e, c in edge_count.items() if c != 2]
    if non_manifold:
        print(f"  WARNING: {len(non_manifold)} non-manifold edges!")
        for e in non_manifold[:5]:
            print(f"    edge {e}: {edge_count[e]} faces")
    else:
        print("  All edges shared by exactly 2 faces ✓")

    bbox = verts.max(axis=0) - verts.min(axis=0)
    print(f"  Bounding box: {bbox[0]:.0f} × {bbox[1]:.0f} × {bbox[2]:.0f} cm")

    for i, face in enumerate(faces):
        if len(set(face)) < 3:
            print(f"  WARNING: degenerate face {i}")
    assert faces.max() < nv and faces.min() >= 0


def main():
    print("=" * 50)
    print("  PILO 云梦枕 — 3D Reconstruction v7")
    print("  (Full blueprint: 9-vertex bottom outline)")
    print("=" * 50)

    print("\n[1] Building mesh...")
    verts, faces = build_pilo()

    print("\n[2] Fixing normals...")
    faces = fix_normals(verts, faces)

    print("\n[3] Validating...")
    validate(verts, faces)

    print("\n[4] Exporting...")
    export_obj(verts, faces, "pilo_52.obj")
    export_mtl("pilo.mtl")
    export_stl(verts, faces, "pilo_52.stl")
    export_ply(verts, faces, "pilo_grey.ply", (140, 143, 148))
    export_ply(verts, faces, "pilo_blue.ply", (38, 85, 165))

    print("\n[5] Viewer data:")
    print("const positions = [")
    for v in verts:
        print(f"  {v[0]:.0f},{v[1]:.0f},{v[2]:.0f},")
    print("];")
    print("const indices = [")
    row = "  "
    for i, f in enumerate(faces):
        row += f"{f[0]},{f[1]},{f[2]},"
        if (i + 1) % 7 == 0:
            print(row)
            row = "  "
    if row.strip():
        print(row)
    print("];")

    print(f"\n  Done. V7: {len(verts)} vertices, {len(faces)} faces.")


if __name__ == "__main__":
    main()
