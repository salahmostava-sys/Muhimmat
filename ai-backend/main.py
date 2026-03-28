from fastapi import FastAPI
from pydantic import BaseModel, Field

from model import predict_next, train_model

app = FastAPI()


class DayOrders(BaseModel):
    orders: float = Field(..., description="Order count for that day")


class PredictRequest(BaseModel):
    data: list[DayOrders] = Field(..., min_length=1)
    days: int = Field(1, ge=1, description="How many future days to predict")


@app.post("/predict")
def predict(req: PredictRequest):
    rows = [d.model_dump() for d in req.data]
    model = train_model(rows)
    result = predict_next(model, history_length=len(rows), days=req.days)
    return {"prediction": result.tolist()}
