import pandas as pd

# Load engineered data
df = pd.read_csv("data/clinical/clinical_engineered.csv")

print("Dataset loaded:", df.shape)
print("\nOverall_Risk_Index stats:")
print(df["Overall_Risk_Index"].describe())

# --------------------------------
# CREATE RISK LABELS
# --------------------------------
# Min=5, Mean=9.5, Max=51
# Use percentiles to create balanced classes:
# Low    = score 5.0 to 8.0  (below 25th percentile)
# Medium = score 8.0 to 12.0 (25th to 75th percentile)  
# High   = score > 12.0 OR Biopsy == 1

def assign_risk(row):
    if row["Biopsy"] == 1:
        return "High"
    elif row["Overall_Risk_Index"] > 12:
        return "High"
    elif row["Overall_Risk_Index"] >= 8:
        return "Medium"
    else:
        return "Low"   # score 5.0 to 7.99

df["Risk_Level"] = df.apply(assign_risk, axis=1)

# --------------------------------
# Show distribution
# --------------------------------
print("\nRisk Level Distribution:")
print(df["Risk_Level"].value_counts())

# --------------------------------
# Save final dataset
# --------------------------------
df.to_csv("data/clinical/clinical_final.csv", index=False)
print("\nFinal dataset saved as clinical_final.csv")