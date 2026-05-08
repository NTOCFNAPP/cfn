export type Alert = {
  id: number;
  categoria: string;
  variacao_percentual: string;
  valor_anterior: number;
  valor_atual: number;
  tendencia: "alta" | "baixa";
  mensagem: string;
};

export const alerts: Alert[] = [
  {
    id: 1,
    categoria: "Publicidade e Marketing",
    variacao_percentual: "+45%",
    valor_anterior: 10000.0,
    valor_atual: 14500.0,
    tendencia: "alta",
    mensagem: "Aumento de R$ 4.500,00 nos contratos de agências.",
  },
  {
    id: 2,
    categoria: "Diárias e Passagens",
    variacao_percentual: "-15%",
    valor_anterior: 20000.0,
    valor_atual: 17000.0,
    tendencia: "baixa",
    mensagem: "Redução nos custos de deslocamento da diretoria.",
  },
  {
    id: 3,
    categoria: "Equipamentos de TI",
    variacao_percentual: "+120%",
    valor_anterior: 5000.0,
    valor_atual: 11000.0,
    tendencia: "alta",
    mensagem: "Pico de gastos atípico (Possível renovação de parque tecnológico).",
  },
];
