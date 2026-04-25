import React from 'react';
import { predictImage, predictClinical, predictFinal } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Activity } from "lucide-react";

const PredictionForm = ({
  formData,
  imageFile,
  setResults,
  setLoading
}) => {

  const handlePredict = async () => {
    if (!imageFile) {
      alert("Please upload an image first");
      return;
    }

    setLoading(true);
    setResults(null); // clear previous results

    try {
      // Step 1 — image prediction
      const imageRes = await predictImage(imageFile);
      console.log("Image result:", imageRes);

      // Step 2 — clinical prediction
      const clinicalData = {
        age: Number(formData.age || 0),
        sexual_partners: Number(formData.sexualPartners || 0),
        first_intercourse: Number(formData.firstIntercourse || 0),
        pregnancies: Number(formData.pregnancies || 0),
        smokes: Number(formData.smokes || 0),
        smokes_years: Number(formData.smokesYears || 0),
        contraceptives: Number(formData.hormonalContraceptives || 0),
        contraceptives_years: Number(formData.hormonalContraceptivesYears || 0),
      };
      const clinicalRes = await predictClinical(clinicalData);
      console.log("Clinical result:", clinicalRes);

      // Step 3 — final ensemble
      const finalRes = await predictFinal(
        imageRes.image_score || 0,
        clinicalRes.clinical_score || 0,
        imageRes.cell_type || "",
        imageRes.image_risk || "",
        clinicalRes.final_risk || ""
      );
      console.log("Final result:", finalRes);

      setResults({
        cellType: imageRes.cell_type,
        imageConfidence: imageRes.image_score,
        clinicalScore: clinicalRes.clinical_score,
        finalRisk: finalRes.finalRisk,
        finalScore: finalRes.finalScore
      });

      localStorage.setItem("prediction", JSON.stringify({
        finalRisk: finalRes.finalRisk,
        cellType: imageRes.cell_type,
        imageConfidence: imageRes.image_score,
        clinicalScore: clinicalRes.clinical_score
      }));

    } catch (err) {
      console.error("Prediction error:", err);
      alert("Prediction failed: " + err.message);
    } finally {
      setLoading(false); // always runs — even if error
    }
  };

  return (
    <Button
      onClick={handlePredict}
      className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-7 rounded-xl transition-all shadow-lg shadow-pink-100 active:scale-[0.98] mt-4 flex items-center gap-2"
    >
      <Activity size={20} />
      Generate AI Prediction
    </Button>
  );
};

export default PredictionForm;