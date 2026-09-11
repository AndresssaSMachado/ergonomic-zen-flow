import exNeck from "@/assets/ex-neck.jpg";
import exBack from "@/assets/ex-back.jpg";
import exShoulders from "@/assets/ex-shoulders.jpg";
import exTwist from "@/assets/ex-twist.jpg";

export interface Exercise {
  id: string;
  title: string;
  focus: string;
  image: string;
  alt: string;
  steps: string[];
}

export const exercises: Exercise[] = [
  {
    id: "neck",
    title: "Alongamento de pescoço sentado",
    focus: "Alivia a tensão do pescoço e dos ombros",
    image: exNeck,
    alt: "Ilustração de pessoa sentada alongando o pescoço com a mão sobre a cabeça",
    steps: [
      "Sente-se ereto, pés apoiados no chão",
      "Leve a mão direita sobre a cabeça até a orelha esquerda",
      "Incline a cabeça suavemente para a direita por 30 segundos",
      "Respire fundo e sinta o alongamento lateral",
      "Troque de lado e repita",
    ],
  },
  {
    id: "back",
    title: "Extensão lombar em pé",
    focus: "Descomprime a lombar de quem fica muito tempo sentado",
    image: exBack,
    alt: "Ilustração de pessoa em pé ao lado da mesa com as mãos na lombar",
    steps: [
      "Levante-se e afaste levemente os pés",
      "Apoie as mãos na parte baixa das costas",
      "Arqueie o tronco para trás devagar, olhando para cima",
      "Segure por 10 segundos respirando fundo",
      "Repita 5 vezes sem pressa",
    ],
  },
  {
    id: "shoulders",
    title: "Alongamento de braços acima da cabeça",
    focus: "Abre o peito e alonga ombros e coluna",
    image: exShoulders,
    alt: "Ilustração de pessoa em pé com os braços esticados acima da cabeça",
    steps: [
      "Fique em pé com a coluna alongada",
      "Entrelace os dedos e estique os braços para cima",
      "Palmas viradas para o teto, cresça o corpo inteiro",
      "Segure por 20 segundos respirando devagar",
      "Relaxe e repita 3 vezes",
    ],
  },
  {
    id: "twist",
    title: "Rotação de coluna na cadeira",
    focus: "Solta a coluna e melhora a mobilidade do tronco",
    image: exTwist,
    alt: "Ilustração de pessoa sentada girando o tronco apoiada no encosto da cadeira",
    steps: [
      "Sente-se ereto na ponta da cadeira",
      "Gire o tronco para a direita segurando o encosto",
      "Mantenha o quadril firme, gire só o tronco",
      "Segure por 20 segundos respirando fundo",
      "Volte ao centro e repita para o outro lado",
    ],
  },
];
