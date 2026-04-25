# save as fix_dataset.py and run it
import os
import shutil

BASE = "image_data/SipakMed"

for class_folder in os.listdir(BASE):
    class_path = os.path.join(BASE, class_folder)
    if not os.path.isdir(class_path):
        continue

    # Handle double-nested folders like im_Dyskeratotic/im_Dyskeratotic/
    nested = os.path.join(class_path, class_folder)
    source = nested if os.path.exists(nested) else class_path

    # Move all .bmp files to the top-level class folder
    moved = 0
    for root, dirs, files in os.walk(source):
        for f in files:
            if f.lower().endswith(".bmp"):
                src = os.path.join(root, f)
                dst = os.path.join(class_path, f)
                if src != dst:
                    shutil.copy2(src, dst)
                    moved += 1

    print(f"{class_folder}: {moved} .bmp files copied")

print("\nDone! Verifying counts:")
for class_folder in os.listdir(BASE):
    class_path = os.path.join(BASE, class_folder)
    if os.path.isdir(class_path):
        bmps = [f for f in os.listdir(class_path) if f.lower().endswith(".bmp")]
        print(f"  {class_folder}: {len(bmps)} images")