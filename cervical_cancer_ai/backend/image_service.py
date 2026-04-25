import numpy as np
from PIL import Image
from tensorflow.keras.applications.efficientnet import preprocess_input
from models_loader import cnn_model

IMAGE_CLASSES = [
    "im_Dyskeratotic",
    "im_Koilocytotic",
    "im_Metaplastic",
    "im_Parabasal",
    "im_Superficial-Intermediate"
]

def preprocess_image(img: Image.Image):
    # FIX 1: Resize to 224x224 to match EfficientNet input
    img = img.resize((224, 224))
    img = img.convert("RGB")  # ensure 3 channels
    img_arr = np.array(img, dtype=np.float32)
    # FIX 2: Use EfficientNet preprocess_input instead of /255
    img_arr = preprocess_input(img_arr)
    return img_arr.reshape(1, 224, 224, 3)

def predict_image(image: Image.Image):
    img_arr = preprocess_image(image)
    preds = cnn_model.predict(img_arr)[0]

    idx = int(np.argmax(preds))
    confidence = float(preds[idx])
    cell_type = IMAGE_CLASSES[idx]

    # Map cell type to risk level
    if any(word in cell_type for word in ["Dyskeratotic", "Koilocytotic"]):
        risk = "HIGH"
    elif "Parabasal" in cell_type:
        risk = "HIGH" if confidence > 0.7 else "MEDIUM"
    elif "Metaplastic" in cell_type:
        risk = "MEDIUM"
    else:
        risk = "LOW"  # Superficial-Intermediate

    return {
        "cell_type": cell_type,
        "image_score": round(confidence, 6),
        "image_risk": risk
    }