//Cria o arquivo list_leagues_js.csv
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

        //const countries = ['england', 'france', 'germany', 'italy', 'netherlands', 'spain', 'portugal', 'belgium', 'norway', 'sweden', 'finland', 'austria', 'turkey'];

        const countries = ['england'];

        // const dados = {
        //     LINK: []
        // }

        //Iterar sobre o objeto dados para acessar cada link
        //https://www.flashscore.com/football/england/premier-league-2023-2024/results/
        //https://www.flashscore.com/football/england/premier-league/

        for (country of countries) {
            try {
                const response1 = await page.goto(`https://www.flashscore.com/football/${country}/`);

                if (response1.ok()) {
                    await page.waitForSelector('div.leftMenu__item--width');
                    const leagues = (await page.$$('div.leftMenu__item--width'));
                    for (league of leagues.slice(0, 2)) {
                        try {
                            const name = await league.$eval('a', el => el.getAttribute('href'));
                            const leagueName = await league.$eval('a', el => el.innerText);
                            //dados.LINK.push(name);

                            //Chamar a função scrapeData(page)
                            const url = `https://www.flashscore.com${name.slice(0, -1)}-2023-2024/results/`;
                            console.log(url);
                            const response2 = await page.goto(url);
                            if (response2.ok()) {
                                //Chamar a função scrapeData(page)
                                await scrapeData(page, country, leagueName);
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


        await browser.close();
    }
)();

async function scrapeData(page, country, leagueName) {
    const start = Date.now();
    
    //Esperar o more matches, clicar enquanto existir.
    let more = await page.waitForSelector('a.event__more--static');
    while(more !=null){
        await page.click('a.event__more--static');
        more = await page.waitForSelector('a.event__more--static');
        console.log(more);
    }


    await page.waitForSelector('div.event__match--static');
    const dados = {
        HOME: [],
        AWAY: [],
        FTHG: [],
        FTAG: [],
        DIFF: []
    }

    const eventos = (await page.$$('div.event__match--static'));

    for (evento of eventos) {
        try {
            const home = await evento.$eval('div.event__homeParticipant>img', el => el.getAttribute('alt'));
            const away = await evento.$eval('div.event__awayParticipant>img', el => el.getAttribute('alt'));
            const fthg = await evento.$eval('div.event__score--home', el => el.innerText);
            const ftag = await evento.$eval('div.event__score--away', el => el.innerText);
            const diff = parseInt(fthg) - parseInt(ftag);
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
    const filename = path.join(__dirname, `${country}-${leagueName}-2023-2024.csv`);//Trocar o nome do arquivo
    saveToCSV(dados, filename);
    const end = Date.now();
    console.log(`Tempo: ${(end - start) / 1000} segundos`);
}

function saveToCSV(dados, filename) {

    const header = `HOME;AWAY;FTHG;FTAG;DIFF\n`;
   
    const rows = dados.HOME.map((home, index) => `${home};${dados.AWAY[index]};${dados.FTHG[index]};${dados.FTAG[index]};${dados.DIFF[index]}\n`).join('');

    const csvContent = header + rows;

    fs.writeFileSync(filename, csvContent, 'utf8');

}

function saveToCSVLeagues(dados, filename) {

    const rows = dados.LINK.map((link, index) => `https://www.flashscore.com${link}\n`).join('');

    const csvContent = rows;

    fs.writeFileSync(filename, csvContent, 'utf8');

}
