const TPM_LIMIT = 10000;
const MAX_CONCURRENT = 2;

let tokensUsed = 0;
let windowStart = Date.now();
let inFlight = 0;

export async function acquire(tokensNeeded) {
  while (true) {
    const now = Date.now();

    // Reset token window
    if (now - windowStart >= 60000) {
      tokensUsed = 0;
      windowStart = now;
    }

    if (inFlight < MAX_CONCURRENT &&
        tokensUsed + tokensNeeded <= TPM_LIMIT) {
      inFlight++;
      tokensUsed += tokensNeeded;
      return;
    }

    await new Promise(res => setTimeout(res, 25));
  }
}

export function release() {
  inFlight = Math.max(0, inFlight - 1);
}
