import torch
import xgboost as xgb
import tensorflow as tf
import joblib
import os
from ft_transformer import FTTransformer

BASE_DIR = os.path.dirname(__file__)
MODEL_DIR = os.path.join(BASE_DIR, "models")

# ---------- LOAD XGBOOST ----------
xgb_model = xgb.XGBClassifier()
xgb_model.load_model(os.path.join(MODEL_DIR, "xgboost_risk_model.json"))

# ---------- LOAD CNN ----------
cnn_model = tf.keras.models.load_model(
    os.path.join(MODEL_DIR, "sipakmed_cnn_model.h5")
)

# FIX 1: Load the saved LabelEncoder — this defines the true class names
# and order exactly as XGBoost and FTTransformer were trained on
import joblib
label_encoder = joblib.load(os.path.join(MODEL_DIR, "label_encoder.pkl"))
CLINICAL_CLASSES = list(label_encoder.classes_)  # e.g. ['HIGH', 'LOW', 'MEDIUM']
print("Clinical classes (from encoder):", CLINICAL_CLASSES)

# FIX 2: Match EXACTLY the architecture defined in fixed step11
num_clinical_features = 41
num_classes = len(CLINICAL_CLASSES)

class FTTransformerSimple(torch.nn.Module):
    def __init__(self, input_dim, num_classes, d_model=64, nhead=4, num_layers=2):
        super().__init__()
        self.input_proj = torch.nn.Linear(input_dim, d_model)
        encoder_layer = torch.nn.TransformerEncoderLayer(
            d_model=d_model, nhead=nhead,
            dim_feedforward=128, dropout=0.1, batch_first=True
        )
        self.transformer = torch.nn.TransformerEncoder(encoder_layer, num_layers=num_layers)
        self.norm = torch.nn.LayerNorm(d_model)
        self.dropout = torch.nn.Dropout(0.2)
        self.classifier = torch.nn.Linear(d_model, num_classes)

    def forward(self, x):
        x = self.input_proj(x).unsqueeze(1)
        x = self.transformer(x)
        x = x.squeeze(1)
        x = self.norm(x)
        x = self.dropout(x)
        return self.classifier(x)

ft_model = FTTransformerSimple(num_clinical_features, num_classes)
ft_state = torch.load(
    os.path.join(MODEL_DIR, "ft_transformer_model.pt"),
    map_location="cpu"
)
ft_model.load_state_dict(ft_state, strict=True)  # strict=True — catch mismatches early
ft_model.eval()

# ---------- IMAGE CLASSES (SIPaKMeD) ----------
IMAGE_CLASSES = [
    "im_Dyskeratotic",
    "im_Koilocytotic",
    "im_Metaplastic",
    "im_Parabasal",
    "im_Superficial-Intermediate"
]