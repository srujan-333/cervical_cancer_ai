import pandas as pd

# Load cleaned data
df = pd.read_csv("data/clinical/clinical_cleaned.csv")

print("Loaded cleaned data:", df.shape)

# --------------------------------
# FEATURE 1: Age Group
# --------------------------------
def age_group(age):
    if age < 20:
        return 0   # Very Young
    elif age < 35:
        return 1   # Adult
    elif age < 50:
        return 2   # High Risk
    else:
        return 3   # Very High Risk

df["Age_Group"] = df["Age"].apply(age_group)

# --------------------------------
# FEATURE 2: Lifestyle Score
# --------------------------------
df["Lifestyle_Score"] = (
    df["Smokes"] +
    df["Hormonal Contraceptives"] +
    df["IUD"]
)

# --------------------------------
# FEATURE 3: STD Burden Score
# --------------------------------
std_columns = [col for col in df.columns if col.startswith("STDs:")]

df["STD_Burden"] = df[std_columns].sum(axis=1)

# --------------------------------
# FEATURE 4: Sexual Risk Index
# --------------------------------
df["Sexual_Risk_Index"] = (
    df["Number of sexual partners"] *
    df["STDs"]
)

# --------------------------------
# FEATURE 5: Overall Risk Index
# --------------------------------
df["Overall_Risk_Index"] = (
    df["Age_Group"] +
    df["Lifestyle_Score"] +
    df["STD_Burden"]
)

# --------------------------------
# Save engineered data
# --------------------------------
df.to_csv("data/clinical/clinical_engineered.csv", index=False)

print("Feature engineering complete!")
print("New shape:", df.shape)
print("New columns added:")
print([
    "Age_Group",
    "Lifestyle_Score",
    "STD_Burden",
    "Sexual_Risk_Index",
    "Overall_Risk_Index"
])
