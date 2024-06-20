import numpy as np
import pandas as pd

def build_system_from_csv(file_path):
    # Ler o arquivo CSV
    df = pd.read_csv(file_path, sep=';')

    # Extrair as colunas necessárias
    home_teams = df['HOME'].values
    away_teams = df['AWAY'].values
    diffs = df['DIFF'].values

    # Coletar todas as variáveis (times)
    variables = set(home_teams).union(set(away_teams))
    variables = sorted(variables)

    num_vars = len(variables)
    var_index = {var: idx for idx, var in enumerate(variables)}

    # Construir a matriz A e o vetor b
    A = np.zeros((len(df), num_vars))
    b = np.zeros(len(df))

    for i in range(len(df)):
        home_team = home_teams[i]
        away_team = away_teams[i]
        diff = diffs[i]

        A[i, var_index[home_team]] = 1
        A[i, var_index[away_team]] = -1
        b[i] = diff

    return A, b, variables

def solve_system_from_csv(file_path):
    A, b, variables = build_system_from_csv(file_path)
    x, residuals, rank, s = np.linalg.lstsq(A, b, rcond=None)
    solution = {variables[i]: x[i] for i in range(len(variables))}
    return solution

def add_scores_to_new_csv(solution, new_file_path):
    # Ler o novo arquivo CSV
    df_new = pd.read_csv(new_file_path, sep=';')

    # Adicionar colunas com as pontuações dos times e a diff
    df_new['HOME_SCORE'] = df_new['HOME'].map(solution)
    df_new['AWAY_SCORE'] = df_new['AWAY'].map(solution)
    df_new['DIFF'] = (df_new['HOME_SCORE'] - df_new['AWAY_SCORE']).map('{:.2f}'.format)

    return df_new


# Definir a Série A ou Série B
serie = 'b'
# O arquivo CSV deve estar no seguinte formato
# HOME;AWAY;FTHG;FTAG;DIFF
# Caminho para o arquivo CSV
file_path = f'serie_{serie}.csv'

# O arquivo CSV deve estar no seguinte formato
# HOME;AWAY;FTHG;FTAG;DIFF
# df = pd.read_csv(file_path)

# Resolver o sistema a partir do arquivo CSV
solution = solve_system_from_csv(file_path)
solution_sorted = {k: v for k, v in sorted(solution.items(), key=lambda item: item[1], reverse=True)}
# Exibir a solução em ordem alfabética
for var, value in solution.items():
    print(f"{var} = {value:.2f}")

# Exibir a solução ordenada por força/ranking
for var, value in solution_sorted.items():
    print(f"{var} = {value:.2f}")

# Caminho para o novo arquivo CSV
# O arquivo CSV deve estar no seguinte formato
# HOME;AWAY
new_file_path = f'serie_{serie}_proximos.csv'

# Adicionar pontuações e diffs ao novo CSV
df_with_scores = add_scores_to_new_csv(solution, new_file_path)

# Exibir o DataFrame resultante
print()
print(df_with_scores)
