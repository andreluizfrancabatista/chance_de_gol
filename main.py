from tqdm import tqdm
import time
import pandas as pd
import sys
import os
import numpy as np

"""# Configuração do Web-Driver"""
# Utilizando o WebDriver do Selenium
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

# Instanciando o Objeto ChromeOptions
options = webdriver.ChromeOptions()

# Passando algumas opções para esse ChromeOptions
options.add_argument('--headless')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')
options.add_argument('--start-maximized')
options.add_argument('--ignore-certificate-errors')
options.add_argument('--disable-crash-reporter')
options.add_argument('--log-level=3')
options.add_argument('--disable-gpu')
options.add_argument("--disable-extensions")
options.add_argument("--window-size=1920,1080")
options.add_argument('--allow-running-insecure-content')
options.add_argument("--proxy-server='direct://'")
options.add_argument("--proxy-bypass-list=*")

# Criação do WebDriver do Chrome
wd_Chrome = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

"""# Importando as Bibliotecas"""

"""# Iniciando a Raspagem de Dados"""

# Links
# Results Serie B
# https://www.flashscore.com/football/brazil/serie-b/results/
# Schedule/Fixtures Série B
# https://www.flashscore.com/football/brazil/serie-b/fixtures/

# Definir Série A ou Série B
serie = 'a' # ou b

# Coletar os jogos e resultados passados
wd_Chrome.get(f'https://www.flashscore.com/football/brazil/serie-{serie}/results/')
# wd_Chrome.get_screenshot_as_file("screenshot.png")

results = {
    "HOME": [],
    "AWAY": [],
    "FTHG": [],
    "FTAG": [],
    "DIFF": []
}

jogos = wd_Chrome.find_elements(By.CSS_SELECTOR, 'div.event__match--static')

for jogo in jogos:
    try:
        home = jogo.find_element(By.CSS_SELECTOR, 'div.event__homeParticipant>img')
        home = home.get_attribute('alt')
        away = jogo.find_element(By.CSS_SELECTOR, 'div.event__awayParticipant>img')
        away = away.get_attribute('alt')
        fthg = jogo.find_element(By.CSS_SELECTOR, 'div.event__score--home').text
        fthg = int(fthg)
        ftag = jogo.find_element(By.CSS_SELECTOR, 'div.event__score--away').text
        ftag = int(ftag)
        diff = fthg - ftag
        # print(f'{home}, {away}, {fthg}, {ftag}, {diff}')
        results['HOME'].append(home)
        results['AWAY'].append(away)
        results['FTHG'].append(fthg)
        results['FTAG'].append(ftag)
        results['DIFF'].append(diff)
    except Exception as error:
        print(f'Erro: {error}')
        pass

df = pd.DataFrame(results)
df.reset_index(inplace=True, drop=True)
df.index = df.index.set_names(['Index'])
df = df.rename(index=lambda x: x + 1)

filename = f'serie_{serie}.csv'
df.to_csv(filename, sep=";", index=False)


# Coletar os jogos futuros
wd_Chrome.get(f'https://www.flashscore.com/football/brazil/serie-{serie}/fixtures/')
# wd_Chrome.get_screenshot_as_file("screenshot.png")

fixtures = {
    "HOME": [],
    "AWAY": []
}

#div da rodada div.event__round--static
rodada = wd_Chrome.find_elements(By.CSS_SELECTOR, 'div.event__round--static')[0]
jogo = wd_Chrome.execute_script("return arguments[0].nextElementSibling;", rodada)
jogos = []
while(jogo.get_attribute('id')):
    # print(jogo.get_attribute('id'), type(jogo.get_attribute('id')))
    jogos.append(jogo)
    jogo = wd_Chrome.execute_script("return arguments[0].nextElementSibling;", jogo)


for jogo in jogos:
    try:
        home = jogo.find_element(By.CSS_SELECTOR, 'div.event__homeParticipant>img')
        home = home.get_attribute('alt')
        away = jogo.find_element(By.CSS_SELECTOR, 'div.event__awayParticipant>img')
        away = away.get_attribute('alt')
        fixtures['HOME'].append(home)
        fixtures['AWAY'].append(away)
    except Exception as error:
        print(f'Erro: {error}')
        pass

wd_Chrome.quit()

df = pd.DataFrame(fixtures)
df.reset_index(inplace=True, drop=True)
df.index = df.index.set_names(['Index'])
df = df.rename(index=lambda x: x + 1)

filename = f'serie_{serie}_proximos.csv'
df.to_csv(filename, sep=";", index=False)