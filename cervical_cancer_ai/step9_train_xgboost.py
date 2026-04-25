import pandas as pd
import xgboost as xgb
import numpy as np
import joblib
import os
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report
from sklearn.utils.class_weight import compute_sample_weight

# Load data
X_train = pd.read_csv("data/clinical/X_train.csv")
X_test = pd.read_csv("data/clinical/X_test.csv")
y_train = pd.read_csv("data/clinical/y_train.csv").values.ravel()
y_test = pd.read_csv("data/clinical/y_test.csv").values.ravel()

print("Data loaded successfully")

# Encode labels
le = LabelEncoder()
y_train_enc = le.fit_transform(y_train)
y_test_enc = le.transform(y_test)

print("Classes:", le.classes_)

# FIX 3: Save LabelEncoder immediately after fitting
os.makedirs("models", exist_ok=True)
joblib.dump(le, "models/label_encoder.pkl")
print("LabelEncoder saved")

# FIX 1: Use actual number of classes, never hardcode
num_classes = len(le.classes_)
print(f"Number of classes: {num_classes}")

# FIX 4: Compute sample weights to handle class imbalance
sample_weights = compute_sample_weight(class_weight='balanced', y=y_train_enc)

# XGBoost model
xgb_model = xgb.XGBClassifier(
    n_estimators=300,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    objective="multi:softprob",
    eval_metric="mlogloss",
    random_state=42,
    num_class=num_classes,   # FIX 1: dynamic, not hardcoded
    use_label_encoder=False
)

# Train with sample weights (FIX 4)
xgb_model.fit(
    X_train, y_train_enc,
    sample_weight=sample_weights,
    eval_set=[(X_test, y_test_enc)],
    verbose=50
)

print("XGBoost training complete")

# Predictions
y_pred_raw = xgb_model.predict(X_test)

# Handle both 1D and 2D output
if len(y_pred_raw.shape) > 1:
    y_pred = y_pred_raw.argmax(axis=1)
else:
    y_pred = y_pred_raw

print("\nAccuracy:", accuracy_score(y_test_enc, y_pred))

print("\nClassification Report:")
print(classification_report(y_test_enc, y_pred, target_names=le.classes_))

# Save model
xgb_model.save_model("models/xgboost_risk_model.json")
print("Model saved successfully")