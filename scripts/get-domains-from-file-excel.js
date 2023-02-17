const readXlsxFile = require("read-excel-file/node");
const fs = require("fs");

let count = 0;

readXlsxFile("ranking_domains.xlsx").then((rows) => {
  rows.shift();
  for (const row of rows) {
    fs.appendFileSync("news_domain.txt", `'${row[1]}',\n`, {
      encoding: "utf-8",
    });
    console.log(++count);
  }
  console.log("Finish...");
});
