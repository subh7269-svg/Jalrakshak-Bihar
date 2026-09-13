from pydantic import BaseModel
from typing import List

class DataSourceItem(BaseModel):
    category: str
    dataset_name: str
    provider: str
    data_type: str  # Real / Public API, Official Field Input, Calculated Value, ML Prediction, Simulated Demo
    is_simulated: bool
    refresh_frequency: str
    last_ingested_or_updated: str
    processing_method: str
    reliability_notes: str

class DataSourceCatalogResponse(BaseModel):
    catalog: List[DataSourceItem]
    audit_policy: str
