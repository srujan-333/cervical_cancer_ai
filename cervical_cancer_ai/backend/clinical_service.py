import numpy as np
import torch
import joblib
import os
from models_loader import xgb_model, ft_model, CLINICAL_CLASSES

EXPECTED_FEATURES = 41

def engineer_features(raw: dict) -> list:
    """Compute all 41 features from 8 basic inputs"""
    age = float(raw.get("age", 0))
    partners = float(raw.get("sexual_partners", 0))
    first_intercourse = float(raw.get("first_intercourse", 0))
    pregnancies = float(raw.get("pregnancies", 0))
    smokes = float(raw.get("smokes", 0))
    smokes_years = float(raw.get("smokes_years", 0))
    contraceptives = float(raw.get("contraceptives", 0))
    contraceptives_years = float(raw.get("contraceptives_years", 0))

    # Derived features matching clinical_engineered.csv columns
    smokes_packs = smokes_years * 0.5
    iud = 0.0
    iud_years = 0.0
    stds = 0.0
    stds_number = 0.0

    # STD flags (all zero if not provided)
    std_flags = [0.0] * 13  # condylomatosis through HPV

    std_diagnoses = 0.0
    std_time_first = 0.0
    std_time_last = 0.0

    dx_cancer = 0.0
    dx_cin = 0.0
    dx_hpv = 0.0
    dx = 0.0

    hinselmann = 0.0
    schiller = 0.0
    citology = 0.0
    biopsy = 0.0

    # Engineered features
    age_group = 0 if age < 25 else (1 if age < 35 else (2 if age < 45 else 3))
    lifestyle_score = smokes * 2 + smokes_years * 0.5 + partners * 0.3
    std_burden = stds_number
    sexual_risk = partners * 0.4 + (age - first_intercourse) * 0.1 + pregnancies * 0.2
    overall_risk = lifestyle_score + std_burden + sexual_risk + contraceptives_years * 0.1

    features = [
        age, partners, first_intercourse, pregnancies,
        smokes, smokes_years, smokes_packs,
        contraceptives, contraceptives_years,
        iud, iud_years, stds, stds_number
    ] + std_flags + [
        std_diagnoses, std_time_first, std_time_last,
        dx_cancer, dx_cin, dx_hpv, dx,
        hinselmann, schiller, citology, biopsy,
        age_group, lifestyle_score, std_burden,
        sexual_risk, overall_risk
    ]

    # Pad or trim to exactly 41
    features = features[:EXPECTED_FEATURES]
    while len(features) < EXPECTED_FEATURES:
        features.append(0.0)

    return features


def predict_clinical(raw_data):
    # Accept either a dict of named fields or a raw list
    if isinstance(raw_data, dict):
        features = engineer_features(raw_data)
    else:
        features = list(raw_data)
        if len(features) < EXPECTED_FEATURES:
            features = features + [0.0] * (EXPECTED_FEATURES - len(features))
        features = features[:EXPECTED_FEATURES]

    X = np.array(features).reshape(1, -1)

    # XGBoost probabilities
    xgb_probs = xgb_model.predict_proba(X)[0]

    # FT Transformer probabilities
    X_tensor = torch.tensor(X, dtype=torch.float32)
    with torch.no_grad():
        ft_outputs = ft_model(X_tensor)
        ft_probs = torch.softmax(ft_outputs, dim=1).numpy()[0]

    # Weighted ensemble
    ensemble_probs = 0.6 * xgb_probs + 0.4 * ft_probs
    class_index = int(np.argmax(ensemble_probs))
    confidence = float(ensemble_probs[class_index])
    predicted_label = CLINICAL_CLASSES[class_index].upper()

    # Risk mapping
    if "HIGH" in predicted_label:
        risk_level = "HIGH"
    elif "MEDIUM" in predicted_label:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    return {
        "clinical_class": CLINICAL_CLASSES[class_index],
        "clinical_score": round(confidence, 6),
        "final_risk": risk_level
    }