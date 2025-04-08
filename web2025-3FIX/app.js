const { Command } = require('commander');
const fs = require('fs');

const program = new Command();
program
  .requiredOption('-i, --input <path>', 'Path to input JSON file')
  .option('-d, --display', 'Display result in console');

program.parse(process.argv);

const options = program.opts();

if (!fs.existsSync(options.input)) {
  console.error('Cannot find input file');
  process.exit(1);
}

const rawData = fs.readFileSync(options.input);
const data = JSON.parse(rawData);

const filteredData = data.filter(item => 
  item.cc === 'USD' || item.cc === 'EUR' || item.cc === 'ILS'
);

filteredData.forEach(item => {
  const result = `${item.txt} (${item.cc}): ${item.rate} (Дата: ${item.exchangedate})`;
  if (options.display) {
    console.log(result);
  }
});
