import pandas as pd
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
import numpy as np
import joblib
import os
from sklearn.metrics import accuracy_score, classification_report

# -----------------------------
# Load data
# -----------------------------
X_train = pd.read_csv("data/clinical/X_train.csv")
X_test = pd.read_csv("data/clinical/X_test.csv")
y_train = pd.read_csv("data/clinical/y_train.csv").values.ravel()
y_test = pd.read_csv("data/clinical/y_test.csv").values.ravel()

print("Data loaded")

# FIX 1: Load the SAME LabelEncoder saved in step9
le = joblib.load("models/label_encoder.pkl")
y_train_enc = le.transform(y_train)   # transform only, never fit again
y_test_enc = le.transform(y_test)

num_classes = len(le.classes_)
input_dim = X_train.shape[1]
print("Classes:", le.classes_)

# -----------------------------
# Convert to tensors
# -----------------------------
X_train_tensor = torch.tensor(X_train.values, dtype=torch.float32)
X_test_tensor  = torch.tensor(X_test.values,  dtype=torch.float32)
y_train_tensor = torch.tensor(y_train_enc, dtype=torch.long)
y_test_tensor  = torch.tensor(y_test_enc,  dtype=torch.long)

# FIX 2: Use DataLoader with mini-batches
train_dataset = TensorDataset(X_train_tensor, y_train_tensor)
train_loader  = DataLoader(train_dataset, batch_size=32, shuffle=True)

# -----------------------------
# FIX 5: Real FT-Transformer with attention
# -----------------------------
class FTTransformer(nn.Module):
    def __init__(self, input_dim, num_classes, d_model=64, nhead=4, num_layers=2):
        super().__init__()

        # Project input features into d_model space
        self.input_proj = nn.Linear(input_dim, d_model)

        # Transformer encoder layers
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
        x = self.input_proj(x).unsqueeze(1)   # (batch, 1, d_model)
        x = self.transformer(x)
        x = x.squeeze(1)                       # (batch, d_model)
        x = self.norm(x)
        x = self.dropout(x)
        return self.classifier(x)

model = FTTransformer(input_dim, num_classes)

# FIX 4: Weighted CrossEntropyLoss for class imbalance
class_counts = np.bincount(y_train_enc)
class_weights = torch.tensor(
    1.0 / class_counts, dtype=torch.float32
)
class_weights = class_weights / class_weights.sum()  # normalize

criterion = nn.CrossEntropyLoss(weight=class_weights)
optimizer = optim.Adam(model.parameters(), lr=0.001)
scheduler = optim.lr_scheduler.ReduceLROnPlateau(
    optimizer, factor=0.5, patience=5
)

# FIX 3: More epochs + early stopping
EPOCHS = 100
best_val_loss = float('inf')
patience_counter = 0
PATIENCE = 10

# -----------------------------
# Training loop with mini-batches
# -----------------------------
for epoch in range(EPOCHS):
    model.train()
    epoch_loss = 0

    for X_batch, y_batch in train_loader:    # FIX 2: batched training
        optimizer.zero_grad()
        outputs = model(X_batch)
        loss = criterion(outputs, y_batch)
        loss.backward()
        optimizer.step()
        epoch_loss += loss.item()

    avg_loss = epoch_loss / len(train_loader)

    # Validation loss for scheduler + early stopping
    model.eval()
    with torch.no_grad():
        val_outputs = model(X_test_tensor)
        val_loss = criterion(val_outputs, y_test_tensor).item()

    scheduler.step(val_loss)

    if epoch % 10 == 0:
        print(f"Epoch {epoch} | Train Loss: {avg_loss:.4f} | Val Loss: {val_loss:.4f}")

    # Early stopping
    if val_loss < best_val_loss:
        best_val_loss = val_loss
        torch.save(model.state_dict(), "models/ft_transformer_best.pt")
        patience_counter = 0
    else:
        patience_counter += 1
        if patience_counter >= PATIENCE:
            print(f"Early stopping at epoch {epoch}")
            break

# -----------------------------
# Load best model for evaluation
# -----------------------------
model.load_state_dict(torch.load("models/ft_transformer_best.pt"))
model.eval()

with torch.no_grad():
    outputs = model(X_test_tensor)
    predictions = torch.argmax(outputs, dim=1).numpy()

print("\nFT-Transformer Accuracy:", accuracy_score(y_test_enc, predictions))
print("\nClassification Report:")
print(classification_report(y_test_enc, predictions, target_names=le.classes_))

# Save final model
os.makedirs("models", exist_ok=True)
torch.save(model.state_dict(), "models/ft_transformer_model.pt")
print("FT-Transformer model saved")