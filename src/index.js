/* @flow */

import type { ArenaR } from "@capnp-js/reader-core";
import type { SegmentR, Pointer } from "@capnp-js/memory";

import { int32 } from "@capnp-js/read-data";
import { structBytes } from "@capnp-js/layout";
import { u3_mask } from "@capnp-js/tiny-uint";

type u16 = number;

export type StructShape = {|
  tag: "struct",
  data: u16,
  pointers: u16,
|};

export type ListShape = {|
  tag: "list",
  size: {|
    tag: "void" | "1 bit" | "8 bit" | "16 bit" | "32 bit" | "64 bit" | "pointer",
  |} | {|
    tag: "mixed",
    data: u16,
    pointers: u16,
  |},
|};

export type CapShape = {|
  tag: "cap",
|};

export type AnyShape = StructShape | ListShape | CapShape;

export function anyShape(p: Pointer<SegmentR>): AnyShape {
  switch (p.typeBits) {
  case 0x00:
    const sBytes = structBytes(p.hi);
    return {
      tag: "struct",
      data: sBytes.data >>> 3,
      pointers: sBytes.pointers >>> 3,
    };
  case 0x01: 
    const listType = u3_mask(p.hi, 0x07);
    switch (listType) {
    case 0x00: return { tag: "list", size: { tag: "void" } };
    case 0x01: return { tag: "list", size: { tag: "1 bit" } };
    case 0x02: return { tag: "list", size: { tag: "8 bit" } };
    case 0x03: return { tag: "list", size: { tag: "16 bit" } };
    case 0x04: return { tag: "list", size: { tag: "32 bit" } };
    case 0x05: return { tag: "list", size: { tag: "64 bit" } };
    case 0x06: return { tag: "list", size: { tag: "pointer" } };
    default:
      (listType: 0x07);
      const hi = int32(p.object.segment.raw, p.object.position+4);
      const lBytes = structBytes(hi);
      return {
        tag: "list",
        size: {
          tag: "mixed",
          data: lBytes.data >>> 3,
          pointers: lBytes.pointers >>> 3,
        },
      };
    }
  default:
    (p.typeBits: 0x03);
    return { tag: "cap" };
  }
}

export function structShape(arena: ArenaR, p: Pointer<SegmentR>): StructShape {
  /* A non-null, non-struct AnyStruct is never a programmer error. That is, the
   * only way to come across a non-null, non-struct AnyStruct is if it was
   * created by another library, a malicious agent, an incompetent agent, etc.
   * The scope of `genericStructLayout` includes catching bad data of this sort,
   * so defer to its error handling. */
  const layout = arena.genericStructLayout(p);
  return {
    tag: "struct",
    data: layout.bytes.data >>> 3,
    pointers: layout.bytes.pointers >>> 3,
  };
}

export function listShape(arena: ArenaR, p: Pointer<SegmentR>): ListShape {
  /* A non-null, non-struct AnyList is never a programmer error. That is, the
   * only way to come across a non-null, non-struct AnyList is if it was created
   * by another library, a malicious agent, an incompetent agent, etc. The
   * scopes of `boolListLayout` and `genericNonboolListLayout` includes catching
   * bad data of this sort, so defer to the error handling over there. */
  const listType = u3_mask(p.hi, 0x07);
  if (listType === 0x01) {
    arena.boolListLayout(p); /* Called for error side-effects. */
    return { tag: "list", size: { tag: "1 bit" } };
  } else {
    const layout = arena.genericNonboolListLayout(p);
    switch (listType) {
    case 0x00: return { tag: "list", size: { tag: "void" } };
    case 0x02: return { tag: "list", size: { tag: "8 bit" } };
    case 0x03: return { tag: "list", size: { tag: "16 bit" } };
    case 0x04: return { tag: "list", size: { tag: "32 bit" } };
    case 0x05: return { tag: "list", size: { tag: "64 bit" } };
    case 0x06: return { tag: "list", size: { tag: "pointer" } };
    default:
      (listType: 0x07);
      return {
        tag: "list",
        size: {
          tag: "mixed",
          data: layout.encoding.bytes.data >>> 3,
          pointers: layout.encoding.bytes.pointers >>> 3,
        },
      };
    }
  }
}

export function capShape(arena: ArenaR, p: Pointer<SegmentR>): CapShape {
  arena.capLayout(p); /* Called for error side-effects. */
  return { tag: "cap" };
}
