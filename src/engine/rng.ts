import CryptoJS from 'crypto-js';

const MASK_64 = 0xffffffffffffffffn;
const GOLDEN_RATIO_64 = 0x9e3779b97f4a7c15n;
const XOR_SEED_64 = 0x6a09e667f3bcc909n;

function rotateLeft(val: bigint, n: bigint): bigint {
  val &= MASK_64;
  return ((val << n) | (val >> (64n - n))) & MASK_64;
}

function initXoroshiro128PlusPlus(lo: bigint, hi: bigint): { lo: bigint; hi: bigint } {
  lo &= MASK_64;
  hi &= MASK_64;
  if ((lo | hi) === 0n) {
    lo = GOLDEN_RATIO_64;
    hi = XOR_SEED_64;
  }
  return { lo, hi };
}

export class Xoroshiro128PlusPlus {
  seedLo: bigint;
  seedHi: bigint;

  constructor(lo: bigint, hi: bigint) {
    const init = initXoroshiro128PlusPlus(lo, hi);
    this.seedLo = init.lo;
    this.seedHi = init.hi;
  }

  nextLong(): bigint {
    const s0 = this.seedLo;
    let s1 = this.seedHi;

    const result = (rotateLeft(s0 + s1, 17n) + s0) & MASK_64;
    s1 = (s1 ^ s0) & MASK_64;
    this.seedLo = (rotateLeft(s0, 49n) ^ s1 ^ (s1 << 21n)) & MASK_64;
    this.seedHi = rotateLeft(s1, 28n);

    return result;
  }

  nextInt(): number {
    const val = Number(this.nextLong() & 0xffffffffn);
    return val;
  }

  nextIntBound(bound: number): number {
    if (bound <= 0) {
      throw new Error('Bound must be positive');
    }

    let val = BigInt(this.nextInt());
    let prod = val * BigInt(bound);
    let low = prod & 0xffffffffn;

    if (low < BigInt(bound)) {
      const threshold = (0x100000000n - BigInt(bound)) % BigInt(bound);
      while (low < threshold) {
        val = BigInt(this.nextInt());
        prod = val * BigInt(bound);
        low = prod & 0xffffffffn;
      }
    }

    return Number(prod >> 32n);
  }
}

/**
 * StaffordMix13 mixer function for 64-bit integers.
 */
export function staffordMix13(z: bigint): bigint {
  z = z & MASK_64;
  z = ((z ^ (z >> 30n)) * 0xbf58476d1ce4e5b9n) & MASK_64;
  z = ((z ^ (z >> 27n)) * 0x94d049bb133111ebn) & MASK_64;
  return (z ^ (z >> 31n)) & MASK_64;
}

/**
 * Convert string or number world seed into a 64-bit BigInt seed.
 */
export function parseWorldSeed(input: string | number): bigint {
  if (typeof input === 'number') {
    return BigInt(Math.floor(input)) & MASK_64;
  }
  const str = input.trim();
  if (!str) return 0n;
  
  if (/^-?\d+$/.test(str)) {
    try {
      return BigInt(str) & MASK_64;
    } catch {
      // Fallback
    }
  }

  // Java String.hashCode() emulation
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return BigInt(hash) & MASK_64;
}

/**
 * Upgrade 64-bit seed into 128-bit parent seed (lo, hi).
 */
export function upgradeSeedTo128bit(seed: bigint): { lo: bigint; hi: bigint } {
  const seedLo = (seed ^ XOR_SEED_64) & MASK_64;
  const seedHi = (seedLo + GOLDEN_RATIO_64) & MASK_64;
  return {
    lo: staffordMix13(seedLo),
    hi: staffordMix13(seedHi),
  };
}

const recipeHashCache = new Map<string, { lo: bigint; hi: bigint }>();
const targetProgressCache = new Map<string, number>();

/**
 * Hash Recipe ID using MD5 and split into 64-bit lo & hi BigInts (Big Endian).
 */
export function hashRecipeId(recipeId: string): { lo: bigint; hi: bigint } {
  const existing = recipeHashCache.get(recipeId);
  if (existing) return existing;

  const md5Hex = CryptoJS.MD5(recipeId).toString(CryptoJS.enc.Hex);
  const loHex = md5Hex.substring(0, 16);
  const hiHex = md5Hex.substring(16, 32);
  
  const result = {
    lo: BigInt('0x' + loHex) & MASK_64,
    hi: BigInt('0x' + hiHex) & MASK_64,
  };
  recipeHashCache.set(recipeId, result);
  return result;
}

/**
 * Calculate the TFC Anvil target progress value from World Seed & Recipe ID.
 * Returns an integer value between 40 and 113 (40 + nextInt(74)).
 */
export function calculateTargetProgress(worldSeedInput: string | number, recipeId: string): number {
  const cacheKey = `${worldSeedInput}:${recipeId}`;
  const cached = targetProgressCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const seed = parseWorldSeed(worldSeedInput);
  const parentSeeds = upgradeSeedTo128bit(seed);
  const parentRng = new Xoroshiro128PlusPlus(parentSeeds.lo, parentSeeds.hi);

  // forkPositional()
  const forkLo = parentRng.nextLong();
  const forkHi = parentRng.nextLong();

  // MD5 of recipe ID
  const recipeHash = hashRecipeId(recipeId);

  // recipe PRNG
  const recipeRng = new Xoroshiro128PlusPlus(recipeHash.lo ^ forkLo, recipeHash.hi ^ forkHi);

  const result = 40 + recipeRng.nextIntBound(74);
  targetProgressCache.set(cacheKey, result);
  return result;
}

export async function calculateTargetProgressAsync(worldSeedInput: string | number, recipeId: string): Promise<number> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(calculateTargetProgress(worldSeedInput, recipeId));
    }, 0);
  });
}
