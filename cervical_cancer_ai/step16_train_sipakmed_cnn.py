import tensorflow as tf
import os
import numpy as np
import matplotlib.pyplot as plt

from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Dense, Dropout, GlobalAveragePooling2D
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
from sklearn.utils.class_weight import compute_class_weight
from sklearn.metrics import classification_report, confusion_matrix, ConfusionMatrixDisplay
from tensorflow.keras.applications.efficientnet import preprocess_input

# ---------------------------
# 1. CONFIGURATION
# ---------------------------
DATA_DIR = "image_data/SipakMed"
IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS_PHASE1 = 20  # Frozen base
EPOCHS_PHASE2 = 30  # Fine-tuning

# ---------------------------
# 2. DATA PREPARATION
# ---------------------------
# IMPORTANT: No rescale=1./255 here. EfficientNet's preprocess_input handles scaling.
datagen = ImageDataGenerator(
    preprocessing_function=preprocess_input,
    validation_split=0.2,
    rotation_range=30,
    width_shift_range=0.2,
    height_shift_range=0.2,
    shear_range=0.2,
    zoom_range=0.2,
    horizontal_flip=True,
    fill_mode='nearest'
)

train_data = datagen.flow_from_directory(
    DATA_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='training'
)

val_data = datagen.flow_from_directory(
    DATA_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='validation',
    shuffle=False  # CRITICAL: Keep False for correct evaluation metrics
)

# ---------------------------
# 3. CLASS WEIGHTS
# ---------------------------
# This prevents the model from ignoring smaller classes
class_weights = compute_class_weight(
    class_weight='balanced',
    classes=np.unique(train_data.classes),
    y=train_data.classes
)
class_weight_dict = dict(enumerate(class_weights))
print(f"Calculated Class Weights: {class_weight_dict}")

# ---------------------------
# 4. MODEL ARCHITECTURE
# ---------------------------
base_model = EfficientNetB0(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
base_model.trainable = False  # Freeze pre-trained weights

x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dense(512, activation='relu')(x)
x = Dropout(0.4)(x)
output = Dense(train_data.num_classes, activation='softmax')(x)

model = Model(inputs=base_model.input, outputs=output)

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-4),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# ---------------------------
# 5. CALLBACKS
# ---------------------------
callbacks = [
    EarlyStopping(monitor='val_loss', patience=8, restore_best_weights=True, verbose=1),
    ReduceLROnPlateau(monitor='val_loss', factor=0.2, patience=4, verbose=1)
]

# ---------------------------
# 6. TRAINING - PHASE 1 (Transfer Learning)
# ---------------------------
print("\n--- Phase 1: Training Classification Head ---")
history = model.fit(
    train_data,
    validation_data=val_data,
    epochs=EPOCHS_PHASE1,
    class_weight=class_weight_dict,
    callbacks=callbacks
)

# ---------------------------
# 7. TRAINING - PHASE 2 (Fine-Tuning)
# ---------------------------
print("\n--- Phase 2: Fine-Tuning Last 20 Layers ---")
base_model.trainable = True
for layer in base_model.layers[:-20]:
    layer.trainable = False

# Re-compile with a much lower learning rate
model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

history_fine = model.fit(
    train_data,
    validation_data=val_data,
    epochs=EPOCHS_PHASE2,
    class_weight=class_weight_dict,
    callbacks=callbacks
)

# ---------------------------
# 8. SAVE MODEL
# ---------------------------
os.makedirs("backend/models", exist_ok=True)
model.save("backend/models/sipakmed_cnn_model.h5")
print("\nModel saved successfully at backend/models/sipakmed_cnn_model.h5")

# ---------------------------
# 9. FINAL EVALUATION
# ---------------------------
print("\n--- Final Evaluation ---")
val_data.reset()
y_pred_probs = model.predict(val_data)
y_pred = np.argmax(y_pred_probs, axis=1)
y_true = val_data.classes

print("\nClassification Report:\n")
print(classification_report(
    y_true, y_pred,
    target_names=list(val_data.class_indices.keys())
))

# Plot Confusion Matrix
cm = confusion_matrix(y_true, y_pred)
fig, ax = plt.subplots(figsize=(10, 8))
disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=list(val_data.class_indices.keys()))
disp.plot(cmap="Blues", ax=ax, xticks_rotation=45)
plt.title("SipakMed Confusion Matrix")
plt.show()