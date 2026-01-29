import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { cidrToRange, candidateSubnets, nextCursorIp } from "./cidr.js";

describe("utils/cidr", () => {
  it("cidrToRange retorna início e fim do range", () => {
    const range = cidrToRange("10.0.0.0/30");
    assert.equal(range.start, 167772160n);
    assert.equal(range.end, 167772163n);
  });

  it("candidateSubnets respeita cursor e wrap-around", () => {
    const candidates = Array.from(candidateSubnets("10.0.0.0/29", "10.0.0.5", 30));
    assert.deepEqual(candidates, ["10.0.0.4/30", "10.0.0.0/30"]);
  });

  it("nextCursorIp faz wrap quando passa do fim do pool", () => {
    const next = nextCursorIp("10.0.0.0/30", "10.0.0.0/30", 30);
    assert.equal(next, "10.0.0.1");
  });
});
