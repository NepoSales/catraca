import { RecentIds } from './recent-ids';

/** Relógio de mentira: o teste decide quando o tempo passa. */
function setup(ttlMs = 1000, maxSize = 100) {
  let now = 0;
  const ids = new RecentIds(ttlMs, maxSize, () => now);
  return { ids, advance: (ms: number) => (now += ms) };
}

describe('RecentIds', () => {
  it('reconhece um id já visto', () => {
    const { ids } = setup();
    ids.add('bus-001:1');
    expect(ids.has('bus-001:1')).toBe(true);
    expect(ids.has('bus-001:2')).toBe(false);
  });

  it('esquece o id depois do prazo', () => {
    const { ids, advance } = setup(1000);
    ids.add('bus-001:1');
    advance(999);
    expect(ids.has('bus-001:1')).toBe(true);
    advance(1);
    expect(ids.has('bus-001:1')).toBe(false);
    expect(ids.size).toBe(0);
  });

  it('respeita o teto de memória descartando os mais antigos', () => {
    const { ids } = setup(1000, 2);
    ids.add('a');
    ids.add('b');
    ids.add('c');
    expect(ids.size).toBe(2);
    expect(ids.has('a')).toBe(false);
    expect(ids.has('c')).toBe(true);
  });

  it('renova o prazo de um id adicionado de novo', () => {
    const { ids, advance } = setup(1000);
    ids.add('a');
    ids.add('b');
    advance(900);
    ids.add('a');
    advance(600);
    // "a" foi renovado e continua valendo; "b" expirou. Se "a" tivesse ficado
    // no começo da fila, a limpeza pararia nele e "b" nunca seria removido.
    expect(ids.has('a')).toBe(true);
    expect(ids.has('b')).toBe(false);
  });
});
