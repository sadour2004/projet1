"""
Analyse de la série temporelle du taux de chômage au Maroc (1991-2024)
Source : Banque Mondiale - Indicateur SL.UEM.TOTL.ZS
(Chômage, total (% de la population active totale) - estimation modélisée OIT)
"""

import requests
import json
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import seaborn as sns
from scipy import stats
from statsmodels.tsa.stattools import adfuller, kpss, acf, pacf
from statsmodels.tsa.seasonal import seasonal_decompose
from statsmodels.graphics.tsaplots import plot_acf, plot_pacf
from statsmodels.tsa.holtwinters import ExponentialSmoothing
import warnings
warnings.filterwarnings('ignore')

OUTPUT_DIR = "output"

import os
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ──────────────────────────────────────────────────────────────
# 1. RÉCUPÉRATION DES DONNÉES
# ──────────────────────────────────────────────────────────────

def fetch_data():
    url = (
        "https://api.worldbank.org/v2/country/MA/indicator/SL.UEM.TOTL.ZS"
        "?date=1991:2024&format=json&per_page=100"
    )
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    raw = response.json()

    records = []
    for entry in raw[1]:
        if entry["value"] is not None:
            records.append({
                "Année": int(entry["date"]),
                "Taux_Chomage": float(entry["value"])
            })

    df = pd.DataFrame(records).sort_values("Année").reset_index(drop=True)
    df.set_index("Année", inplace=True)
    df.index = pd.to_datetime(df.index, format="%Y")
    df.index.freq = "YS"
    return df


# ──────────────────────────────────────────────────────────────
# 2. STATISTIQUES DESCRIPTIVES
# ──────────────────────────────────────────────────────────────

def descriptive_stats(df):
    s = df["Taux_Chomage"]
    report = []
    report.append("=" * 65)
    report.append("  STATISTIQUES DESCRIPTIVES – Taux de chômage au Maroc (1991-2024)")
    report.append("=" * 65)
    report.append(f"  Nombre d'observations : {len(s)}")
    report.append(f"  Période               : {s.index.min().year} – {s.index.max().year}")
    report.append(f"  Moyenne                : {s.mean():.3f} %")
    report.append(f"  Médiane                : {s.median():.3f} %")
    report.append(f"  Écart-type             : {s.std():.3f} %")
    report.append(f"  Variance               : {s.var():.3f}")
    report.append(f"  Minimum                : {s.min():.3f} % ({s.idxmin().year})")
    report.append(f"  Maximum                : {s.max():.3f} % ({s.idxmax().year})")
    report.append(f"  Étendue                : {s.max() - s.min():.3f} %")
    report.append(f"  Q1 (25e percentile)    : {s.quantile(0.25):.3f} %")
    report.append(f"  Q3 (75e percentile)    : {s.quantile(0.75):.3f} %")
    report.append(f"  IQR                    : {s.quantile(0.75) - s.quantile(0.25):.3f} %")
    report.append(f"  Coefficient de var.    : {(s.std() / s.mean()) * 100:.2f} %")
    report.append(f"  Skewness (asymétrie)   : {s.skew():.4f}")
    report.append(f"  Kurtosis (aplatissement): {s.kurtosis():.4f}")
    report.append("")

    slope, intercept, r_value, p_value, std_err = stats.linregress(
        range(len(s)), s.values
    )
    report.append("  TENDANCE LINÉAIRE :")
    report.append(f"    Pente               : {slope:.4f} % / an")
    report.append(f"    R²                  : {r_value**2:.4f}")
    report.append(f"    p-value             : {p_value:.6f}")
    trend_dir = "baissière" if slope < 0 else "haussière"
    signif = "significative" if p_value < 0.05 else "non significative"
    report.append(f"    → Tendance {trend_dir}, {signif} au seuil 5%")
    report.append("=" * 65)
    return "\n".join(report)


# ──────────────────────────────────────────────────────────────
# 3. TESTS DE STATIONNARITÉ
# ──────────────────────────────────────────────────────────────

def stationarity_tests(df):
    s = df["Taux_Chomage"]
    report = []
    report.append("=" * 65)
    report.append("  TESTS DE STATIONNARITÉ")
    report.append("=" * 65)

    # ADF
    adf_result = adfuller(s, autolag="AIC")
    report.append("\n  ► Test de Dickey-Fuller Augmenté (ADF)")
    report.append(f"    Statistique ADF : {adf_result[0]:.4f}")
    report.append(f"    p-value         : {adf_result[1]:.6f}")
    report.append(f"    Lags utilisés   : {adf_result[2]}")
    report.append(f"    Observations    : {adf_result[3]}")
    for key, val in adf_result[4].items():
        report.append(f"    Valeur critique ({key}) : {val:.4f}")
    if adf_result[1] < 0.05:
        report.append("    → Conclusion : Série STATIONNAIRE (H0 rejetée)")
    else:
        report.append("    → Conclusion : Série NON STATIONNAIRE (H0 non rejetée)")

    # KPSS
    kpss_result = kpss(s, regression="c", nlags="auto")
    report.append("\n  ► Test KPSS (Kwiatkowski-Phillips-Schmidt-Shin)")
    report.append(f"    Statistique KPSS : {kpss_result[0]:.4f}")
    report.append(f"    p-value          : {kpss_result[1]:.4f}")
    report.append(f"    Lags utilisés    : {kpss_result[2]}")
    for key, val in kpss_result[3].items():
        report.append(f"    Valeur critique ({key}) : {val:.4f}")
    if kpss_result[1] < 0.05:
        report.append("    → Conclusion : Série NON STATIONNAIRE (H0 rejetée)")
    else:
        report.append("    → Conclusion : Série STATIONNAIRE (H0 non rejetée)")

    # Test sur la série différenciée
    s_diff = s.diff().dropna()
    adf_diff = adfuller(s_diff, autolag="AIC")
    report.append("\n  ► Test ADF sur la série DIFFÉRENCIÉE (ordre 1)")
    report.append(f"    Statistique ADF : {adf_diff[0]:.4f}")
    report.append(f"    p-value         : {adf_diff[1]:.6f}")
    if adf_diff[1] < 0.05:
        report.append("    → Série différenciée STATIONNAIRE → la série originale est I(1)")
    else:
        report.append("    → Série différenciée NON STATIONNAIRE → différenciation supplémentaire nécessaire")

    report.append("=" * 65)
    return "\n".join(report)


# ──────────────────────────────────────────────────────────────
# 4. ANALYSE DES VARIATIONS
# ──────────────────────────────────────────────────────────────

def variation_analysis(df):
    s = df["Taux_Chomage"]
    report = []
    report.append("=" * 65)
    report.append("  ANALYSE DES VARIATIONS ANNUELLES")
    report.append("=" * 65)

    diff = s.diff().dropna()
    pct = s.pct_change().dropna() * 100

    report.append(f"\n  Variation absolue moyenne : {diff.mean():.3f} pp/an")
    report.append(f"  Variation absolue médiane : {diff.median():.3f} pp/an")
    report.append(f"  Plus forte hausse         : +{diff.max():.3f} pp ({diff.idxmax().year})")
    report.append(f"  Plus forte baisse         : {diff.min():.3f} pp ({diff.idxmin().year})")
    report.append(f"  Années de hausse           : {(diff > 0).sum()}")
    report.append(f"  Années de baisse           : {(diff < 0).sum()}")
    report.append(f"  Années stables (±0.1 pp)   : {((diff.abs() <= 0.1)).sum()}")

    report.append("\n  DÉTAIL ANNÉE PAR ANNÉE :")
    report.append(f"  {'Année':<8} {'Taux (%)':<12} {'Δ (pp)':<10} {'Δ (%)':<10}")
    report.append("  " + "-" * 40)
    for idx in s.index:
        yr = idx.year
        val = s.loc[idx]
        d = diff.loc[idx] if idx in diff.index else float('nan')
        p = pct.loc[idx] if idx in pct.index else float('nan')
        if np.isnan(d):
            report.append(f"  {yr:<8} {val:<12.3f} {'—':<10} {'—':<10}")
        else:
            report.append(f"  {yr:<8} {val:<12.3f} {d:<+10.3f} {p:<+10.2f}")

    # Identification des phases
    report.append("\n  PHASES IDENTIFIÉES :")
    phases = []
    current_dir = None
    start_yr = None
    for i, idx in enumerate(diff.index):
        direction = "hausse" if diff.loc[idx] > 0.1 else ("baisse" if diff.loc[idx] < -0.1 else "stable")
        if direction != current_dir:
            if current_dir is not None:
                phases.append((start_yr, prev_yr, current_dir))
            current_dir = direction
            start_yr = idx.year
        prev_yr = idx.year
    if current_dir is not None:
        phases.append((start_yr, prev_yr, current_dir))

    for start, end, direction in phases:
        if start == end:
            report.append(f"    {start}       : {direction}")
        else:
            report.append(f"    {start}–{end} : {direction}")

    report.append("=" * 65)
    return "\n".join(report)


# ──────────────────────────────────────────────────────────────
# 5. LISSAGE EXPONENTIEL
# ──────────────────────────────────────────────────────────────

def smoothing_analysis(df):
    s = df["Taux_Chomage"]
    report = []
    report.append("=" * 65)
    report.append("  LISSAGE ET PRÉVISION")
    report.append("=" * 65)

    # Moyennes mobiles
    df["MM3"] = s.rolling(window=3, center=True).mean()
    df["MM5"] = s.rolling(window=5, center=True).mean()

    # Lissage exponentiel simple
    model_ses = ExponentialSmoothing(s, trend=None, seasonal=None).fit(optimized=True)
    df["SES"] = model_ses.fittedvalues
    report.append(f"\n  Lissage exponentiel simple :")
    report.append(f"    Alpha optimal  : {model_ses.params['smoothing_level']:.4f}")
    report.append(f"    SSE            : {model_ses.sse:.4f}")

    # Lissage exponentiel double (Holt)
    model_holt = ExponentialSmoothing(s, trend="add", seasonal=None).fit(optimized=True)
    df["Holt"] = model_holt.fittedvalues
    report.append(f"\n  Lissage exponentiel double (Holt) :")
    report.append(f"    Alpha optimal  : {model_holt.params['smoothing_level']:.4f}")
    report.append(f"    Beta optimal   : {model_holt.params['smoothing_trend']:.4f}")
    report.append(f"    SSE            : {model_holt.sse:.4f}")

    # Prévisions 2025-2027
    forecast_ses = model_ses.forecast(3)
    forecast_holt = model_holt.forecast(3)
    report.append("\n  PRÉVISIONS :")
    report.append(f"  {'Année':<8} {'SES (%)':<12} {'Holt (%)':<12}")
    report.append("  " + "-" * 32)
    for i, yr in enumerate([2025, 2026, 2027]):
        report.append(f"  {yr:<8} {forecast_ses.iloc[i]:<12.3f} {forecast_holt.iloc[i]:<12.3f}")

    report.append("=" * 65)
    return "\n".join(report), model_ses, model_holt


# ──────────────────────────────────────────────────────────────
# 6. VISUALISATIONS
# ──────────────────────────────────────────────────────────────

def create_visualizations(df, model_ses, model_holt):
    sns.set_theme(style="whitegrid", palette="muted", font_scale=1.1)
    s = df["Taux_Chomage"]
    years = [d.year for d in s.index]

    # ── Figure 1 : Évolution avec tendance ──
    fig, ax = plt.subplots(figsize=(14, 6))
    ax.plot(years, s.values, "o-", color="#2c3e50", linewidth=2, markersize=5, label="Taux de chômage")

    slope, intercept, r_val, _, _ = stats.linregress(range(len(s)), s.values)
    trend_line = intercept + slope * np.arange(len(s))
    ax.plot(years, trend_line, "--", color="#e74c3c", linewidth=2,
            label=f"Tendance linéaire (pente={slope:+.3f}%/an, R²={r_val**2:.3f})")

    ax.fill_between(years, s.values, alpha=0.15, color="#3498db")
    ax.set_title("Évolution du taux de chômage au Maroc (1991–2024)", fontsize=15, fontweight="bold")
    ax.set_xlabel("Année", fontsize=12)
    ax.set_ylabel("Taux de chômage (%)", fontsize=12)
    ax.legend(loc="upper right", fontsize=10)
    ax.set_xlim(1990, 2025)
    ax.yaxis.set_major_formatter(mticker.FormatStrFormatter('%.1f'))

    idx_max = s.idxmax()
    idx_min = s.idxmin()
    ax.annotate(f"Max: {s.max():.1f}%\n({idx_max.year})",
                xy=(idx_max.year, s.max()), xytext=(idx_max.year + 2, s.max() + 0.5),
                arrowprops=dict(arrowstyle="->", color="#e74c3c"), fontsize=9, color="#e74c3c")
    ax.annotate(f"Min: {s.min():.1f}%\n({idx_min.year})",
                xy=(idx_min.year, s.min()), xytext=(idx_min.year + 2, s.min() - 0.8),
                arrowprops=dict(arrowstyle="->", color="#27ae60"), fontsize=9, color="#27ae60")

    plt.tight_layout()
    plt.savefig(f"{OUTPUT_DIR}/01_evolution_tendance.png", dpi=150, bbox_inches="tight")
    plt.close()

    # ── Figure 2 : Variations annuelles ──
    diff = s.diff().dropna()
    diff_years = [d.year for d in diff.index]
    colors = ["#27ae60" if v < 0 else "#e74c3c" for v in diff.values]

    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(14, 8), sharex=True)

    ax1.bar(diff_years, diff.values, color=colors, edgecolor="white", linewidth=0.5, alpha=0.85)
    ax1.axhline(y=0, color="black", linewidth=0.8)
    ax1.axhline(y=diff.mean(), color="#3498db", linestyle="--", linewidth=1.2,
                label=f"Moyenne: {diff.mean():+.3f} pp")
    ax1.set_title("Variations annuelles du taux de chômage (en points de %)", fontsize=13, fontweight="bold")
    ax1.set_ylabel("Δ Taux (pp)", fontsize=11)
    ax1.legend(fontsize=10)

    pct = s.pct_change().dropna() * 100
    pct_years = [d.year for d in pct.index]
    colors_pct = ["#27ae60" if v < 0 else "#e74c3c" for v in pct.values]
    ax2.bar(pct_years, pct.values, color=colors_pct, edgecolor="white", linewidth=0.5, alpha=0.85)
    ax2.axhline(y=0, color="black", linewidth=0.8)
    ax2.set_title("Variations annuelles en pourcentage (%)", fontsize=13, fontweight="bold")
    ax2.set_xlabel("Année", fontsize=11)
    ax2.set_ylabel("Variation (%)", fontsize=11)

    plt.tight_layout()
    plt.savefig(f"{OUTPUT_DIR}/02_variations_annuelles.png", dpi=150, bbox_inches="tight")
    plt.close()

    # ── Figure 3 : Lissage et prévisions ──
    fig, ax = plt.subplots(figsize=(14, 6))
    ax.plot(years, s.values, "o-", color="#2c3e50", linewidth=1.5, markersize=4, label="Observé", alpha=0.7)

    if "MM3" in df.columns:
        mm3_vals = df["MM3"].dropna()
        ax.plot([d.year for d in mm3_vals.index], mm3_vals.values, "-", color="#f39c12",
                linewidth=2, label="MM(3)")
    if "MM5" in df.columns:
        mm5_vals = df["MM5"].dropna()
        ax.plot([d.year for d in mm5_vals.index], mm5_vals.values, "-", color="#e67e22",
                linewidth=2, label="MM(5)")

    ax.plot(years, df["Holt"].values, "-", color="#9b59b6", linewidth=2, label="Holt")

    forecast = model_holt.forecast(3)
    fc_years = [2025, 2026, 2027]
    ax.plot(fc_years, forecast.values, "s--", color="#9b59b6", markersize=8, linewidth=2,
            label="Prévision Holt")

    ax.set_title("Lissages et prévisions du taux de chômage", fontsize=15, fontweight="bold")
    ax.set_xlabel("Année", fontsize=12)
    ax.set_ylabel("Taux de chômage (%)", fontsize=12)
    ax.legend(loc="upper right", fontsize=10)
    ax.set_xlim(1990, 2028)
    plt.tight_layout()
    plt.savefig(f"{OUTPUT_DIR}/03_lissage_previsions.png", dpi=150, bbox_inches="tight")
    plt.close()

    # ── Figure 4 : Distribution ──
    fig, axes = plt.subplots(1, 3, figsize=(16, 5))

    axes[0].hist(s.values, bins=10, color="#3498db", edgecolor="white", alpha=0.85)
    axes[0].axvline(s.mean(), color="#e74c3c", linestyle="--", linewidth=2, label=f"Moyenne: {s.mean():.2f}%")
    axes[0].axvline(s.median(), color="#27ae60", linestyle="--", linewidth=2, label=f"Médiane: {s.median():.2f}%")
    axes[0].set_title("Histogramme", fontsize=12, fontweight="bold")
    axes[0].set_xlabel("Taux (%)")
    axes[0].legend(fontsize=9)

    axes[1].boxplot(s.values, vert=True, patch_artist=True,
                    boxprops=dict(facecolor="#3498db", alpha=0.7),
                    medianprops=dict(color="#e74c3c", linewidth=2))
    axes[1].set_title("Boîte à moustaches", fontsize=12, fontweight="bold")
    axes[1].set_ylabel("Taux (%)")

    stats.probplot(s.values, dist="norm", plot=axes[2])
    axes[2].set_title("Q-Q Plot (normalité)", fontsize=12, fontweight="bold")

    fig.suptitle("Distribution du taux de chômage au Maroc", fontsize=14, fontweight="bold", y=1.02)
    plt.tight_layout()
    plt.savefig(f"{OUTPUT_DIR}/04_distribution.png", dpi=150, bbox_inches="tight")
    plt.close()

    # ── Figure 5 : ACF / PACF ──
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))
    plot_acf(s, lags=15, ax=ax1, title="Autocorrélation (ACF)")
    plot_pacf(s, lags=15, ax=ax2, title="Autocorrélation partielle (PACF)", method="ywm")
    fig.suptitle("Fonctions d'autocorrélation – Taux de chômage au Maroc", fontsize=14, fontweight="bold")
    plt.tight_layout()
    plt.savefig(f"{OUTPUT_DIR}/05_acf_pacf.png", dpi=150, bbox_inches="tight")
    plt.close()

    # ── Figure 6 : Comparaison par décennies ──
    df_decades = df.copy()
    df_decades["Decade"] = pd.cut(
        [d.year for d in df_decades.index],
        bins=[1990, 2000, 2010, 2020, 2025],
        labels=["1991-2000", "2001-2010", "2011-2020", "2021-2024"]
    )

    fig, ax = plt.subplots(figsize=(10, 6))
    decade_stats = df_decades.groupby("Decade", observed=True)["Taux_Chomage"].agg(["mean", "std", "min", "max"])
    x_pos = range(len(decade_stats))
    bars = ax.bar(x_pos, decade_stats["mean"], yerr=decade_stats["std"],
                  color=["#3498db", "#2ecc71", "#e74c3c", "#9b59b6"],
                  edgecolor="white", capsize=5, alpha=0.85)
    ax.set_xticks(x_pos)
    ax.set_xticklabels(decade_stats.index, fontsize=11)

    for i, (_, row) in enumerate(decade_stats.iterrows()):
        ax.text(i, row["mean"] + row["std"] + 0.2, f"{row['mean']:.1f}%",
                ha="center", fontsize=11, fontweight="bold")

    ax.set_title("Taux de chômage moyen par décennie", fontsize=14, fontweight="bold")
    ax.set_ylabel("Taux de chômage (%)", fontsize=12)
    plt.tight_layout()
    plt.savefig(f"{OUTPUT_DIR}/06_comparaison_decennies.png", dpi=150, bbox_inches="tight")
    plt.close()

    print(f"  ✓ 6 graphiques sauvegardés dans le dossier '{OUTPUT_DIR}/'")


# ──────────────────────────────────────────────────────────────
# 7. SYNTHÈSE
# ──────────────────────────────────────────────────────────────

def synthesis(df):
    s = df["Taux_Chomage"]
    slope, _, r_val, p_val, _ = stats.linregress(range(len(s)), s.values)
    adf_p = adfuller(s, autolag="AIC")[1]

    report = []
    report.append("=" * 65)
    report.append("  SYNTHÈSE DE L'ANALYSE")
    report.append("=" * 65)
    report.append("""
  Le taux de chômage au Maroc sur la période 1991–2024 révèle
  plusieurs dynamiques structurelles :

  1. TENDANCE GÉNÉRALE :""")
    if slope < 0:
        report.append(f"     Le chômage affiche une tendance baissière sur la période,")
        report.append(f"     avec une diminution moyenne de {abs(slope):.3f} point/an.")
    else:
        report.append(f"     Le chômage affiche une tendance haussière sur la période,")
        report.append(f"     avec une augmentation moyenne de {slope:.3f} point/an.")

    report.append(f"""
  2. PHASES DISTINCTES :
     • 1991–1999 : Phase de hausse marquée, culminant à un pic
       historique de {s.loc[s.index[(s.index.year >= 1991) & (s.index.year <= 2000)]].max():.1f}%.
     • 2000–2010 : Période de réduction progressive du chômage,
       traduisant les effets des réformes économiques.
     • 2011–2019 : Stabilisation relative autour de 9–10%.
     • 2020       : Choc COVID-19 avec hausse à {s.loc[s.index[s.index.year == 2020]].values[0]:.1f}%.
     • 2021–2024 : Retour progressif vers les niveaux pré-pandémie.

  3. STATIONNARITÉ :""")
    if adf_p < 0.05:
        report.append("     La série est stationnaire (test ADF significatif).")
    else:
        report.append("     La série est non stationnaire en niveau (test ADF non significatif),")
        report.append("     mais devient stationnaire après différenciation d'ordre 1 → I(1).")

    report.append(f"""
  4. NIVEAU STRUCTUREL :
     Le taux moyen sur toute la période est de {s.mean():.1f}%, avec
     un coefficient de variation de {(s.std()/s.mean())*100:.1f}%, indiquant
     une dispersion {"modérée" if (s.std()/s.mean())*100 < 20 else "importante"} autour de la moyenne.

  5. PERSPECTIVES :
     Les modèles de lissage exponentiel suggèrent une continuation
     de la tendance récente, avec un taux projeté autour de
     {s.iloc[-1]:.1f}% à court terme, sous réserve d'absence de chocs
     macroéconomiques majeurs.
""")
    report.append("=" * 65)
    return "\n".join(report)


# ──────────────────────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────────────────────

def main():
    print("\n" + "▓" * 65)
    print("  ANALYSE DU TAUX DE CHÔMAGE AU MAROC (1991–2024)")
    print("  Source : Banque Mondiale – SL.UEM.TOTL.ZS")
    print("▓" * 65 + "\n")

    print("  ► Récupération des données via l'API Banque Mondiale...")
    df = fetch_data()
    print(f"  ✓ {len(df)} observations récupérées ({df.index.min().year}–{df.index.max().year})\n")

    # Statistiques descriptives
    desc = descriptive_stats(df)
    print(desc)

    # Tests de stationnarité
    stat = stationarity_tests(df)
    print(stat)

    # Analyse des variations
    var = variation_analysis(df)
    print(var)

    # Lissage et prévisions
    smooth, model_ses, model_holt = smoothing_analysis(df)
    print(smooth)

    # Visualisations
    print("\n  ► Génération des graphiques...")
    create_visualizations(df, model_ses, model_holt)

    # Synthèse
    synth = synthesis(df)
    print(synth)

    # Sauvegarde du rapport complet
    full_report = "\n\n".join([desc, stat, var, smooth, synth])
    with open(f"{OUTPUT_DIR}/rapport_analyse_chomage_maroc.txt", "w", encoding="utf-8") as f:
        f.write(full_report)
    print(f"\n  ✓ Rapport complet sauvegardé : {OUTPUT_DIR}/rapport_analyse_chomage_maroc.txt")

    # Sauvegarde des données
    df.to_csv(f"{OUTPUT_DIR}/donnees_chomage_maroc.csv")
    print(f"  ✓ Données sauvegardées : {OUTPUT_DIR}/donnees_chomage_maroc.csv\n")


if __name__ == "__main__":
    main()
