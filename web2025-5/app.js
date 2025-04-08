const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const superagent = require('superagent');
const { program } = require('commander');


program
  .requiredOption('-h, --host <host>', 'Адреса сервера')
  .requiredOption('-p, --port <port>', 'Порт сервера')
  .requiredOption('-c, --cache <cache>', 'Шлях до директорії кешу')
  .parse(process.argv);


const { host, port, cache } = program.opts();


fs.mkdir(cache, { recursive: true }).catch(err => {
  console.error('Помилка створення кешу:', err);
});


const server = http.createServer(async (req, res) => {
  const statusCode = req.url.substring(1); 
  const cacheFilePath = path.join(cache, `${statusCode}.jpg`);

  console.log(`Запит на отримання картинки для статусу ${statusCode}`);

  try {
    if (req.method === 'GET') {

      try {
        const cachedImage = await fs.readFile(cacheFilePath);
        res.writeHead(200, { 'Content-Type': 'image/jpeg' });
        res.end(cachedImage);
        console.log(`Картинка для статусу ${statusCode} знайдена в кеші`);
      } catch (err) {

        try {
          console.log(`Картинка для статусу ${statusCode} не знайдена в кеші. Завантажуємо з http.cat`);
          const response = await superagent.get(`https://http.cat/${statusCode}`);


          await fs.writeFile(cacheFilePath, response.body);
          res.writeHead(200, { 'Content-Type': 'image/jpeg' });
          res.end(response.body);
          console.log(`Картинка для статусу ${statusCode} завантажена та збережена в кеші`);
        } catch (err) {

          console.error(`Не вдалося отримати картинку для статусу ${statusCode} з http.cat`);
          res.writeHead(404);
          res.end('Not Found');
        }
      }
    } else if (req.method === 'PUT') {

      let body = '';
      req.on('data', chunk => {
        body += chunk;
      });
      req.on('end', async () => {
        try {
          await fs.writeFile(cacheFilePath, body);
          res.writeHead(201);
          res.end('Created');
          console.log(`Картинка для статусу ${statusCode} була записана в кеш`);
        } catch (err) {
          console.error(`Не вдалося записати картинку в кеш: ${err}`);
          res.writeHead(500);
          res.end('Internal Server Error');
        }
      });
    } else if (req.method === 'DELETE') {

      try {
        await fs.unlink(cacheFilePath);
        res.writeHead(200);
        res.end('Deleted');
        console.log(`Картинка для статусу ${statusCode} була видалена з кешу`);
      } catch (err) {
        console.error(`Не вдалося видалити картинку з кешу: ${err}`);
        res.writeHead(404);
        res.end('Not Found');
      }
    } else {
      res.writeHead(405);
      res.end('Method Not Allowed');
    }
  } catch (err) {
    console.error('Помилка серверу:', err);
    res.writeHead(500);
    res.end('Internal Server Error');
  }
});


server.listen(port, host, () => {
  console.log(`Сервер запущено на http://${host}:${port}`);
});

