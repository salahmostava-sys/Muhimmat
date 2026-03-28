"""Linear regression on daily order counts vs. day index."""

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression


def train_model(data):
    df = pd.DataFrame(data)
    df["day"] = range(len(df))
    X = df[["day"]]
    y = df["orders"]
    model = LinearRegression()
    model.fit(X, y)
    return model


def predict_next(model, history_length: int, days: int = 1) -> np.ndarray:
    """
    Predict orders for the days immediately after the training series.

    Training uses day indices 0 .. history_length-1, so the next days are
    history_length, history_length+1, ...
    """
    start = history_length
    future = np.array([[start + i] for i in range(days)])
    return model.predict(future)
