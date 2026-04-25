import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# Load final dataset
df = pd.read_csv("data/clinical/clinical_final.csv")

print("Dataset loaded:", df.shape)

# --------------------------------
# Separate features and target
# --------------------------------
X = df.drop(columns=["Risk_Level"])
y = df["Risk_Level"]

print("Features shape:", X.shape)
print("Target shape:", y.shape)

# --------------------------------
# Train-Test Split
# --------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

print("\nTrain size:", X_train.shape)
print("Test size:", X_test.shape)

# --------------------------------
# Feature Scaling
# --------------------------------
scaler = StandardScaler()

X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# --------------------------------
# Save processed data
# --------------------------------
pd.DataFrame(X_train_scaled).to_csv(
    "data/clinical/X_train.csv", index=False
)
pd.DataFrame(X_test_scaled).to_csv(
    "data/clinical/X_test.csv", index=False
)
y_train.to_csv("data/clinical/y_train.csv", index=False)
y_test.to_csv("data/clinical/y_test.csv", index=False)

print("\nTrain/Test data saved successfully!")
