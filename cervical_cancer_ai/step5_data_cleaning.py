import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Load dataset
df = pd.read_csv("data/clinical/clinical_final.csv")

print("Original shape:", df.shape)

# -------------------------
# STEP 1: Check missing values
# -------------------------
missing = df.isnull().sum()
print("\nMissing values per column:\n")
print(missing[missing > 0])

# -------------------------
# STEP 2: Visualize missing values
# -------------------------
plt.figure(figsize=(12, 6))
sns.heatmap(df.isnull(), cbar=False)
plt.title("Missing Value Heatmap")
plt.show()

# -------------------------
# STEP 3: Fill missing values
# -------------------------
# For numeric columns → fill with median
for col in df.columns:
    if df[col].dtype != 'object':
        df[col].fillna(df[col].median(), inplace=True)

print("\nMissing values after cleaning:")
print(df.isnull().sum().sum())

# -------------------------
# STEP 4: Save cleaned data
# -------------------------
df.to_csv("data/clinical/clinical_cleaned.csv", index=False)

print("\nCleaned data saved as clinical_cleaned.csv")
print("Final shape:", df.shape)
