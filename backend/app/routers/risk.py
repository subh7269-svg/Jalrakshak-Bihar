from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import json
from app.database.session import get_db
from app.models.location import Location
from app.models.risk import RiskAssessment
from app.schemas.risk import RiskAssessmentResponse, WhyAtRiskResponse
from app.services.risk_service import assess_location_risk, get_why_at_risk
from app.routers.auth import require_current_user
from app.models.user import User

router = APIRouter(prefix="/risk", tags=["Flood Risk Intelligence"])

@router.get("", response_model=List[RiskAssessmentResponse])
def get_all_risk_assessments(district: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(RiskAssessment).join(Location, RiskAssessment.location_id == Location.id)
    if district and district != "ALL":
        query = query.filter(Location.district == district)
    
    records = query.all()
    results = []
    for r in records:
        try:
            factors = json.loads(r.contributing_factors_json)
        except Exception:
            factors = []
        results.append(RiskAssessmentResponse(
            id=r.id,
            location_id=r.location_id,
            location_name=r.location.name if r.location else None,
            district=r.location.district if r.location else None,
            risk_score_pct=r.risk_score_pct,
            risk_level=r.risk_level,
            predicted_exposure_pct=r.predicted_exposure_pct,
            estimated_exposed_population=r.estimated_exposed_population,
            contributing_factors=factors,
            explanation_summary=r.explanation_summary,
            calculation_method=r.calculation_method,
            is_simulated=r.is_simulated,
            assessed_at=r.assessed_at
        ))
    return results

@router.get("/{location_id}", response_model=RiskAssessmentResponse)
def get_risk_assessment_for_location(location_id: int, db: Session = Depends(get_db)):
    r = db.query(RiskAssessment).filter(RiskAssessment.location_id == location_id).first()
    if not r:
        loc = db.query(Location).filter(Location.id == location_id).first()
        if not loc:
            raise HTTPException(status_code=404, detail=f"Location {location_id} not found")
        r = assess_location_risk(db, loc)

    try:
        factors = json.loads(r.contributing_factors_json)
    except Exception:
        factors = []

    return RiskAssessmentResponse(
        id=r.id,
        location_id=r.location_id,
        location_name=r.location.name if r.location else None,
        district=r.location.district if r.location else None,
        risk_score_pct=r.risk_score_pct,
        risk_level=r.risk_level,
        predicted_exposure_pct=r.predicted_exposure_pct,
        estimated_exposed_population=r.estimated_exposed_population,
        contributing_factors=factors,
        explanation_summary=r.explanation_summary,
        calculation_method=r.calculation_method,
        is_simulated=r.is_simulated,
        assessed_at=r.assessed_at
    )

@router.get("/{location_id}/why-at-risk", response_model=WhyAtRiskResponse)
def get_why_at_risk_breakdown(location_id: int, db: Session = Depends(get_db)):
    try:
        return get_why_at_risk(db, location_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/recalculate")
def recalculate_all_risks(db: Session = Depends(get_db), current_user: User = Depends(require_current_user)):
    locations = db.query(Location).filter(Location.is_active == True).all()
    count = 0
    for loc in locations:
        assess_location_risk(db, loc)
        count += 1
    return {
        "status": "success",
        "message": f"Successfully re-evaluated flood risk predictions for {count} locations.",
        "triggered_by": current_user.username
    }
