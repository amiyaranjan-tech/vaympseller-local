// Thrown by every feature api stub below — a loud failure if a screen
// accidentally wires up a call before the real backend contract lands,
// instead of a silent TODO that's easy to forget.
export class NotImplementedError extends Error {
  constructor(endpoint: string) {
    super(`${endpoint} is not implemented yet — backend contract pending.`);
    this.name = 'NotImplementedError';
  }
}
