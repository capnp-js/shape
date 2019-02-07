/* @flow */

import * as assert from "assert";
import { describe, it } from "mocha";

import { Unlimited } from "@capnp-js/base-arena";
import { Builder } from "@capnp-js/builder-arena";
import { PointerTypeError } from "@capnp-js/internal-error";
import { root } from "@capnp-js/memory";
import { int32 } from "@capnp-js/write-data";

import { anyShape, structShape, listShape, capShape } from "../../src/index";

describe("anyShape", function () {
  const segment = { id: 0, raw: new Uint8Array(0), end: 0 };

  it("decodes a struct shape from pointer", function () {
    const hi = 0x801a23b1;
    const p = {
      typeBits: 0x00,
      hi,
      object: {
        segment,
        position: 0,
      },
    };
    assert.deepEqual(anyShape(p), {
      tag: "struct",
      data: hi & 0x0000ffff,
      pointers: hi >>> 16,
    });
  });

  it("decodes another struct shape from pointer", function () {
    const hi = 0x131145a3;
    const p = {
      typeBits: 0x00,
      hi,
      object: {
        segment,
        position: 0,
      },
    };
    assert.deepEqual(anyShape(p), {
      tag: "struct",
      data: hi & 0x0000ffff,
      pointers: hi >>> 16,
    });
  });


  it("decodes a nonbool 0x00 list shape from pointer", function () {
    const p = {
      typeBits: 0x01,
      hi: 0x101a21b8,
      object: {
        segment,
        position: 0,
      },
    };
    assert.deepEqual(anyShape(p), {
      tag: "list",
      size: { tag: "void" },
    });
  });

  it("decodes a bool list shape from pointer", function () {
    const p = {
      typeBits: 0x01,
      hi: 0x32ba98c9,
      object: {
        segment,
        position: 0,
      },
    };
    assert.deepEqual(anyShape(p), {
      tag: "list",
      size: { tag: "1 bit" },
    });
  });

  it("decodes a nonbool 0x02 list shape from pointer", function () {
    const p = {
      typeBits: 0x01,
      hi: 0x19bc33aa,
      object: {
        segment,
        position: 0,
      },
    };
    assert.deepEqual(anyShape(p), {
      tag: "list",
      size: { tag: "8 bit" },
    });
  });

  it("decodes a nonbool 0x03 list shape from pointer", function () {
    const p = {
      typeBits: 0x01,
      hi: 0x2eff13ab,
      object: {
        segment,
        position: 0,
      },
    };
    assert.deepEqual(anyShape(p), {
      tag: "list",
      size: { tag: "16 bit" },
    });
  })

  it("decodes a nonbool 0x04 list shape from pointer", function () {
    const p = {
      typeBits: 0x01,
      hi: 0x089e776c,
      object: {
        segment,
        position: 0,
      },
    };
    assert.deepEqual(anyShape(p), {
      tag: "list",
      size: { tag: "32 bit" },
    });
  });

  it("decodes a nonbool 0x05 list shape from pointer", function () {
    const p = {
      typeBits: 0x01,
      hi: 0x1e43bced,
      object: {
        segment,
        position: 0,
      },
    };
    assert.deepEqual(anyShape(p), {
      tag: "list",
      size: { tag: "64 bit" },
    });
  });

  it("decodes a nonbool 0x06 list shape from pointer", function () {
    const p = {
      typeBits: 0x01,
      hi: 0x541e98fe,
      object: {
        segment,
        position: 0,
      },
    };
    assert.deepEqual(anyShape(p), {
      tag: "list",
      size: { tag: "pointer" },
    });
  });

  it("decodes a nonbool 0x07 list shape from pointer", function () {
    const segment = { id: 0, raw: new Uint8Array(8), end: 8 };
    const hi = 0x3e10211e;
    int32(hi, segment.raw, 4);
    const p = {
      typeBits: 0x01,
      hi: 0x14ea29b7,
      object: {
        segment,
        position: 0,
      },
    };
    assert.deepEqual(anyShape(p), {
      tag: "list",
      size: {
        tag: "mixed",
        data: hi & 0x0000ffff,
        pointers: hi >>> 16,
      },
    });
  });

  it("decodes a capability shape from pointer", function () {
    const p = {
      typeBits: 0x03,
      hi: 0x32abfe12,
      object: {
        segment,
        position: 0,
      },
    };
    assert.deepEqual(anyShape(p), { tag: "cap" });
  });
});

describe("structShape", function () {
  const arena = Builder.fresh(2040, new Unlimited());
  const segment = arena.allocate(2040).segment;

  it("decodes a struct shape from pointer", function () {
    int32(0 | 0x00, segment.raw, 0);
    int32((0x13<<16) | 0x2a, segment.raw, 4);
    assert.deepEqual(structShape(arena, arena.pointer(root(arena))), {
      tag: "struct",
      data: 0x2a,
      pointers: 0x13,
    });
  });

  it("rejects list pointers", function () {
    int32(0 | 0x01, segment.raw, 0);
    int32(0, segment.raw, 4);
    assert.throws(() => {
      structShape(arena, arena.pointer(root(arena)));
    }, PointerTypeError);
    //TODO: Handle the following within docs and my version management strategy.
    /* Ava's `instanceof` checking fails for `UnexpectedPointerType` here
       because the dev dependency carries around its own version of `core` with
       its own exception classes. Given an external project that uses `core` and
       `builder-arena`, however, that project's `builder-arena` will have the
       peer `core` to share with the project's uses, thereby avoiding this
       problem. Document this for users in the README, as the problem will pop
       up if the user specs a `core` version and a `builder-arena` version where
       the builder demands a distinct `core` from the user's. (My version
       management strategy may be able to prevent issues.) */
  });

  //TODO: What about far pointers?
  it("rejects capability pointers", function () {
    int32(0 | 0x03, segment.raw, 0);
    int32(0, segment.raw, 4);
    assert.throws(() => {
      structShape(arena, arena.pointer(root(arena)));
    }, PointerTypeError);
  });
});

describe("listShape", function () {
  const arena = Builder.fresh(2040, new Unlimited());
  const segment = arena.allocate(2040).segment;

  it("rejects struct pointers", function () {
    int32(0 | 0x00, segment.raw, 0);
    int32((0x13<<16) | 0x2a, segment.raw, 4);
    assert.throws(() => {
      listShape(arena, arena.pointer(root(arena)));
    }, PointerTypeError);
  });

  it("decodes a nonbool 0x00 list shape from pointer", function () {
    int32(0 | 0x01, segment.raw, 0);
    int32(0x00, segment.raw, 4);
    assert.deepEqual(listShape(arena, arena.pointer(root(arena))), {
      tag: "list",
      size: { tag: "void" },
    });
  });

  it("decodes a bool list shape from pointer", function () {
    int32(0 | 0x01, segment.raw, 0);
    int32(0x01, segment.raw, 4);
    assert.deepEqual(listShape(arena, arena.pointer(root(arena))), {
      tag: "list",
      size: { tag: "1 bit" },
    });
  });

  it("decodes a nonbool 0x02 list shape from pointer", function () {
    int32(0 | 0x01, segment.raw, 0);
    int32(0x02, segment.raw, 4);
    assert.deepEqual(listShape(arena, arena.pointer(root(arena))), {
      tag: "list",
      size: { tag: "8 bit" },
    });
  });

  it("decodes a nonbool 0x03 list shape from pointer", function () {
    int32(0 | 0x01, segment.raw, 0);
    int32(0x03, segment.raw, 4);
    assert.deepEqual(listShape(arena, arena.pointer(root(arena))), {
      tag: "list",
      size: { tag: "16 bit" },
    });
  });

  it("decodes a nonbool 0x04 list shape from pointer", function () {
    int32(0 | 0x01, segment.raw, 0);
    int32(0x04, segment.raw, 4);
    assert.deepEqual(listShape(arena, arena.pointer(root(arena))), {
      tag: "list",
      size: { tag: "32 bit" },
    });
  });

  it("decodes a nonbool 0x05 list shape from pointer", function () {
    int32(0 | 0x01, segment.raw, 0);
    int32(0x05, segment.raw, 4);
    assert.deepEqual(listShape(arena, arena.pointer(root(arena))), {
      tag: "list",
      size: { tag: "64 bit" },
    });
  });

  it("decodes a nonbool 0x06 list shape from pointer", function () {
    int32(0 | 0x01, segment.raw, 0);
    int32(0x06, segment.raw, 4);
    assert.deepEqual(listShape(arena, arena.pointer(root(arena))), {
      tag: "list",
      size: { tag: "pointer" },
    });
  });

  it("decodes a nonbool 0x07 list shape from pointer", function () {
    int32(0 | 0x01, segment.raw, 0);
    int32(((5*(0x10+0x09))<<3) | 0x07, segment.raw, 4);
    int32(5<<2, segment.raw, 8);
    int32((0x10<<16) | 0x09, segment.raw, 12);
    assert.deepEqual(listShape(arena, arena.pointer(root(arena))), {
      tag: "list",
      size: {
        tag: "mixed",
        data: 0x09,
        pointers: 0x10,
      },
    });
  });

  it("rejects capability pointers", function () {
    int32(0 | 0x03, segment.raw, 0);
    int32(0, segment.raw, 4);
    assert.throws(() => {
      listShape(arena, arena.pointer(root(arena)));
    }, PointerTypeError);
  });
});

describe("capShape", function () {
  const arena = Builder.fresh(2040, new Unlimited());
  const segment = arena.allocate(2040).segment;

  it("rejects struct pointers", function () {
    int32(0 | 0x00, segment.raw, 0);
    int32((0x13<<16) | 0x2a, segment.raw, 4);
    assert.throws(() => {
      capShape(arena, arena.pointer(root(arena)));
    }, PointerTypeError);
  });

  it("rejects list pointers", function () {
    int32(0 | 0x01, segment.raw, 0);
    int32(0, segment.raw, 4);
    assert.throws(() => {
      capShape(arena, arena.pointer(root(arena)));
    }, PointerTypeError);
  });

  it("decodes a capability shape from pointer", function () {
    int32(0 | 0x03, segment.raw, 0);
    int32(0, segment.raw, 4);
    assert.deepEqual(capShape(arena, arena.pointer(root(arena))), {
      tag: "cap",
    });
  });
});
