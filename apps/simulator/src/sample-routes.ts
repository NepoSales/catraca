import { Route } from './route';

/**
 * Traçados provisórios, com coordenadas aproximadas de avenidas de São Paulo.
 * Servem só para o simulador funcionar antes do import do GTFS (passo 7);
 * depois disso, as rotas virão das linhas reais.
 */
export const SAMPLE_ROUTES: Route[] = [
  new Route('paulista', [
    { lat: -23.5567, lon: -46.6623 }, // Consolação
    { lat: -23.5614, lon: -46.6559 }, // MASP
    { lat: -23.5646, lon: -46.6521 }, // Brigadeiro
    { lat: -23.5712, lon: -46.644 }, // Paraíso
  ]),
  new Route('faria-lima', [
    { lat: -23.5672, lon: -46.6935 }, // Largo da Batata
    { lat: -23.5739, lon: -46.6898 }, // Rebouças
    { lat: -23.5806, lon: -46.6857 }, // Cidade Jardim
    { lat: -23.5868, lon: -46.6818 }, // Juscelino Kubitschek
  ]),
];
