"use client";

import { useState } from "react";

// [from, to] in Unix seconds covering the last `days` days, fixed when the page opens.
export function useRange(days: number) {
  const [to] = useState(() => Math.floor(Date.now() / 1000));
  return { from: to - days * 86400, to };
}
