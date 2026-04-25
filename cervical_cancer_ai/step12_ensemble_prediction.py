import pandas as pd
import torch
import torch.nn as nn
import xgboost as xgb
import numpy as np
import joblib  
from sklearn.metrics import classification_report, confusion_matrix

# -----------------------------
# Load test data
# -----------------------------
X_test = pd.read_csv("data/clinical/X_test.csv")
y_test = pd.read_csv("data/clinical/y_test.csv").values.ravel()

# FIX 4: Load the SAME LabelEncoder used during training
# Never fit a new one on test data — labels may not match
le = joblib.load("models/label_encoder.pkl")
y_test_enc = le.transform(y_test)  # transform only, not fit_transform

num_classes = len(le.classes_)
input_dim = X_test.shape[1]

print("Classes:", le.classes_)

# -----------------------------
# Load XGBoost model
# -----------------------------
xgb_model = xgb.XGBClassifier()
xgb_model.load_model("models/xgboost_risk_model.json")
xgb_preds = xgb_model.predict_proba(X_test)

# -----------------------------
# FT Transformer 
# -----------------------------

class FTTransformer(nn.Module):
    def __init__(self, input_dim, num_classes, d_model=64, nhead=4, num_layers=2):
        super().__init__()
        self.input_proj = nn.Linear(input_dim, d_model)
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            dim_feedforward=128,
            dropout=0.1,
            batch_first=True
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)
        self.norm = nn.LayerNorm(d_model)
        self.dropout = nn.Dropout(0.2)
        self.classifier = nn.Linear(d_model, num_classes)

    def forward(self, x):
        x = self.input_proj(x).unsqueeze(1)
        x = self.transformer(x)
        x = x.squeeze(1)
        x = self.norm(x)
        x = self.dropout(x)
        return self.classifier(x)

# -----------------------------
# Load FT Transformer
# -----------------------------
ft_model = FTTransformer(input_dim, num_classes)
ft_model.load_state_dict(torch.load("models/ft_transformer_model.pt"))
ft_model.eval()

X_test_tensor = torch.tensor(X_test.values, dtype=torch.float32)

with torch.no_grad():
    ft_outputs = ft_model(X_test_tensor)
    ft_probs = torch.softmax(ft_outputs, dim=1).numpy()

# FIX 3: Weighted ensemble — give more weight to the better model
# Check your individual accuracies and weight accordingly
# If XGBoost is stronger, give it more weight
XGB_WEIGHT = 0.6
FT_WEIGHT = 0.4

ensemble_probs = (XGB_WEIGHT * xgb_preds) + (FT_WEIGHT * ft_probs)
ensemble_preds = np.argmax(ensemble_probs, axis=1)

# -----------------------------
# Proper evaluation — check recall per class
# -----------------------------
print("\nClassification Report:")
print(classification_report(
    y_test_enc,
    ensemble_preds,
    target_names=le.classes_
))

cm = confusion_matrix(y_test_enc, ensemble_preds)
print("\nConfusion Matrix:")
print(cm)

accuracy = np.mean(ensemble_preds == y_test_enc)
print("\nEnsemble Accuracy:", round(accuracy, 4))