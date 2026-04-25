from PIL import Image
import numpy as np
import torch
import cv2

def preprocess_mri(image_path):
    img = Image.open(image_path).convert("L")
    img = img.resize((224, 224))
    img_np = np.array(img)

    # Normalize
    img_norm = img_np / 255.0

    tensor = torch.tensor(img_norm, dtype=torch.float32)
    tensor = tensor.unsqueeze(0).unsqueeze(0)
    return tensor

def estimate_tumor_percentage(image_path):
    """
    DEMO-LEVEL abnormal region estimation
    """

    img = Image.open(image_path).convert("L")
    img = img.resize((224, 224))
    img_np = np.array(img)

    # Blur to remove noise
    img_blur = cv2.GaussianBlur(img_np, (5, 5), 0)

    # Threshold (bright regions = abnormal)
    _, thresh = cv2.threshold(
        img_blur, 180, 255, cv2.THRESH_BINARY
    )

    abnormal_pixels = np.sum(thresh == 255)
    total_pixels = thresh.size

    tumor_percentage = (abnormal_pixels / total_pixels) * 100
    return round(tumor_percentage, 2)
