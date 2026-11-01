-- Um database por serviço, todos na mesma instância.
-- Nenhum serviço acessa o database de outro.

CREATE DATABASE tracking;
CREATE DATABASE cadastros;
CREATE DATABASE infracoes;
CREATE DATABASE alertas;

-- PostGIS só onde há geometria (posições, traçados, paradas).
\connect tracking
CREATE EXTENSION IF NOT EXISTS postgis;

\connect cadastros
CREATE EXTENSION IF NOT EXISTS postgis;
