/**
 * Lembra os ids vistos recentemente, para descartar mensagens repetidas.
 *
 * Fica só na memória: é um filtro barato para as repetições mais comuns
 * (o broker MQTT reentregando uma mensagem com QoS 1), não uma garantia.
 * Os consumidores do Kafka também descartam pelo eventId.
 *
 * O Map do JavaScript mantém a ordem de inserção, então os ids mais antigos
 * estão sempre no começo; limpar é só remover do começo até achar um válido.
 */
export class RecentIds {
  private readonly seenAt = new Map<string, number>();

  constructor(
    private readonly ttlMs: number,
    /** Teto de memória: passou disso, os mais antigos saem mesmo antes de expirar. */
    private readonly maxSize: number,
    private readonly now: () => number = Date.now,
  ) {}

  has(id: string): boolean {
    this.evictExpired();
    return this.seenAt.has(id);
  }

  add(id: string): void {
    this.seenAt.delete(id); // reinserir move para o fim
    this.seenAt.set(id, this.now());
    while (this.seenAt.size > this.maxSize) {
      this.seenAt.delete(this.seenAt.keys().next().value!);
    }
  }

  get size(): number {
    return this.seenAt.size;
  }

  private evictExpired(): void {
    const limit = this.now() - this.ttlMs;
    for (const [id, at] of this.seenAt) {
      if (at > limit) break;
      this.seenAt.delete(id);
    }
  }
}
