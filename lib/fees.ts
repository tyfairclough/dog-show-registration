/** Per-dog fee for a splash pool session (10 minutes). */
export const SPLASH_POOL_FEE_PER_DOG = 5;

export function countSplashPoolDogs(
  dogs: ReadonlyArray<
    { activity_splash_pool?: number } | { activities: { splashPool: boolean } }
  >
): number {
  return dogs.filter((dog) => {
    if ("activities" in dog) return dog.activities.splashPool;
    return dog.activity_splash_pool === 1;
  }).length;
}

export function totalSplashPoolFees(
  dogs: Parameters<typeof countSplashPoolDogs>[0]
): number {
  return countSplashPoolDogs(dogs) * SPLASH_POOL_FEE_PER_DOG;
}

export function toFeeNumber(fee: number | string | unknown): number {
  const feeNumber = typeof fee === "number" ? fee : Number(fee ?? 0);
  return Number.isFinite(feeNumber) ? feeNumber : 0;
}
