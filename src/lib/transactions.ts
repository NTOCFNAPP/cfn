export type Transaction = {
  id: string | number;
  data: string;
  cargo: string;
  categoria: string;
  favorecido: string;
  valor: number;
  descricao: string;
  origem: string;
  ciaAerea?: string;
  totalTarifas?: number;
  origemDestino?: string;
  valorTotalDespesas?: number;
  raw?: any;
};

export const transactions: Transaction[] = [
  {
    id: 1,
    data: "2024-05-10",
    cargo: "Conselheiro Federal",
    categoria: "Diárias e Passagens",
    favorecido: "Servidor Público X",
    valor: 1250.0,
    descricao: "Participação em Reunião Plenária Ordinária em Brasília",
    origem: "Sistema de Diárias (SCDP)",
  },
  {
    id: 2,
    data: "2024-05-12",
    cargo: "Diretoria Executiva",
    categoria: "Serviços de Terceiros",
    favorecido: "SoftPlan Sistemas",
    valor: 45000.0,
    descricao: "Manutenção mensal do portal de serviços ao nutricionista",
    origem: "Contrato de Prestação de Serviços TI",
  },
  {
    id: 3,
    data: "2024-05-15",
    cargo: "Assessoria Técnica",
    categoria: "Eventos e Capacitação",
    favorecido: "Hotel Nacional",
    valor: 8900.0,
    descricao: "Locação de espaço para workshop de atualização profissional",
    origem: "Nota de Empenho - Eventos",
  },
];
