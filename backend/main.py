from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import joblib
import json
from io import BytesIO
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model_paths = {
    "model1": ("normal_features_normal_threshold.pkl", "scaler_normal_features_normal.pkl"),
    "model2": ("hybrid_features_normal_threshold.pkl", "scaler_hybrid_features_normal.pkl"),
    "model3": ("normal_features_ecdf_threshold.pkl", "scaler_normal_features_ecdf.pkl", "demo_config_normal_ecdf.json"),
    "model4": ("hybrid_features_ecdf_threshold.pkl", "scaler_hybrid_features_ecdf.pkl", "demo_config_hybrid_ecdf.json"),
}

@app.post("/predict")
async def predict(file: UploadFile = File(...), model_id: str = Form(...)):
    if model_id not in model_paths:
        return {"error": f"Invalid model_id: {model_id}"}

    paths = model_paths[model_id]
    model = joblib.load(paths[0])
    scaler = joblib.load(paths[1])

    content = await file.read()
    df = pd.read_csv(BytesIO(content))
    has_label = "label" in df.columns

    X = df.drop(columns=["label"]) if has_label else df.copy()
    X_scaled = scaler.transform(X)
    scores = model.decision_function(X_scaled)

    # Use ECDF threshold from demo_config if model3 or model4
    if model_id in ["model3", "model4"]:
        with open(paths[2]) as f:
            config = json.load(f)
        threshold = config["threshold"]
        preds = (scores < threshold).astype(int)  # 1 if anomaly, 0 if normal
    else:
        raw_preds = model.predict(X_scaled)
        preds = (raw_preds == -1).astype(int)  # 1 if anomaly, 0 if normal
        threshold = None

    df["anomaly_score"] = scores
    df["prediction"] = preds

    metrics = {}
    if has_label:
        y_true = df["label"].astype(int)
        y_pred = df["prediction"]

        tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()

        prediction_breakdown = [
            {
                "index": idx + 1,
                "actual": int(actual),
                "prediction": int(pred),
                "correct": "✔" if int(actual) == int(pred) else "✘"
            }
            for idx, (actual, pred) in enumerate(zip(y_true, y_pred))
        ]

        metrics = {
            "accuracy": accuracy_score(y_true, y_pred),
            "precision": precision_score(y_true, y_pred),
            "recall": recall_score(y_true, y_pred),
            "f1_score": f1_score(y_true, y_pred),
            "roc_auc": roc_auc_score(y_true, -scores),
            "confusion_matrix": [int(tn), int(fp), int(fn), int(tp)],
            "threshold": threshold,
            "scores": scores.tolist(),
            "prediction_breakdown": prediction_breakdown
        }

    return {
        "data": df.to_dict(orient="records"),
        "metrics": metrics
    }
