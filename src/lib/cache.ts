/**
 * Cache Service - Implementación simple con expiración
 * Para categorías y datos estáticos
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class Cache {
  private store = new Map<string, CacheEntry<unknown>>();
  private timers = new Map<string, NodeJS.Timeout>();

  /**
   * Obtener valor del caché
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    if (Date.now() >= entry.expiresAt) {
      this.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Guardar valor en caché con TTL
   * @param key Clave del caché
   * @param data Datos a guardar
   * @param ttlMs TTL en milisegundos (default: 5 minutos)
   */
  set<T>(key: string, data: T, ttlMs = 5 * 60 * 1000): void {
    // Limpiar timer anterior si existe
    const oldTimer = this.timers.get(key);
    if (oldTimer) {
      clearTimeout(oldTimer);
    }

    const expiresAt = Date.now() + ttlMs;
    this.store.set(key, { data, expiresAt });

    // Configurar timer para limpiar automáticamente
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttlMs);

    this.timers.set(key, timer);
  }

  /**
   * Obtener o calcular (lazy loading)
   */
  async getOrCompute<T>(
    key: string,
    compute: () => Promise<T>,
    ttlMs?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await compute();
    this.set(key, data, ttlMs);
    return data;
  }

  /**
   * Eliminar entrada del caché
   */
  delete(key: string): void {
    this.store.delete(key);
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
  }

  /**
   * Limpiar todo el caché
   */
  clear(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.store.clear();
    this.timers.clear();
  }

  /**
   * Invalidar caché
   */
  invalidate(pattern: string): void {
    const regex = new RegExp(pattern);
    const keysToDelete = Array.from(this.store.keys()).filter((key) =>
      regex.test(key)
    );

    for (const key of keysToDelete) {
      this.delete(key);
    }
  }

  /**
   * Obtener tamaño del caché
   */
  size(): number {
    return this.store.size;
  }
}

// Singleton global
export const cache = new Cache();
