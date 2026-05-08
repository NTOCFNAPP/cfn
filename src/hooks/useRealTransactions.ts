import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { type Transaction } from "@/lib/transactions";

export function useRealTransactions() {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRealData = async () => {
    try {
      setLoading(true);
      const { data: passagens, error: pError } = await supabase
        .from("viagens_passagens")
        .select("*");
      
      const { data: deslocamentos, error: dError } = await supabase
        .from("diarias_deslocamentos")
        .select("*");

      if (pError) console.error("Erro passagens:", pError);
      if (dError) console.error("Erro deslocamentos:", dError);

      const findVal = (obj: Record<string, unknown>, patterns: string[]): unknown => {
        if (!obj) return null;
        const keys = Object.keys(obj);
        const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
        for (const p of patterns) {
          const np = normalize(p);
          const found = keys.find(k => normalize(k) === np);
          if (found && obj[found] !== null && obj[found] !== undefined) return obj[found];
        }
        for (const p of patterns) {
          const np = normalize(p);
          const found = keys.find(k => normalize(k).includes(np));
          if (found && obj[found] !== null && obj[found] !== undefined) return obj[found];
        }
        return null;
      };

      const parseValue = (obj: Record<string, unknown>, keys: string[]): number => {
        const _parse = (raw: unknown): number => {
          if (raw === null || raw === undefined || raw === "") return 0;
          if (typeof raw === "number") return raw;
          let clean = String(raw).replace(/[^\d.,-]/g, "").trim();
          if (!clean) return 0;
          if (clean.includes(",") && clean.includes(".")) {
            return parseFloat(clean.replace(/\./g, "").replace(",", "."));
          }
          if (clean.includes(",")) {
            return parseFloat(clean.replace(",", "."));
          }
          const parsed = parseFloat(clean);
          return isNaN(parsed) ? 0 : parsed;
        };
        for (const k of keys) {
          const val = findVal(obj, [k]);
          const num = _parse(val);
          if (num > 0) return num;
        }
        return _parse(findVal(obj, keys));
      };

      const parseCargo = (obj: Record<string, unknown>, keys: string[]): string => {
        const val = findVal(obj, keys);
        if (!val) return "Colaborador";
        const s = String(val).trim();
        if (/^[\d,.-]+$/.test(s) || s.length < 2) return "Colaborador";
        return s;
      };

      const parseDate = (obj: Record<string, unknown>, keys: string[]): string => {
        const raw = findVal(obj, keys);
        if (!raw) return new Date().toISOString();
        const str = String(raw);
        if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str;
        const match = str.match(/(\d{2})\/(\d{2})\/(\d{4})/);
        if (match) return `${match[3]}-${match[2]}-${match[1]}`;
        return new Date(str).toISOString();
      };

      const mappedPassagens: Transaction[] = (passagens || []).map((p: Record<string, unknown>) => {
        const totalDespesas = parseValue(p, ["ValorTotalDespesas", "ValorTotal", "Valor"]);
        const tarifas = parseValue(p, ["TotalTarifas", "Tarifa", "Valor"]);
        return {
          id: String(findVal(p, ["Id", "IdProcesso", "id_pk", "IdProcessoPassagem"]) || `p-${Math.random()}`),
          data: parseDate(p, ["DataIdaEVoltaFormatada", "DataHoraIda"]),
          cargo: parseCargo(p, ["TipoPassageiro", "Cargo", "Ocupacao"]),
          categoria: `Passagem: ${findVal(p, ["CiaAerea", "Companhia"]) || "Aérea"}`,
          favorecido: String(findVal(p, ["NomePassageiro", "Nome"]) || "Anônimo"),
          valor: totalDespesas || tarifas || 0,
          descricao: String(findVal(p, ["NomeEventoFormatado", "Descricao"]) || "Viagem institucional"),
          origem: String(findVal(p, ["CodigoProcesso", "Num_Processo"]) || "Processo N/A"),
          ciaAerea: String(findVal(p, ["CiaAerea", "Companhia"]) || ""),
          totalTarifas: tarifas,
          origemDestino: String(findVal(p, ["OrigemDestinoFormatado", "Rota"]) || ""),
          valorTotalDespesas: totalDespesas,
          raw: p
        };
      });

      const mappedDeslocamentos: Transaction[] = (deslocamentos || []).map((d: Record<string, unknown>) => {
        const totalDespesas = parseValue(d, ["ValorTotalDespesas", "ValorTotal", "Valor"]);
        const diarias = parseValue(d, ["Diaria", "vl_diaria", "Valor"]);
        return {
          id: String(findVal(d, ["Id", "id", "id_pk"]) || `d-${Math.random()}`),
          data: parseDate(d, ["DataHoraIda", "Data"]),
          cargo: parseCargo(d, ["TipoPassageiro", "Cargo", "Vinculo"]),
          categoria: "Deslocamento / Diária",
          favorecido: String(findVal(d, ["NomePassageiro", "Nome"]) || "Anônimo"),
          valor: totalDespesas || diarias || 0,
          descricao: String(findVal(d, ["NomeDespesaPadrao", "Motivo", "Descricao"]) || "Despesas de deslocamento"),
          origem: String(findVal(d, ["NomeEventoFormatado", "Evento"]) || "Evento N/A"),
          valorTotalDespesas: totalDespesas || diarias,
          raw: d
        };
      });

      const combined = [...mappedPassagens, ...mappedDeslocamentos].sort(
        (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
      );

      setAllTransactions(combined);
    } catch (error) {
      console.error("Erro dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealData();
  }, []);

  return { allTransactions, loading, fetchRealData };
}
