export function logCost(usage) {
  console.log("Tokens used:", usage);
}

export function killSwitch() {
  return process.env.LLM_DISABLED === "true";
}
