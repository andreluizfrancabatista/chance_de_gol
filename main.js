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

        const response1 = await page.goto('https://www.flashscore.com/football/brazil/serie-a/results/');
        
        if (response1.ok()) {
            //console.log('Página criada com sucesso');
            await scrapeData(page);
        } else {
            console.log('Erro 404.');
        }
        
        const response2 = await page.goto('https://www.flashscore.com/football/brazil/serie-a/fixtures/');
        
        if (response2.ok()) {
            //console.log('Página criada com sucesso');
            await scrapeProx(page);
        } else {
            console.log('Erro 404.');
        }

        await browser.close();
    }
)();

async function scrapeData(page) {
    const start = Date.now();
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
    const filename = path.join(__dirname, 'serie_a_js.csv');
    saveToCSV(dados, filename);
    const end = Date.now();
    console.log(`Tempo: ${(end-start)/1000} segundos`);
}

async function scrapeProx(page) {
    const start = Date.now();
    await page.waitForSelector('div.event__match--static');
    const dados = {
        HOME: [],
        AWAY: []
    }
    
    const eventos = (await page.$$('div.event__match--twoLine'));
    const limit = 12;
    let count = 0;
    
    for (evento of eventos) {
        count++;
        if(count>limit){
            break;
        }
        try {
            const home = await evento.$eval('div.event__homeParticipant>img', el => el.getAttribute('alt'));
            const away = await evento.$eval('div.event__awayParticipant>img', el => el.getAttribute('alt'));
            dados.HOME.push(home);
            dados.AWAY.push(away);
            //console.log(`${home} ${fthg} x ${ftag} ${away}`);
        } catch (error) {
            //console.log(error);
        }

    }
    const filename = path.join(__dirname, 'serie_a_proximos_js.csv');
    saveToCSVProx(dados, filename);
    const end = Date.now();
    console.log(`Tempo: ${(end-start)/1000} segundos`);
}

function saveToCSV(dados, filename) {

    const header = `HOME;AWAY;FTHG;FTAG;DIFF\n`;
   
    const rows = dados.HOME.map((home, index) => `${home};${dados.AWAY[index]};${dados.FTHG[index]};${dados.FTAG[index]};${dados.DIFF[index]}\n`).join('');

    const csvContent = header + rows;

    fs.writeFileSync(filename, csvContent, 'utf8');

}

function saveToCSVProx(dados, filename) {

    const header = `HOME;AWAY;FTHG;FTAG;DIFF\n`;
   
    const rows = dados.HOME.map((home, index) => `${home};${dados.AWAY[index]}\n`).join('');

    const csvContent = header + rows;

    fs.writeFileSync(filename, csvContent, 'utf8');

}
