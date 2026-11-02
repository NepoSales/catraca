import { bearingDeg, distanceM, Route } from './route';

// Pontos na linha do equador: 0,001° de longitude ≈ 111,2 m.
const A = { lat: 0, lon: 0 };
const B = { lat: 0, lon: 0.001 };
const C = { lat: 0.001, lon: 0.001 };

describe('distanceM', () => {
  it('calcula a distância entre dois pontos', () => {
    expect(distanceM(A, B)).toBeCloseTo(111.2, 0);
  });

  it('é zero para o mesmo ponto', () => {
    expect(distanceM(A, A)).toBe(0);
  });
});

describe('bearingDeg', () => {
  it.each([
    ['norte', A, { lat: 0.001, lon: 0 }, 0],
    ['leste', A, B, 90],
    ['sul', { lat: 0.001, lon: 0 }, A, 180],
    ['oeste', B, A, 270],
  ])('aponta para o %s', (_, from, to, expected) => {
    expect(bearingDeg(from, to)).toBeCloseTo(expected, 3);
  });
});

describe('Route', () => {
  const route = new Route('teste', [A, B, C]);
  const segmentM = distanceM(A, B);

  it('mede ida e volta', () => {
    expect(route.lengthM).toBeCloseTo(4 * segmentM, 3);
  });

  it('começa no primeiro ponto', () => {
    expect(route.pointAt(0)).toMatchObject({ lat: 0, lon: 0, heading: 90 });
  });

  it('interpola no meio do trecho', () => {
    const p = route.pointAt(segmentM / 2);
    expect(p.lat).toBeCloseTo(0, 6);
    expect(p.lon).toBeCloseTo(0.0005, 6);
  });

  it('vira no ponto seguinte', () => {
    expect(route.pointAt(segmentM * 1.5).heading).toBeCloseTo(0, 3);
  });

  it('volta pelo mesmo caminho', () => {
    const p = route.pointAt(segmentM * 2.5);
    expect(p.lon).toBeCloseTo(0.001, 6);
    expect(p.heading).toBeCloseTo(180, 3);
  });

  it('recomeça depois de completar a volta', () => {
    const p = route.pointAt(route.lengthM + segmentM / 2);
    expect(p.lon).toBeCloseTo(0.0005, 6);
  });

  it('exige pelo menos dois pontos', () => {
    expect(() => new Route('curta', [A])).toThrow();
  });
});
