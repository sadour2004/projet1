# Guide d'utilisation - Analyse du chomage au Maroc sur EViews

## Fichiers fournis

| Fichier | Description |
|---------|-------------|
| `analyse_chomage_maroc.prg` | Programme EViews complet (a executer) |
| `chomage_maroc.csv` | Donnees brutes pour import manuel |

## Methode 1 : Execution du programme (recommandee)

1. Ouvrir EViews
2. Aller dans **File > Open > Program...**
3. Selectionner `analyse_chomage_maroc.prg`
4. Cliquer sur **Run** (ou appuyer sur `F5`)
5. Le programme cree automatiquement le workfile, importe les donnees et execute toute l'analyse

## Methode 2 : Import manuel du CSV

1. Ouvrir EViews
2. **File > New > Workfile...**
   - Type : `Dated - regular frequency`
   - Frequency : `Annual`
   - Start date : `1991`
   - End date : `2024`
   - Cliquer OK
3. **File > Import > Import from File...**
   - Selectionner `chomage_maroc.csv`
   - Delimiter : Comma
   - La serie `TCHOM` sera creee automatiquement

## Contenu de l'analyse (15 sections)

### Section 1 - Donnees
Creation du workfile annuel et chargement des 34 observations (1991-2024).

### Section 2 - Statistiques descriptives
`tchom.stats` et `tchom.hist` : moyenne, ecart-type, min, max, Jarque-Bera.

### Section 3 - Graphique de la serie
Visualisation de l'evolution du taux de chomage.

### Section 4 - Tendance lineaire
Regression `TCHOM = a + b*TREND` pour quantifier la pente.

### Section 5 - Correlogramme (ACF/PACF)
`tchom.correl(16)` : identification de la structure d'autocorrelation.

### Section 6 - Tests de stationnarite
- **ADF** (Augmented Dickey-Fuller) : avec constante, avec tendance, sans
- **Phillips-Perron** : avec constante, avec tendance
- **KPSS** : avec constante, avec tendance

### Section 7 - Differenciation
Creation de `DTCHOM = D(TCHOM)` et re-test de stationnarite.

### Section 8 - Moyennes mobiles
MM(3) et MM(5) centrees pour visualiser la tendance.

### Section 9 - Lissage exponentiel
- Lissage simple (SES)
- Lissage double de Holt

### Section 10 - Modeles ARIMA
Estimation de 6 modeles candidats :
- ARIMA(1,1,0), ARIMA(0,1,1), ARIMA(1,1,1)
- ARIMA(2,1,0), ARIMA(0,1,2), ARIMA(2,1,1)

### Section 11 - Selection du modele
Tableau comparatif AIC / BIC / R2 ajuste / SE pour choisir le meilleur modele.

### Section 12 - Diagnostic des residus
- Correlogramme des residus
- Test Jarque-Bera (normalite)
- Test ARCH (heteroscedasticite)

### Section 13 - Previsions
Previsions sur 2025-2027 avec le modele retenu.

### Section 14 - Causalite de Granger
(Optionnel) Si d'autres series sont disponibles.

### Section 15 - Recapitulatif
Tableau synthese de toutes les statistiques.

## Interpretation attendue

- La serie est **non stationnaire en niveau** (ADF non significatif, KPSS significatif)
- Apres differenciation d'ordre 1, la serie devient **stationnaire** -> **I(1)**
- Tendance lineaire **baissiere** significative (-0.17 point/an)
- Le modele ARIMA optimal est a choisir selon les criteres AIC/BIC les plus faibles
- Les residus du modele retenu doivent etre un **bruit blanc**
