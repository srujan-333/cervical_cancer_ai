import pandas as pd

# load dataset
df = pd.read_csv("data/clinical/clinical_final.csv")

# show first 5 rows
print(df.head())

# show shape (rows, columns)
print("\nDataset shape:", df.shape)

# show column names
print("\nColumns:")
for col in df.columns:
    print(col)
