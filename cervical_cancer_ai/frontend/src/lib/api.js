const API_BASE = "http://localhost:8000";

export async function predictImage(imageFile) {
  const formData = new FormData();
  formData.append("file", imageFile);

  const res = await fetch(`${API_BASE}/predict/image`, {
    method: "POST",
    body: formData
  });

  if (!res.ok) {
    throw new Error("Image prediction failed");
  }

  return await res.json();
}

export async function predictClinical(clinicalData) {
  const res = await fetch(`${API_BASE}/predict/clinical`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(clinicalData)  // send dict directly
  });

  if (!res.ok) throw new Error("Clinical prediction failed");
  return await res.json();
}

export async function predictFinal(
  imageScore, clinicalScore, cellType="", imageRisk="", clinicalRisk=""
) {
  const res = await fetch(`${API_BASE}/predict/final`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image_score: imageScore,
      clinical_score: clinicalScore,
      cell_type: cellType,       // NEW
      image_risk: imageRisk,     // NEW
      clinical_risk: clinicalRisk // NEW
    })
  });

  if (!res.ok) throw new Error("Final prediction failed");
  return await res.json();
}
