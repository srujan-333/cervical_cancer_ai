import pandas as pd
import xgboost as xgb
import matplotlib.pyplot as plt

# Load data
X_train = pd.read_csv("data/clinical/X_train.csv")

# Load trained model
model = xgb.XGBClassifier()
model.load_model("models/xgboost_risk_model.json")

# Feature importance
importance = model.feature_importances_

feature_importance_df = pd.DataFrame({
    "Feature_Index": range(len(importance)),
    "Importance": importance
})

feature_importance_df = feature_importance_df.sort_values(
    by="Importance", ascending=False
)

plt.figure(figsize=(10,6))
plt.bar(feature_importance_df["Feature_Index"][:15],
        feature_importance_df["Importance"][:15])
plt.title("Top 15 Feature Importances (XGBoost)")
plt.xlabel("Feature Index")
plt.ylabel("Importance Score")
plt.show()