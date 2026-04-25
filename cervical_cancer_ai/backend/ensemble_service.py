def final_risk(image_score, clinical_score, cell_type="", image_risk="", clinical_risk=""):

    # Rule 1: Cell type is the primary signal
    cell = cell_type.upper()

    if any(word in cell for word in ["DYSKERATOTIC", "KOILOCYTOTIC"]):
        return {"final_score": round(image_score, 3), "risk": "HIGH"}

    if "PARABASAL" in cell:
        return {"final_score": round(image_score, 3), "risk": "HIGH" if image_score > 0.7 else "MEDIUM"}

    if "METAPLASTIC" in cell:
        return {"final_score": round(image_score, 3), "risk": "MEDIUM"}

    if "SUPERFICIAL" in cell or "INTERMEDIATE" in cell:
        # Healthy cells — use clinical score to decide LOW vs MEDIUM
        final_score = 0.3 * image_score + 0.7 * clinical_score
        risk = "MEDIUM" if clinical_risk == "HIGH" else "LOW"
        return {"final_score": round(final_score, 3), "risk": risk}

    # Fallback — use weighted score
    final_score = 0.6 * image_score + 0.4 * clinical_score
    if final_score >= 0.55:
        risk = "HIGH"
    elif final_score >= 0.25:
        risk = "MEDIUM"
    else:
        risk = "LOW"

    return {"final_score": round(final_score, 3), "risk": risk}