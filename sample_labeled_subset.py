import pandas as pd
import numpy as np

# === CONFIG ===
input_csv = "C:/Users/248kl/OneDrive/Desktop/Thesis/unsw_Modelling/test/unsw_test_clean_isolation_forest.csv"   # 🔁 Replace with your CSV path
output_csv = "C:/Users/248kl/Downloads/subset_sampled_normalv3.csv"      # 🔁 Output file
n = 100                               # 🔁 Total number of rows to extract
target_anomaly_ratio = 0.05           # 5% anomalies

# === LOAD DATA ===
df = pd.read_csv(input_csv)

# Ensure label column exists
if 'label' not in df.columns:
    raise ValueError("Input CSV must contain a 'label' column.")

# Separate normal and anomaly rows
normal_df = df[df['label'] == 0]
anomaly_df = df[df['label'] == 1]

# Compute counts
anomaly_count = int(n * target_anomaly_ratio)
normal_count = n - anomaly_count

# Sample without fixed seed (truly random)
sampled_anomalies = anomaly_df.sample(n=anomaly_count, replace=len(anomaly_df) < anomaly_count)
sampled_normals = normal_df.sample(n=normal_count, replace=len(normal_df) < normal_count)

# Combine and shuffle randomly
subset = pd.concat([sampled_anomalies, sampled_normals]).sample(frac=1).reset_index(drop=True)

# Save output
subset.to_csv(output_csv, index=False)
print(f"✅ Sampled {n} rows with {anomaly_count} anomalies and saved to {output_csv}")
