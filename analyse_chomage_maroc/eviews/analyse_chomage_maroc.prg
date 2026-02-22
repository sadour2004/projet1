'==================================================================
' ANALYSE DU TAUX DE CHOMAGE AU MAROC (1991-2024)
' Source : Banque Mondiale - Indicateur SL.UEM.TOTL.ZS
' Programme EViews
'==================================================================

' Fermer tout workfile ouvert
close @all

'==================================================================
' 1. CREATION DU WORKFILE ET IMPORTATION DES DONNEES
'==================================================================

' Creer un workfile annuel 1991-2027 (marge pour previsions)
wfcreate(wf=chomage_maroc) a 1991 2027

' Saisie directe des donnees (alternative a l'import CSV)
series tchom
smpl 1991 2024
tchom.fill 13.502, 13.781, 14.026, 13.858, 14.054, 13.362, 14.025, 13.359, 13.940, 13.580, 12.460, 11.590, 11.920, 10.830, 11.010, 9.670, 9.560, 9.570, 8.960, 9.090, 8.910, 8.990, 9.230, 9.700, 9.460, 9.300, 9.220, 9.272, 9.191, 11.189, 10.551, 9.413, 8.896, 9.103

' ---- Alternative : importer depuis CSV ----
' (decommentez les 2 lignes suivantes et commentez les lignes ci-dessus)
' read(t=txt, d=c, s=obs) "chomage_maroc.csv"
' rename OBS obs

smpl 1991 2024

'==================================================================
' 2. STATISTIQUES DESCRIPTIVES
'==================================================================

' Statistiques descriptives completes
tchom.stats
tchom.hist

' Distribution et test de normalite (Jarque-Bera)
tchom.distplot hist kernel

'==================================================================
' 3. REPRESENTATION GRAPHIQUE DE LA SERIE
'==================================================================

' Graphique de la serie brute
smpl 1991 2024
graph g_serie.line tchom
g_serie.setelem(1) lcolor(blue) lwidth(2) symbol(circle) symsize(small)
g_serie.addtext(t) "Taux de chomage au Maroc (1991-2024)"
g_serie.addtext(b) "Source : Banque Mondiale - SL.UEM.TOTL.ZS"
g_serie.axis(l) format(dec=1)
g_serie.setelem(1) legend("Taux de chomage (%)")
show g_serie

'==================================================================
' 4. TENDANCE LINEAIRE
'==================================================================

' Creer une variable de tendance
series @trend
series trend = @trend

' Regression lineaire : TCHOM = a + b*TREND
equation eq_trend.ls tchom c trend
show eq_trend

' Stocker les valeurs ajustees
eq_trend.fit tchom_fit

' Graphique serie + tendance
graph g_tendance.line tchom tchom_fit
g_tendance.setelem(1) lcolor(blue) lwidth(2) legend("Observe")
g_tendance.setelem(2) lcolor(red) lwidth(2) lpat(dash) legend("Tendance lineaire")
g_tendance.addtext(t) "Taux de chomage au Maroc : Serie et tendance lineaire"
g_tendance.legend position(topright)
show g_tendance

'==================================================================
' 5. CORRELOGRAMME (ACF / PACF)
'==================================================================

' Correlogramme sur 15 retards
tchom.correl(16)

'==================================================================
' 6. TESTS DE STATIONNARITE
'==================================================================

' ---- Test ADF (Augmented Dickey-Fuller) ----
' H0 : racine unitaire (non stationnaire)

' ADF en niveau - avec constante
tchom.uroot(adf, const, info=aic)

' ADF en niveau - avec constante et tendance
tchom.uroot(adf, trend, info=aic)

' ADF en niveau - sans constante ni tendance
tchom.uroot(adf, none, info=aic)

' ---- Test de Phillips-Perron ----
tchom.uroot(pp, const)
tchom.uroot(pp, trend)

' ---- Test KPSS ----
' H0 : stationnarite
tchom.uroot(kpss, const)
tchom.uroot(kpss, trend)

'==================================================================
' 7. DIFFERENCIATION (si non stationnaire)
'==================================================================

' Serie differenciee d'ordre 1
series dtchom = d(tchom)

' Graphique de la serie differenciee
graph g_diff.line dtchom
g_diff.setelem(1) lcolor(darkgreen) lwidth(1.5)
g_diff.addtext(t) "Serie differenciee d'ordre 1 : D(TCHOM)"
g_diff.draw(line, bottom, rgb(0,0,0)) 0
show g_diff

' Statistiques de la serie differenciee
smpl 1992 2024
dtchom.stats
dtchom.hist

' Correlogramme de la serie differenciee
dtchom.correl(16)

' Test ADF sur la serie differenciee
dtchom.uroot(adf, const, info=aic)
dtchom.uroot(adf, trend, info=aic)

' Test KPSS sur la serie differenciee
dtchom.uroot(kpss, const)

smpl 1991 2024

'==================================================================
' 8. MOYENNES MOBILES
'==================================================================

' Moyenne mobile centree d'ordre 3
series mm3 = @movav(tchom, 3)

' Moyenne mobile centree d'ordre 5
series mm5 = @movav(tchom, 5)

' Graphique avec moyennes mobiles
graph g_mm.line tchom mm3 mm5
g_mm.setelem(1) lcolor(blue) lwidth(1.5) legend("TCHOM")
g_mm.setelem(2) lcolor(orange) lwidth(2) legend("MM(3)")
g_mm.setelem(3) lcolor(red) lwidth(2) legend("MM(5)")
g_mm.addtext(t) "Taux de chomage et moyennes mobiles"
g_mm.legend position(topright)
show g_mm

'==================================================================
' 9. LISSAGE EXPONENTIEL
'==================================================================

' ---- Lissage exponentiel simple (SES) ----
smpl 1991 2024
tchom.smooth(e) ses

' ---- Lissage exponentiel double - Holt ----
tchom.smooth(d) holt

' Graphique comparatif des lissages
graph g_lissage.line tchom ses holt
g_lissage.setelem(1) lcolor(blue) lwidth(1.5) symbol(circle) symsize(small) legend("Observe")
g_lissage.setelem(2) lcolor(green) lwidth(2) legend("Lissage simple (SES)")
g_lissage.setelem(3) lcolor(purple) lwidth(2) legend("Holt (double)")
g_lissage.addtext(t) "Lissages exponentiels du taux de chomage"
g_lissage.legend position(topright)
show g_lissage

'==================================================================
' 10. ESTIMATION DE MODELES ARIMA
'==================================================================

' ---- Identification : observer ACF/PACF de la serie differenciee ----
smpl 1992 2024
dtchom.correl(12)

' ---- Estimation ARIMA(1,1,0) ----
smpl 1991 2024
equation eq_ar1.ls d(tchom) c ar(1)
show eq_ar1

' ---- Estimation ARIMA(0,1,1) ----
equation eq_ma1.ls d(tchom) c ma(1)
show eq_ma1

' ---- Estimation ARIMA(1,1,1) ----
equation eq_arma11.ls d(tchom) c ar(1) ma(1)
show eq_arma11

' ---- Estimation ARIMA(2,1,0) ----
equation eq_ar2.ls d(tchom) c ar(1) ar(2)
show eq_ar2

' ---- Estimation ARIMA(0,1,2) ----
equation eq_ma2.ls d(tchom) c ma(1) ma(2)
show eq_ma2

' ---- Estimation ARIMA(2,1,1) ----
equation eq_arma21.ls d(tchom) c ar(1) ar(2) ma(1)
show eq_arma21

'==================================================================
' 11. CRITERES DE SELECTION DU MODELE
'==================================================================

' Tableau comparatif (lire AIC/SBC dans les sorties des equations)
' Critere d'information Akaike (AIC) et Schwarz (SBC/BIC)
' Le modele avec l'AIC/BIC le plus faible est prefere

' Creer une table de comparaison
table(8,5) tab_selection
tab_selection(1,1) = "Modele"
tab_selection(1,2) = "AIC"
tab_selection(1,3) = "SBC"
tab_selection(1,4) = "R2 ajuste"
tab_selection(1,5) = "SE regression"

tab_selection(2,1) = "ARIMA(1,1,0)"
tab_selection(2,2) = eq_ar1.@aic
tab_selection(2,3) = eq_ar1.@sc
tab_selection(2,4) = eq_ar1.@rbar2
tab_selection(2,5) = eq_ar1.@se

tab_selection(3,1) = "ARIMA(0,1,1)"
tab_selection(3,2) = eq_ma1.@aic
tab_selection(3,3) = eq_ma1.@sc
tab_selection(3,4) = eq_ma1.@rbar2
tab_selection(3,5) = eq_ma1.@se

tab_selection(4,1) = "ARIMA(1,1,1)"
tab_selection(4,2) = eq_arma11.@aic
tab_selection(4,3) = eq_arma11.@sc
tab_selection(4,4) = eq_arma11.@rbar2
tab_selection(4,5) = eq_arma11.@se

tab_selection(5,1) = "ARIMA(2,1,0)"
tab_selection(5,2) = eq_ar2.@aic
tab_selection(5,3) = eq_ar2.@sc
tab_selection(5,4) = eq_ar2.@rbar2
tab_selection(5,5) = eq_ar2.@se

tab_selection(6,1) = "ARIMA(0,1,2)"
tab_selection(6,2) = eq_ma2.@aic
tab_selection(6,3) = eq_ma2.@sc
tab_selection(6,4) = eq_ma2.@rbar2
tab_selection(6,5) = eq_ma2.@se

tab_selection(7,1) = "ARIMA(2,1,1)"
tab_selection(7,2) = eq_arma21.@aic
tab_selection(7,3) = eq_arma21.@sc
tab_selection(7,4) = eq_arma21.@rbar2
tab_selection(7,5) = eq_arma21.@se

show tab_selection

'==================================================================
' 12. DIAGNOSTIC DU MODELE RETENU
'==================================================================

' (On utilise eq_ma1 comme exemple - a adapter selon les criteres AIC/BIC)
' Vous pouvez changer "eq_ma1" par le modele ayant le meilleur AIC

' Residus du modele
eq_ma1.makeresids resid_ma1

' Graphique des residus
graph g_resid.line resid_ma1
g_resid.setelem(1) lcolor(red) lwidth(1)
g_resid.addtext(t) "Residus du modele ARIMA(0,1,1)"
g_resid.draw(line, bottom, rgb(0,0,0)) 0
show g_resid

' Correlogramme des residus (test de bruit blanc)
resid_ma1.correl(12)

' Test de normalite des residus (Jarque-Bera)
resid_ma1.hist

' Test de Ljung-Box / Q-stat (dans le correlogramme)
' => Si toutes les p-values > 0.05, les residus sont un bruit blanc

' Test ARCH sur les residus
eq_ma1.archtest(4)

'==================================================================
' 13. PREVISIONS
'==================================================================

' Etendre l'echantillon pour les previsions
smpl 1991 2024

' Re-estimer le modele retenu sur tout l'echantillon
equation eq_best.ls d(tchom) c ma(1)

' Prevision statique (in-sample)
smpl 1991 2024
eq_best.fit(f=na) tchom_fcast_s

' Prevision dynamique (out-of-sample) 2025-2027
smpl 1991 2027
eq_best.forecast tchom_fcast

' Graphique des previsions
graph g_prev.line tchom tchom_fcast
g_prev.setelem(1) lcolor(blue) lwidth(2) legend("Observe")
g_prev.setelem(2) lcolor(red) lwidth(2) lpat(dash) legend("Prevision ARIMA")
g_prev.addtext(t) "Previsions du taux de chomage au Maroc (2025-2027)"
g_prev.legend position(topright)
show g_prev

' Afficher les previsions
smpl 2025 2027
show tchom_fcast

'==================================================================
' 14. TEST DE CAUSALITE DE GRANGER (optionnel)
'==================================================================
' Si vous disposez d'autres series (PIB, investissement, etc.)
' vous pouvez tester la causalite :
' group grp_causal tchom pib
' grp_causal.cause(4)

'==================================================================
' 15. TABLEAU RECAPITULATIF FINAL
'==================================================================

smpl 1991 2024

table(12,2) tab_recap
tab_recap(1,1) = "STATISTIQUE"
tab_recap(1,2) = "VALEUR"
tab_recap(2,1) = "Nombre d'observations"
tab_recap(2,2) = @obs(tchom)
tab_recap(3,1) = "Moyenne"
tab_recap(3,2) = @mean(tchom)
tab_recap(4,1) = "Mediane"
tab_recap(4,2) = @median(tchom)
tab_recap(5,1) = "Ecart-type"
tab_recap(5,2) = @stdev(tchom)
tab_recap(6,1) = "Minimum"
tab_recap(6,2) = @min(tchom)
tab_recap(7,1) = "Maximum"
tab_recap(7,2) = @max(tchom)
tab_recap(8,1) = "Skewness"
tab_recap(8,2) = @skew(tchom)
tab_recap(9,1) = "Kurtosis"
tab_recap(9,2) = @kurt(tchom)
tab_recap(10,1) = "Jarque-Bera stat"
tab_recap(10,2) = @jbstat(tchom)
tab_recap(11,1) = "Jarque-Bera p-value"
tab_recap(11,2) = @jbprob(tchom)
tab_recap(12,1) = "Periode"
tab_recap(12,2) = "1991 - 2024"

show tab_recap

'==================================================================
' SAUVEGARDE DU WORKFILE
'==================================================================

wfsave chomage_maroc.wf1

'==================================================================
' FIN DU PROGRAMME
'==================================================================
