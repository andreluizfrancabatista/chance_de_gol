//Funciona somente com campeonatos europeus por causa do formato das temporadas em dois anos (2023-2024).
//Para campeonatos sulamericanos, com temporadas em um ano, deve ser feito novo código com ajustes nas temporadas.
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(
    async () => {
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();

        await page.setViewport({ width: 1366, height: 768 });

        const countries = ['england', 'france', 'germany', 'italy', 'netherlands', 'spain', 'portugal', 'belgium', 'austria', 'turkey'];
        const nordics = ['norway', 'sweden', 'finland'];//temporada em um único ano.
        //const countries = ['england', 'germany'];
        const seasons = ['2023-2024', '2022-2023'];

        for (country of countries) {
            for (season of seasons) {
                try {
                    const response1 = await page.goto(`https://www.flashscore.com/football/${country}/`);

                    if (response1.ok()) {
                        await page.waitForSelector('div.leftMenu__item--width');
                        const leagues = await page.$$('div.leftMenu__item--width');
                        const info = {
                            name: [],
                            leagueName: []
                        };
                        const name0 = await leagues[0].$eval('a', el => el.getAttribute('href'));
                        const name1 = await leagues[1].$eval('a', el => el.getAttribute('href'));
                        info.name.push(name0);
                        info.name.push(name1);
                        const leagueName0 = await leagues[0].$eval('a', el => el.innerText);
                        const leagueName1 = await leagues[1].$eval('a', el => el.innerText);
                        info.leagueName.push(leagueName0);
                        info.leagueName.push(leagueName1);

                        for (let i = 0; i < 2; i++) {
                            try {
                                const name = info.name[i];
                                const leagueName = info.leagueName[i];

                                //Chamar a função scrapeData(page)
                                const url = `https://www.flashscore.com${name.slice(0, -1)}-${season}/results/`;

                                const response2 = await page.goto(url);
                                if (response2.ok()) {
                                    //Chamar a função scrapeData(page)
                                    await scrapeData(page, country, leagueName, season);
                                } else {
                                    console.log('Erro 404.');
                                }
                            } catch (error) {
                                console.log(error, country);
                            }
                        }
                    } else {
                        console.log('Erro 404.', country);
                    }
                } catch (error) {
                    console.log(error);
                }
            }
        }
        await browser.close();
    }
)();

async function scrapeData(page, country, leagueName, season) {
    const start = Date.now();

    //Esperar o more matches, clicar enquanto existir.
    let more = await page.waitForSelector('a.event__more--static', { timeout: 2000 });
    while (more) {
        try {
            const showMoreButton = await page.$('a.event__more--static');
            await showMoreButton.click();
            //
            await new Promise(r => setTimeout(r, 500));
            //
            let more = await page.waitForSelector('a.event__more--static', { timeout: 2000 });
        } catch (error) {
            //console.log(`showMore: ${error}`);
            more = null;
        }
    }

    const dados = {
        DATE: [],
        HOME: [],
        AWAY: [],
        FTHG: [],
        FTAG: [],
        DIFF: []
    }

    await page.waitForSelector('div.event__match--static');
    const eventos = (await page.$$('div.event__match--static'));

    for (evento of eventos) {
        try {
            let date = await evento.$eval('div.event__time', el => el.innerText);
            date = formatDateString(date, season);
            const home = await evento.$eval('div.event__homeParticipant>img', el => el.getAttribute('alt'));
            const away = await evento.$eval('div.event__awayParticipant>img', el => el.getAttribute('alt'));
            const fthg = await evento.$eval('div.event__score--home', el => el.innerText);
            const ftag = await evento.$eval('div.event__score--away', el => el.innerText);
            const diff = parseInt(fthg) - parseInt(ftag);
            dados.DATE.push(date);
            dados.HOME.push(home);
            dados.AWAY.push(away);
            dados.FTHG.push(fthg);
            dados.FTAG.push(ftag);
            dados.DIFF.push(diff);
            //console.log(`${home} ${fthg} x ${ftag} ${away}`);
        } catch (error) {
            //console.log(error);
        }

    }
    const folderName = country;
    try {
        if (!fs.existsSync(folderName)) {
            fs.mkdirSync(folderName);
        }
    } catch (err) {
        console.error(err);
    }

    const filename = path.join(__dirname, country, `${country}-${leagueName.replace(' ', '-')}-${season}.csv`);//Ajustar a temporada
    saveToCSV(dados, filename);
    const end = Date.now();
    console.log(`Tempo: ${(end - start) / 1000} segundos, ${country}:${leagueName}:${season}.`);
}

function saveToCSV(dados, filename) {

    const header = `DATE;HOME;AWAY;FTHG;FTAG;DIFF\n`;

    const rows = dados.HOME.map((home, index) => `${dados.DATE[index]};${home};${dados.AWAY[index]};${dados.FTHG[index]};${dados.FTAG[index]};${dados.DIFF[index]}\n`).join('');

    const csvContent = header + rows;

    fs.writeFileSync(filename, csvContent, 'utf8');

}

function saveToCSVLeagues(dados, filename) {

    const rows = dados.LINK.map((link, index) => `https://www.flashscore.com${link}\n`).join('');

    const csvContent = rows;

    fs.writeFileSync(filename, csvContent, 'utf8');

}

function formatDateString(dateString, season) {
    let [x, y] = season.split('-');
    let [day, month] = dateString.split('.').map(part => part.trim());
    let year = parseInt(month) >= 7 ? x : y;
    return `${day}/${month}/${year}`;
  }