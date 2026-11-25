-- Migración personalizada creada con `drizzle-kit generate --custom` (ADR-075: Drizzle Kit es la única autoridad).
-- P0 del 21/11/2026 (persistencia, secciones 7.9 y 10.2). Drizzle ORM no modela EXCLUDE ni CONSTRAINT TRIGGER;
-- por eso viven aquí y el esquema TypeScript solo los referencia por nombre.
--
-- 1) Garantía en PostgreSQL contra periodos de recursos superpuestos: para un mismo usuario y recurso no pueden
--    coexistir dos rangos [period_start, period_end) que se crucen, aunque dos transacciones lo intenten a la vez.
--    btree_gist es una extensión «trusted» (PostgreSQL 13+), disponible en Neon y en la imagen local.
CREATE EXTENSION IF NOT EXISTS btree_gist;
--> statement-breakpoint
ALTER TABLE "m5_billing"."resource_balances" ADD CONSTRAINT "rb_periodos_sin_solape_ex"
  EXCLUDE USING gist ("user_id" WITH =, "resource_code" WITH =, daterange("period_start", "period_end", '[)') WITH &&);
--> statement-breakpoint
-- 2) Coherencia saldo = libro, comprobada por la base al hacer COMMIT (restricción diferida). Cualquier transacción
--    que cambie un saldo sin su movimiento, o registre un movimiento sin cambiar el saldo, se rechaza entera.
--    Reglas idénticas a `saldoDesdeLibro` (dominio de M5):
--      reservado = Σ RESERVA − Σ CONFIRMACION − Σ LIBERACION
--      consumido = Σ CONFIRMACION − Σ REINTEGRO
--      extra     = Σ CONCESION
--    AJUSTE no tiene efecto definido todavía: cuando lo tenga, esta función y `saldoDesdeLibro` cambian juntas.
CREATE FUNCTION "m5_billing"."verificar_saldo_con_libro"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  s record;
  l record;
BEGIN
  SELECT reserved, consumed, granted_extra INTO s
  FROM "m5_billing"."resource_balances"
  WHERE user_id = NEW.user_id AND period_start = NEW.period_start AND resource_code = NEW.resource_code;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  SELECT
    COALESCE(SUM(CASE entry_type WHEN 'RESERVA' THEN quantity WHEN 'CONFIRMACION' THEN -quantity WHEN 'LIBERACION' THEN -quantity ELSE 0 END), 0) AS reservado,
    COALESCE(SUM(CASE entry_type WHEN 'CONFIRMACION' THEN quantity WHEN 'REINTEGRO' THEN -quantity ELSE 0 END), 0) AS consumido,
    COALESCE(SUM(CASE entry_type WHEN 'CONCESION' THEN quantity ELSE 0 END), 0) AS extra
  INTO l
  FROM "m5_billing"."resource_ledger_entries"
  WHERE user_id = NEW.user_id AND period_start = NEW.period_start AND resource_code = NEW.resource_code;
  IF s.reserved <> l.reservado OR s.consumed <> l.consumido OR s.granted_extra <> l.extra THEN
    RAISE EXCEPTION 'Saldo de recursos incoherente con el libro (recurso %, periodo %): reservado % / libro %, consumido % / libro %, extra % / libro %.',
      NEW.resource_code, NEW.period_start, s.reserved, l.reservado, s.consumed, l.consumido, s.granted_extra, l.extra
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  RETURN NULL;
END;
$$;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER "rb_coherente_con_libro" AFTER INSERT OR UPDATE ON "m5_billing"."resource_balances"
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "m5_billing"."verificar_saldo_con_libro"();
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER "rle_coherente_con_saldo" AFTER INSERT ON "m5_billing"."resource_ledger_entries"
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "m5_billing"."verificar_saldo_con_libro"();
