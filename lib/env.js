const INTEGRATION_PREFIX = "SPACEKAYSONKELLY_";

export function env(name) {
  return process.env[`${INTEGRATION_PREFIX}${name}`] ?? process.env[name];
}
