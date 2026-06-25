const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const cacheDir = path.join(__dirname, ".cache", "who-bmi");
const outputFile = path.join(__dirname, "..", "src", "data", "bmi-reference.json");

const sources = {
  under5Girls: {
    fileName: "bfa-girls-zscore-expanded-tables.xlsx",
    url: "https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/body-mass-index-for-age/expanded-tables/bfa-girls-zscore-expanded-tables.xlsx?sfvrsn=ae4cb8d1_12",
  },
  under5Boys: {
    fileName: "bfa-boys-zscore-expanded-tables.xlsx",
    url: "https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/body-mass-index-for-age/expanded-tables/bfa-boys-zscore-expanded-tables.xlsx?sfvrsn=f8e1fbe2_10",
  },
  fiveToNineteenGirls: {
    fileName: "bmi-girls-z-who-2007-exp.xlsx",
    url: "https://cdn.who.int/media/docs/default-source/child-growth/growth-reference-5-19-years/bmi-for-age-%285-19-years%29/bmi-girls-z-who-2007-exp.xlsx?sfvrsn=79222875_2",
  },
  fiveToNineteenBoys: {
    fileName: "bmi-boys-z-who-2007-exp.xlsx",
    url: "https://cdn.who.int/media/docs/default-source/child-growth/growth-reference-5-19-years/bmi-for-age-%285-19-years%29/bmi-boys-z-who-2007-exp.xlsx?sfvrsn=a84bca93_2",
  },
};

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

async function downloadIfNeeded({ fileName, url }) {
  ensureDir(cacheDir);
  const filePath = path.join(cacheDir, fileName);
  if (fs.existsSync(filePath)) return filePath;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Falha ao baixar a referencia OMS: ${response.status} ${response.statusText}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(filePath, bytes);
  return filePath;
}

function toReferenceRows(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  return rows.slice(1).map((row) => ([
    Number(row[0]),
    Number(row[4]),
    Number(row[5]),
    Number(row[6]),
    Number(row[7]),
    Number(row[8]),
    Number(row[9]),
    Number(row[10]),
    Number(row[11]),
    Number(row[12]),
  ]));
}

async function main() {
  const under5GirlsPath = await downloadIfNeeded(sources.under5Girls);
  const under5BoysPath = await downloadIfNeeded(sources.under5Boys);
  const fiveToNineteenGirlsPath = await downloadIfNeeded(sources.fiveToNineteenGirls);
  const fiveToNineteenBoysPath = await downloadIfNeeded(sources.fiveToNineteenBoys);

  const data = {
    generatedAt: new Date().toISOString(),
    source: "WHO growth standards and growth reference",
    schema: ["age", "sdNeg4", "sdNeg3", "sdNeg2", "sdNeg1", "sd0", "sd1", "sd2", "sd3", "sd4"],
    under5: {
      female: toReferenceRows(under5GirlsPath),
      male: toReferenceRows(under5BoysPath),
    },
    fiveToNineteen: {
      female: toReferenceRows(fiveToNineteenGirlsPath),
      male: toReferenceRows(fiveToNineteenBoysPath),
    },
  };

  ensureDir(path.dirname(outputFile));
  fs.writeFileSync(outputFile, `${JSON.stringify(data)}\n`);
  console.log(`Arquivo gerado em ${outputFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
