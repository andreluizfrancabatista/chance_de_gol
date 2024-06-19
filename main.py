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
# options.add_argument('--headless') # Não sei porque mas está dando erro na página de contratos.
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

# Com o WebDrive a gente consegue a pedir a página (URL)
wd_Chrome.get("https://www.flashscore.com/football/brazil/serie-b/results/")
wd_Chrome.get_screenshot_as_file("screenshot.png")