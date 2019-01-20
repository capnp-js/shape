/* @flow */

import test from "ava";
import { int32 } from "@capnp-js/write-data";
import { Unlimited } from "@capnp-js/base-arena";
import { Builder } from "@capnp-js/builder-arena";

import { PointerTypeError } from "@capnp-js/internal-error";
import { root } from "@capnp-js/memory";

import { anyShape, structShape, listShape, capShape } from "../../src/index";

test("`anyShape`", t => {
  t.plan(11);

  const segment = {
    id: 0,
    raw: new Uint8Array(0),
    end: 0,
  };

  const hi1 = 0x801a23b1;
  const p1 = {
    typeBits: 0x00,
    hi: hi1,
    object: {
      segment,
      position: 0,
    },
  };

  const hi2 = 0x131145a3;
  const p2 = {
    typeBits: 0x00,
    hi: hi2,
    object: {
      segment,
      position: 0,
    },
  };

  const p3 = {
    typeBits: 0x01,
    hi: 0x101a21b8,
    object: {
      segment,
      position: 0,
    },
  };

  const p4 = {
    typeBits: 0x01,
    hi: 0x32ba98c9,
    object: {
      segment,
      position: 0,
    },
  };

  const p5 = {
    typeBits: 0x01,
    hi: 0x19bc33aa,
    object: {
      segment,
      position: 0,
    },
  };

  const p6 = {
    typeBits: 0x01,
    hi: 0x2eff13ab,
    object: {
      segment,
      position: 0,
    },
  };

  const p7 = {
    typeBits: 0x01,
    hi: 0x089e776c,
    object: {
      segment,
      position: 0,
    },
  };

  const p8 = {
    typeBits: 0x01,
    hi: 0x1e43bced,
    object: {
      segment,
      position: 0,
    },
  };

  const p9 = {
    typeBits: 0x01,
    hi: 0x541e98fe,
    object: {
      segment,
      position: 0,
    },
  };

  const s10 = new Uint8Array(8);
  const hi10 = 0x3e10211e;
  int32(hi10, s10, 4);
  const p10 = {
    typeBits: 0x01,
    hi: 0x14ea29b7,
    object: {
      segment: {
        id: 0,
        raw: s10,
        end: 8,
      },
      position: 0,
    },
  };

  const p11 = {
    typeBits: 0x03,
    hi: 0x32abfe12,
    object: {
      segment,
      position: 0,
    },
  };

  t.deepEqual(anyShape(p1), {
    tag: "struct",
    data: hi1 & 0x0000ffff,
    pointers: hi1 >>> 16,
  });

  t.deepEqual(anyShape(p2), {
    tag: "struct",
    data: hi2 & 0x0000ffff,
    pointers: hi2 >>> 16,
  });

  t.deepEqual(anyShape(p3), {
    tag: "list",
    size: { tag: "void" },
  });

  t.deepEqual(anyShape(p4), {
    tag: "list",
    size: { tag: "1 bit" },
  });

  t.deepEqual(anyShape(p5), {
    tag: "list",
    size: { tag: "8 bit" },
  });

  t.deepEqual(anyShape(p6), {
    tag: "list",
    size: { tag: "16 bit" },
  });

  t.deepEqual(anyShape(p7), {
    tag: "list",
    size: { tag: "32 bit" },
  });

  t.deepEqual(anyShape(p8), {
    tag: "list",
    size: { tag: "64 bit" },
  });

  t.deepEqual(anyShape(p9), {
    tag: "list",
    size: { tag: "pointer" },
  });

  t.deepEqual(anyShape(p10), {
    tag: "list",
    size: {
      tag: "mixed",
      data: hi10 & 0x0000ffff,
      pointers: hi10 >>> 16,
    },
  });

  t.deepEqual(anyShape(p11), { tag: "cap" });
});

test("`structShape`", t => {
  t.plan(3);

  const arena = Builder.fresh(2040, new Unlimited());
  const segment = arena.allocate(2040).segment;

  int32(0 | 0x00, segment.raw, 0);
  int32((0x13<<16) | 0x2a, segment.raw, 4);
  t.deepEqual(structShape(arena, arena.pointer(root(arena))), {
    tag: "struct",
    data: 0x2a,
    pointers: 0x13,
  });

  int32(0 | 0x01, segment.raw, 0);
  int32(0, segment.raw, 4);
  t.throws(() => {
    structShape(arena, arena.pointer(root(arena)));
  }, PointerTypeError);
  //TODO: Handle the following within docs and my version management strategy.
  /* Ava's `instanceof` checking fails for `UnexpectedPointerType` here because
     the dev dependency carries around its own version of `core` with its own
     exception classes. Given an external project that uses `core` and
     `builder-arena`, however, that project's `builder-arena` will have the peer
     `core` to share with the project's uses, thereby avoiding this problem.
     Document this for users in the README, as the problem will pop up if the
     user specs a `core` version and a `builder-arena` version where the builder
     demands a distinct `core` from the user's. (My version management strategy
     may be able to prevent issues.) */

  int32(0 | 0x03, segment.raw, 0);
  int32(0, segment.raw, 4);
  t.throws(() => {
    structShape(arena, arena.pointer(root(arena)));
  }, PointerTypeError);
});

test("`listShape`", t => {
  t.plan(10);

  const arena = Builder.fresh(2040, new Unlimited());
  const segment = arena.allocate(2040).segment;

  int32(0 | 0x00, segment.raw, 0);
  int32((0x13<<16) | 0x2a, segment.raw, 4);
  t.throws(() => {
    listShape(arena, arena.pointer(root(arena)));
  }, PointerTypeError);

  int32(0 | 0x01, segment.raw, 0);
  int32(0x00, segment.raw, 4);
  t.deepEqual(listShape(arena, arena.pointer(root(arena))), {
    tag: "list",
    size: { tag: "void" },
  });

  int32(0 | 0x01, segment.raw, 0);
  int32(0x01, segment.raw, 4);
  t.deepEqual(listShape(arena, arena.pointer(root(arena))), {
    tag: "list",
    size: { tag: "1 bit" },
  });

  int32(0 | 0x01, segment.raw, 0);
  int32(0x02, segment.raw, 4);
  t.deepEqual(listShape(arena, arena.pointer(root(arena))), {
    tag: "list",
    size: { tag: "8 bit" },
  });

  int32(0 | 0x01, segment.raw, 0);
  int32(0x03, segment.raw, 4);
  t.deepEqual(listShape(arena, arena.pointer(root(arena))), {
    tag: "list",
    size: { tag: "16 bit" },
  });

  int32(0 | 0x01, segment.raw, 0);
  int32(0x04, segment.raw, 4);
  t.deepEqual(listShape(arena, arena.pointer(root(arena))), {
    tag: "list",
    size: { tag: "32 bit" },
  });

  int32(0 | 0x01, segment.raw, 0);
  int32(0x05, segment.raw, 4);
  t.deepEqual(listShape(arena, arena.pointer(root(arena))), {
    tag: "list",
    size: { tag: "64 bit" },
  });

  int32(0 | 0x01, segment.raw, 0);
  int32(0x06, segment.raw, 4);
  t.deepEqual(listShape(arena, arena.pointer(root(arena))), {
    tag: "list",
    size: { tag: "pointer" },
  });

  int32(0 | 0x01, segment.raw, 0);
  int32(((5*(0x10+0x09))<<3) | 0x07, segment.raw, 4);
  int32(5<<2, segment.raw, 8);
  int32((0x10<<16) | 0x09, segment.raw, 12);
  t.deepEqual(listShape(arena, arena.pointer(root(arena))), {
    tag: "list",
    size: {
      tag: "mixed",
      data: 0x09,
      pointers: 0x10,
    },
  });

  int32(0 | 0x03, segment.raw, 0);
  int32(0, segment.raw, 4);
  t.throws(() => {
    listShape(arena, arena.pointer(root(arena)));
  }, PointerTypeError);
});

test("`capShape`", t => {
  t.plan(3);

  const arena = Builder.fresh(2040, new Unlimited());
  const segment = arena.allocate(2040).segment;

  int32(0 | 0x00, segment.raw, 0);
  int32((0x13<<16) | 0x2a, segment.raw, 4);
  t.throws(() => {
    capShape(arena, arena.pointer(root(arena)));
  }, PointerTypeError);

  int32(0 | 0x01, segment.raw, 0);
  int32(0, segment.raw, 4);
  t.throws(() => {
    capShape(arena, arena.pointer(root(arena)));
  }, PointerTypeError);

  int32(0 | 0x03, segment.raw, 0);
  int32(0, segment.raw, 4);
  t.deepEqual(capShape(arena, arena.pointer(root(arena))), {
    tag: "cap",
  });
});
