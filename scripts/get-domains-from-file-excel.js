const readXlsxFile = require("read-excel-file/node");
const fs = require("fs");

let count = 0;

readXlsxFile("ranking_domains.xlsx").then((rows) => {
  rows.shift();
  for (const row of rows) {
    console.log(++count);
    if (count <= 80000) {
      fs.appendFileSync("news_domain_1.txt", `'${row[1]}',\n`, {
        encoding: "utf-8",
      });
    } else {
      fs.appendFileSync("news_domain_2.txt", `'${row[1]}',\n`, {
        encoding: "utf-8",
      });
    }
  }
  console.log("Finish...");
});
