import bmiReference from "./data/bmi-reference.json";

const DAY_MS = 24 * 60 * 60 * 1000;
const BMI_REFERENCE_MIN_Z = -4;
const BMI_REFERENCE_MAX_Z = 4;
const ADULT_AGE_THRESHOLD = 20;
const CHILD_AGE_THRESHOLD_MONTHS = 120;
const PEDIATRIC_REFERENCE_START_MONTH = 61;

const ADULT_LEGEND = [
  { tone: "blue", label: "Baixo peso", range: "Abaixo de 18,5" },
  { tone: "green", label: "Peso adequado", range: "18,5 a 24,9" },
  { tone: "yellow", label: "Sobrepeso", range: "25,0 a 29,9" },
  { tone: "orange", label: "Obesidade grau I", range: "30,0 a 34,9" },
  { tone: "rose", label: "Obesidade grau II", range: "35,0 a 39,9" },
  { tone: "wine", label: "Obesidade grau III", range: "40,0 ou mais" },
];

const CHILD_LEGEND = [
  { tone: "blue", label: "Magreza acentuada", range: "< -3 escore-z" },
  { tone: "blue", label: "Magreza", range: ">= -3 e < -2 escore-z" },
  { tone: "green", label: "Adequado", range: ">= -2 e <= +1 escore-z" },
  { tone: "yellow", label: "Risco de sobrepeso", range: "> +1 e <= +2 escore-z" },
  { tone: "orange", label: "Sobrepeso", range: "> +2 e <= +3 escore-z" },
  { tone: "wine", label: "Obesidade", range: "> +3 escore-z" },
];

const ADOLESCENT_LEGEND = [
  { tone: "blue", label: "Magreza acentuada", range: "< -3 escore-z" },
  { tone: "blue", label: "Magreza", range: ">= -3 e < -2 escore-z" },
  { tone: "green", label: "Eutrofia", range: ">= -2 e <= +1 escore-z" },
  { tone: "yellow", label: "Sobrepeso", range: "> +1 e <= +2 escore-z" },
  { tone: "orange", label: "Obesidade", range: "> +2 e <= +3 escore-z" },
  { tone: "wine", label: "Obesidade grave", range: "> +3 escore-z" },
];

const BMI_CURVE_SERIES = [
  { key: "sdNeg3", label: "Z -3", percentileLabel: "P0,1", rowIndex: 2, color: "#1d4ed8", lineWidth: 1.5 },
  { key: "sdNeg2", label: "Z -2", percentileLabel: "P2,3", rowIndex: 3, color: "#2c7ce4", lineWidth: 1.5 },
  { key: "sdNeg1", label: "Z -1", percentileLabel: "P15,9", rowIndex: 4, color: "#6b8fcb", lineWidth: 1.2 },
  { key: "sd0", label: "Z 0", percentileLabel: "P50", rowIndex: 5, color: "#4a9e42", lineWidth: 2.2 },
  { key: "sd1", label: "Z +1", percentileLabel: "P84,1", rowIndex: 6, color: "#d9a010", lineWidth: 1.2 },
  { key: "sd2", label: "Z +2", percentileLabel: "P97,7", rowIndex: 7, color: "#da7d1e", lineWidth: 1.5 },
  { key: "sd3", label: "Z +3", percentileLabel: "P99,9", rowIndex: 8, color: "#6a2b2b", lineWidth: 1.5 },
];

const PEDIATRIC_CLASSIFICATION_COPY = {
  "magreza acentuada": {
    title: "Triagem com magreza acentuada",
    subtitle: "O IMC por idade e sexo indica necessidade de revisao tecnica prioritaria.",
    description: "O resultado sugere um estado nutricional abaixo do esperado para a idade e o sexo, exigindo confirmacao tecnica e acompanhamento do crescimento.",
    guidance: "Revisar medidas, alimentar o prontuario com historico clinico e manter avaliacao do nutricionista ou profissional responsavel.",
  },
  magreza: {
    title: "Triagem com magreza",
    subtitle: "O IMC por idade e sexo aponta necessidade de acompanhamento mais atento.",
    description: "O resultado sugere estado nutricional abaixo do esperado para a idade e o sexo, e precisa ser interpretado junto ao crescimento, rotina alimentar e contexto clinico.",
    guidance: "Confirmar medidas, revisar habitos alimentares e acompanhar evolucao com o nutricionista responsavel.",
  },
  "eutrofia / adequado": {
    title: "Triagem dentro da faixa adequada",
    subtitle: "O IMC por idade e sexo esta em faixa mais esperada para a idade e o sexo.",
    description: "O resultado sugere equilibrio antropometrico no momento da avaliacao, considerando a referencia OMS/SISVAN para idade e sexo.",
    guidance: "Manter acompanhamento de rotina, incentivo a alimentacao adequada e observacao do crescimento.",
  },
  "risco de sobrepeso": {
    title: "Triagem com risco de sobrepeso",
    subtitle: "Ha sinal precoce de excesso de peso para a faixa etaria avaliada.",
    description: "O resultado indica necessidade de orientar rotina alimentar e estilo de vida antes de evolucao para excesso de peso mais importante.",
    guidance: "Reforcar organizacao alimentar, atividade fisica e seguimento tecnico com o nutricionista.",
  },
  sobrepeso: {
    title: "Triagem com sobrepeso",
    subtitle: "O IMC por idade e sexo aponta excesso de peso e requer acompanhamento tecnico.",
    description: "O resultado indica excesso de peso para a idade e o sexo, devendo ser interpretado com crescimento, rotina, exame clinico e contexto familiar.",
    guidance: "Confirmar medidas, revisar rotina alimentar e acompanhar com o nutricionista ou equipe responsavel.",
  },
  obesidade: {
    title: "Triagem com obesidade",
    subtitle: "O resultado indica excesso de peso importante para a faixa etaria.",
    description: "O IMC por idade e sexo sugere obesidade e pede acompanhamento tecnico estruturado para triagem e encaminhamento quando necessario.",
    guidance: "Registrar achados, revisar habitos, fortalecer o seguimento nutricional e avaliar necessidade de encaminhamento complementar.",
  },
  "obesidade grave": {
    title: "Triagem com obesidade grave",
    subtitle: "O resultado exige revisao tecnica com prioridade.",
    description: "O IMC por idade e sexo sugere excesso de peso muito elevado e necessidade de avaliacao profissional proxima.",
    guidance: "Garantir revisao tecnica, acompanhamento frequente e encaminhamento conforme o fluxo local da equipe.",
  },
};

const ADULT_CLASSIFICATION_COPY = {
  "baixo peso": {
    title: "Triagem com baixo peso",
    subtitle: "O IMC adulto ficou abaixo da faixa de referencia.",
    description: "O resultado sugere baixo peso segundo a classificacao adulta tradicional e deve ser interpretado junto ao historico e contexto clinico.",
    guidance: "Confirmar medidas e manter avaliacao tecnica para orientar a conduta nutricional.",
  },
  "peso adequado / eutrofia": {
    title: "Triagem dentro da faixa adequada",
    subtitle: "O IMC adulto ficou em faixa mais esperada.",
    description: "O resultado sugere peso adequado segundo a classificacao adulta tradicional no momento da avaliacao.",
    guidance: "Manter acompanhamento de rotina e reforco de habitos alimentares saudaveis.",
  },
  sobrepeso: {
    title: "Triagem com sobrepeso",
    subtitle: "O IMC adulto aponta excesso de peso.",
    description: "O resultado sugere sobrepeso na classificacao adulta tradicional e pede acompanhamento tecnico para orientacao e seguimento.",
    guidance: "Revisar medidas, rotina alimentar e plano de acompanhamento com o profissional responsavel.",
  },
  "obesidade grau I": {
    title: "Triagem com obesidade grau I",
    subtitle: "O IMC adulto indica obesidade grau I.",
    description: "O resultado sugere obesidade grau I pela classificacao adulta tradicional e deve ser avaliado com seguimento tecnico.",
    guidance: "Manter acompanhamento nutricional, revisar rotina e considerar encaminhamentos conforme protocolo local.",
  },
  "obesidade grau II": {
    title: "Triagem com obesidade grau II",
    subtitle: "O IMC adulto indica obesidade grau II.",
    description: "O resultado sugere obesidade grau II pela classificacao adulta tradicional e demanda acompanhamento tecnico mais atento.",
    guidance: "Priorizar revisao tecnica e seguimento frequente com o profissional responsavel.",
  },
  "obesidade grau III": {
    title: "Triagem com obesidade grau III",
    subtitle: "O IMC adulto indica obesidade grau III.",
    description: "O resultado sugere obesidade grau III pela classificacao adulta tradicional e pede avaliacao profissional proxima.",
    guidance: "Garantir revisao tecnica, seguimento intensificado e encaminhamento conforme protocolo local.",
  },
};

export const TRIAGE_DISCLAIMER = "O resultado apresentado e uma classificacao antropometrica de triagem e acompanhamento nutricional. Ele nao substitui avaliacao clinica, diagnostico medico ou conduta individualizada de profissional habilitado.";
export const TECHNICAL_REVIEW_MESSAGE = "Necessaria revisao tecnica por nutricionista ou profissional responsavel.";

function parseNumber(value) {
  const normalized = String(value ?? "").trim().replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDate(value) {
  if (!value) return null;
  const raw = String(value).trim();
  const isoDay = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoDay) {
    const parsed = new Date(`${isoDay[1]}T12:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setHours(12, 0, 0, 0);
  return parsed;
}

function normalizeDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
}

function diffInDays(startDate, endDate) {
  return Math.floor((normalizeDate(endDate) - normalizeDate(startDate)) / DAY_MS);
}

function normalizeSex(value) {
  const normalized = String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  if (["M", "MASC", "MASCULINO", "MALE", "HOMEM"].includes(normalized)) return "MASCULINO";
  if (["F", "FEM", "FEMININO", "FEMALE", "MULHER"].includes(normalized)) return "FEMININO";
  return "";
}

function normalizeHeightMeters(value) {
  const height = parseNumber(value);
  if (!Number.isFinite(height) || height <= 0) return null;
  return height > 3 ? height / 100 : height;
}

function calculateAgeOnDate(birthDateValue, evaluationDateValue = new Date()) {
  const birthDate = parseDate(birthDateValue);
  const evaluationDate = parseDate(evaluationDateValue) || normalizeDate(new Date());

  if (!birthDate || !evaluationDate) return null;

  let years = evaluationDate.getFullYear() - birthDate.getFullYear();
  let months = evaluationDate.getMonth() - birthDate.getMonth();

  if (evaluationDate.getDate() < birthDate.getDate()) {
    months -= 1;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const totalMonths = years * 12 + months;
  const totalDays = diffInDays(birthDate, evaluationDate);
  const exactMonths = totalDays / 30.4375;

  let label = `${Math.max(years, 0)} ano(s)`;
  if (years < 1) {
    label = `${Math.max(totalMonths, 0)} mes(es)`;
  } else if (months > 0) {
    label = `${years} ano(s) e ${months} mes(es)`;
  }

  return {
    birthDate,
    evaluationDate,
    years: Math.max(years, 0),
    months: Math.max(months, 0),
    totalMonths: Math.max(totalMonths, 0),
    totalDays: Math.max(totalDays, 0),
    exactMonths: Math.max(exactMonths, 0),
    label,
  };
}

function calculateBmiValue(weightValue, heightValue) {
  const weightKg = parseNumber(weightValue);
  const heightMeters = normalizeHeightMeters(heightValue);
  if (!Number.isFinite(weightKg) || !Number.isFinite(heightMeters) || weightKg <= 0 || heightMeters <= 0) return null;
  return weightKg / (heightMeters * heightMeters);
}

function formatBmiValue(value) {
  return Number.isFinite(value) ? value.toFixed(2) : "";
}

function binaryLocate(rows, targetAge) {
  let low = 0;
  let high = rows.length - 1;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const currentAge = rows[middle][0];
    if (currentAge === targetAge) return { lower: rows[middle], upper: rows[middle] };
    if (currentAge < targetAge) low = middle + 1;
    else high = middle - 1;
  }

  const lower = rows[Math.max(high, 0)];
  const upper = rows[Math.min(low, rows.length - 1)];
  return { lower, upper };
}

function interpolateReferenceRow(rows, targetAge) {
  if (!rows.length) return null;
  if (targetAge <= rows[0][0]) return rows[0];
  if (targetAge >= rows[rows.length - 1][0]) return rows[rows.length - 1];

  const { lower, upper } = binaryLocate(rows, targetAge);
  if (!lower || !upper) return null;
  if (lower[0] === upper[0]) return lower;

  const ratio = (targetAge - lower[0]) / (upper[0] - lower[0]);
  return lower.map((value, index) => (
    index === 0 ? targetAge : value + (upper[index] - value) * ratio
  ));
}

function estimateZScoreFromReference(bmiValue, referenceRow) {
  if (!Number.isFinite(bmiValue) || !referenceRow) return null;

  const points = [
    { z: -4, value: referenceRow[1] },
    { z: -3, value: referenceRow[2] },
    { z: -2, value: referenceRow[3] },
    { z: -1, value: referenceRow[4] },
    { z: 0, value: referenceRow[5] },
    { z: 1, value: referenceRow[6] },
    { z: 2, value: referenceRow[7] },
    { z: 3, value: referenceRow[8] },
    { z: 4, value: referenceRow[9] },
  ];

  if (bmiValue <= points[0].value) {
    const next = points[1];
    const span = next.value - points[0].value || 1;
    return points[0].z + ((bmiValue - points[0].value) / span);
  }

  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    if (bmiValue >= current.value && bmiValue <= next.value) {
      const span = next.value - current.value || 1;
      return current.z + (((bmiValue - current.value) / span) * (next.z - current.z));
    }
  }

  const previous = points[points.length - 2];
  const last = points[points.length - 1];
  const span = last.value - previous.value || 1;
  return last.z + ((bmiValue - last.value) / span);
}

function erf(value) {
  const sign = value < 0 ? -1 : 1;
  const absolute = Math.abs(value);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * absolute);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absolute * absolute);
  return sign * y;
}

function normalCdf(value) {
  return 0.5 * (1 + erf(value / Math.sqrt(2)));
}

function toPercentile(zScore) {
  if (!Number.isFinite(zScore)) return null;
  return Math.max(0, Math.min(100, normalCdf(zScore) * 100));
}

function classifyAdultBmi(bmiValue) {
  if (bmiValue < 18.5) {
    return { label: "baixo peso", tone: "blue" };
  }
  if (bmiValue < 25) {
    return { label: "peso adequado / eutrofia", tone: "green" };
  }
  if (bmiValue < 30) {
    return { label: "sobrepeso", tone: "yellow" };
  }
  if (bmiValue < 35) {
    return { label: "obesidade grau I", tone: "orange" };
  }
  if (bmiValue < 40) {
    return { label: "obesidade grau II", tone: "rose" };
  }
  return { label: "obesidade grau III", tone: "wine" };
}

function classifyPediatricBmi(zScore, ageInMonths) {
  const isChild = ageInMonths < CHILD_AGE_THRESHOLD_MONTHS;

  if (zScore < -3) {
    return {
      label: "magreza acentuada",
      tone: "blue",
      typeClassification: isChild ? "INFANTIL_IMC_IDADE_SEXO" : "ADOLESCENTE_IMC_IDADE_SEXO",
    };
  }

  if (zScore < -2) {
    return {
      label: "magreza",
      tone: "blue",
      typeClassification: isChild ? "INFANTIL_IMC_IDADE_SEXO" : "ADOLESCENTE_IMC_IDADE_SEXO",
    };
  }

  if (zScore <= 1) {
    return {
      label: "eutrofia / adequado",
      tone: "green",
      typeClassification: isChild ? "INFANTIL_IMC_IDADE_SEXO" : "ADOLESCENTE_IMC_IDADE_SEXO",
    };
  }

  if (isChild) {
    if (zScore <= 2) {
      return { label: "risco de sobrepeso", tone: "yellow", typeClassification: "INFANTIL_IMC_IDADE_SEXO" };
    }
    if (zScore <= 3) {
      return { label: "sobrepeso", tone: "orange", typeClassification: "INFANTIL_IMC_IDADE_SEXO" };
    }
    return { label: "obesidade", tone: "wine", typeClassification: "INFANTIL_IMC_IDADE_SEXO" };
  }

  if (zScore <= 2) {
    return { label: "sobrepeso", tone: "yellow", typeClassification: "ADOLESCENTE_IMC_IDADE_SEXO" };
  }
  if (zScore <= 3) {
    return { label: "obesidade", tone: "orange", typeClassification: "ADOLESCENTE_IMC_IDADE_SEXO" };
  }
  return { label: "obesidade grave", tone: "wine", typeClassification: "ADOLESCENTE_IMC_IDADE_SEXO" };
}

function getReferenceRowsForMinor(age) {
  if (age.totalDays <= bmiReference.under5.female[bmiReference.under5.female.length - 1][0]) {
    return { collectionKey: "under5", ageValue: age.totalDays };
  }
  return { collectionKey: "fiveToNineteen", ageValue: Math.max(PEDIATRIC_REFERENCE_START_MONTH, age.exactMonths) };
}

function getSexReferenceKey(sex) {
  if (sex === "MASCULINO") return "male";
  if (sex === "FEMININO") return "female";
  return "";
}

function getSexLabel(sex) {
  if (sex === "MASCULINO") return "Masculino";
  if (sex === "FEMININO") return "Feminino";
  return "Nao informado";
}

function ageReferenceToYears(ageValue, collectionKey) {
  return collectionKey === "under5" ? ageValue / 365.25 : ageValue / 12;
}

function sampleReferenceRows(rows, collectionKey) {
  if (collectionKey === "under5") {
    return rows.filter((row, index) => index === 0 || index === rows.length - 1 || row[0] % 30 === 0);
  }
  return rows;
}

function createCurveDatasets(rows, collectionKey, labelKey) {
  return BMI_CURVE_SERIES.map((series) => ({
    label: labelKey === "percentileLabel" ? series.percentileLabel : series.label,
    borderColor: series.color,
    borderWidth: series.lineWidth,
    pointRadius: 0,
    tension: 0.25,
    fill: false,
    data: rows.map((row) => ({
      x: Number(ageReferenceToYears(row[0], collectionKey).toFixed(4)),
      y: row[series.rowIndex],
    })),
  }));
}

function buildRiskAlerts(classificationLabel) {
  if (!classificationLabel) return [];
  return [
    "magreza acentuada",
    "magreza",
    "risco de sobrepeso",
    "sobrepeso",
    "obesidade",
    "obesidade grave",
    "baixo peso",
    "obesidade grau I",
    "obesidade grau II",
    "obesidade grau III",
  ].includes(classificationLabel)
    ? [TECHNICAL_REVIEW_MESSAGE]
    : [];
}

function buildAdultSummaryCopy(classificationLabel) {
  return ADULT_CLASSIFICATION_COPY[classificationLabel] || ADULT_CLASSIFICATION_COPY["peso adequado / eutrofia"];
}

function buildPediatricSummaryCopy(classificationLabel) {
  return PEDIATRIC_CLASSIFICATION_COPY[classificationLabel] || PEDIATRIC_CLASSIFICATION_COPY["eutrofia / adequado"];
}

export function evaluateAnthropometricStatus({
  weight,
  height,
  birthDate,
  evaluationDate = new Date(),
  sex,
  schoolId,
  schoolName,
  grade,
  classroom,
} = {}) {
  const errors = [];
  const alerts = [];

  const weightKg = parseNumber(weight);
  const heightMeters = normalizeHeightMeters(height);
  const normalizedSex = normalizeSex(sex);
  const age = calculateAgeOnDate(birthDate, evaluationDate);
  const bmiValue = calculateBmiValue(weight, height);
  const evaluationDateParsed = parseDate(evaluationDate);
  const birthDateParsed = parseDate(birthDate);

  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    errors.push("Informe um peso valido maior que zero.");
  }

  if (!Number.isFinite(heightMeters) || heightMeters <= 0) {
    errors.push("Informe uma altura valida maior que zero.");
  }

  if (!birthDateParsed) {
    errors.push("Informe a data de nascimento.");
  }

  if (!evaluationDateParsed) {
    errors.push("Informe a data da avaliacao.");
  }

  if (birthDateParsed && birthDateParsed > normalizeDate(new Date())) {
    errors.push("A data de nascimento nao pode ser futura.");
  }

  if (birthDateParsed && evaluationDateParsed && normalizeDate(evaluationDateParsed) < normalizeDate(birthDateParsed)) {
    errors.push("A data da avaliacao nao pode ser anterior a data de nascimento.");
  }

  if (!schoolId && !schoolName) {
    alerts.push("Escola nao informada na avaliacao.");
  }

  if (birthDateParsed && evaluationDateParsed && age && age.years < ADULT_AGE_THRESHOLD && !normalizedSex) {
    errors.push("Informe o sexo padronizado para classificar menores de 20 anos.");
  }

  if (Number.isFinite(weightKg) && (weightKg < 2 || weightKg > 300)) {
    alerts.push("Peso fora de faixa plausivel. Verifique a digitacao e a afericao.");
  }

  if (Number.isFinite(heightMeters) && (heightMeters < 0.45 || heightMeters > 2.5)) {
    alerts.push("Altura fora de faixa plausivel. Verifique a digitacao e a afericao.");
  }

  if (!Number.isFinite(bmiValue)) {
    return {
      bmi: null,
      bmiDisplay: "",
      weightKg,
      heightMeters,
      normalizedSex,
      age,
      errors,
      alerts,
      methodLabel: birthDateParsed && age?.years >= ADULT_AGE_THRESHOLD ? "IMC adulto" : "IMC por idade e sexo",
      disclaimer: TRIAGE_DISCLAIMER,
      needsTechnicalReview: alerts.length > 0 || errors.length > 0,
      technicalReviewMessage: alerts.length > 0 || errors.length > 0 ? TECHNICAL_REVIEW_MESSAGE : "",
    };
  }

  if (!age) {
    errors.push("Nao foi possivel calcular a idade na data da avaliacao.");
    return {
      bmi: bmiValue,
      bmiDisplay: formatBmiValue(bmiValue),
      weightKg,
      heightMeters,
      normalizedSex,
      age,
      errors,
      alerts,
      methodLabel: "IMC por idade e sexo",
      disclaimer: TRIAGE_DISCLAIMER,
      needsTechnicalReview: true,
      technicalReviewMessage: TECHNICAL_REVIEW_MESSAGE,
    };
  }

  const isAdult = age.years >= ADULT_AGE_THRESHOLD;
  let classification;
  let referenceLabel = "OMS/SISVAN";
  let zScore = null;
  let percentile = null;
  let referenceRow = null;
  let legend = ADULT_LEGEND;
  let markerPercent = Math.min(100, Math.max(0, ((bmiValue - 15) / (45 - 15)) * 100));

  if (isAdult) {
    classification = {
      ...classifyAdultBmi(bmiValue),
      typeClassification: "ADULTO_IMC",
    };
    referenceLabel = "IMC adulto tradicional";
    legend = ADULT_LEGEND;
  } else {
    const sexReferenceKey = getSexReferenceKey(normalizedSex);
    if (!sexReferenceKey) {
      errors.push("Sexo invalido para classificacao por IMC/idade.");
    } else {
      const { collectionKey, ageValue } = getReferenceRowsForMinor(age);
      const rows = bmiReference[collectionKey]?.[sexReferenceKey] || [];
      referenceRow = interpolateReferenceRow(rows, ageValue);
      if (!referenceRow) {
        errors.push("Nao foi possivel localizar a referencia OMS/SISVAN para esta idade.");
      } else {
        zScore = estimateZScoreFromReference(bmiValue, referenceRow);
        percentile = toPercentile(zScore);
        classification = classifyPediatricBmi(zScore, age.totalMonths);
        legend = age.totalMonths < CHILD_AGE_THRESHOLD_MONTHS ? CHILD_LEGEND : ADOLESCENT_LEGEND;
        markerPercent = Math.min(100, Math.max(0, (((zScore ?? 0) - BMI_REFERENCE_MIN_Z) / (BMI_REFERENCE_MAX_Z - BMI_REFERENCE_MIN_Z)) * 100));
      }
    }
  }

  if (!classification) {
    alerts.push("Nao foi possivel concluir a classificacao antropometrica.");
  }

  if (Number.isFinite(zScore) && (zScore < -4 || zScore > 4)) {
    alerts.push("Indice fora da faixa de referencia expandida. Confirme peso, altura e data de nascimento.");
  }

  const classificationLabel = classification?.label || "";
  const riskAlerts = buildRiskAlerts(classificationLabel);
  const allAlerts = [...alerts, ...riskAlerts];
  const needsTechnicalReview = allAlerts.length > 0 || errors.length > 0;

  return {
    bmi: bmiValue,
    bmiDisplay: formatBmiValue(bmiValue),
    weightKg,
    heightMeters,
    heightDisplay: Number.isFinite(heightMeters) ? heightMeters.toFixed(2) : "",
    normalizedSex,
    age,
    methodLabel: isAdult ? "IMC adulto" : "IMC por idade e sexo",
    typeClassification: classification?.typeClassification || "",
    referenceLabel,
    zScore,
    zScoreDisplay: Number.isFinite(zScore) ? zScore.toFixed(2) : "",
    percentile,
    percentileDisplay: Number.isFinite(percentile) ? percentile.toFixed(2) : "",
    classificationLabel,
    classificationTone: classification?.tone || "green",
    legend,
    markerPercent,
    referenceRow,
    errors,
    alerts: allAlerts,
    needsTechnicalReview,
    technicalReviewMessage: needsTechnicalReview ? TECHNICAL_REVIEW_MESSAGE : "",
    disclaimer: TRIAGE_DISCLAIMER,
    schoolLabel: schoolName || "",
    gradeLabel: grade || "",
    classroomLabel: classroom || "",
  };
}

export function buildBmiSummary(result) {
  if (!result || !Number.isFinite(result.bmi) || !result.classificationLabel) return null;

  const summaryCopy = result.typeClassification === "ADULTO_IMC"
    ? buildAdultSummaryCopy(result.classificationLabel)
    : buildPediatricSummaryCopy(result.classificationLabel);

  const note = result.typeClassification === "ADULTO_IMC"
    ? `${TRIAGE_DISCLAIMER} Metodo utilizado: IMC adulto.`
    : `${TRIAGE_DISCLAIMER} Metodo utilizado: IMC por idade e sexo, conforme referencia OMS/SISVAN.`;

  return {
    ...summaryCopy,
    label: result.classificationLabel,
    tone: result.classificationTone,
    valueLabel: result.bmiDisplay,
    markerPercent: result.markerPercent,
    legend: result.legend,
    methodLabel: result.methodLabel,
    referenceLabel: result.referenceLabel,
    zScoreLabel: result.zScoreDisplay,
    percentileLabel: result.percentileDisplay,
    note,
  };
}

export function buildBmiGrowthChartModel(result) {
  if (!result || result.typeClassification === "ADULTO_IMC") return null;
  if (!Number.isFinite(result.bmi) || !result.age || !result.normalizedSex) return null;

  const sexReferenceKey = getSexReferenceKey(result.normalizedSex);
  if (!sexReferenceKey) return null;

  const { collectionKey } = getReferenceRowsForMinor(result.age);
  const rows = bmiReference[collectionKey]?.[sexReferenceKey] || [];
  if (!rows.length) return null;

  const sampledRows = sampleReferenceRows(rows, collectionKey);
  const pointX = Number((result.age.exactMonths / 12).toFixed(4));
  const pointDataset = {
    label: "Avaliacao atual",
    showLine: false,
    borderColor: "#173277",
    backgroundColor: "#173277",
    pointRadius: 5,
    pointHoverRadius: 6,
    borderWidth: 0,
    data: [{ x: pointX, y: result.bmi }],
  };

  return {
    title: "Curvas de IMC por idade",
    subtitle: `Referencia OMS/SBP para ${getSexLabel(result.normalizedSex)} (${collectionKey === "under5" ? "0 a 5 anos" : "5 a 19 anos"}).`,
    axisUnit: "anos",
    point: {
      ageYears: pointX,
      bmi: result.bmi,
      zScore: result.zScore,
      percentile: result.percentile,
    },
    percentileChart: {
      datasets: [...createCurveDatasets(sampledRows, collectionKey, "percentileLabel"), pointDataset],
    },
    zScoreChart: {
      datasets: [...createCurveDatasets(sampledRows, collectionKey, "label"), pointDataset],
    },
  };
}

export function calculateBmi(weight, height) {
  return formatBmiValue(calculateBmiValue(weight, height));
}

export { calculateAgeOnDate, normalizeSex };
