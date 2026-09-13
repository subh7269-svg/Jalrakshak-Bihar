import pytest
from app.services.priority_service import evaluate_priority_ranking
from app.schemas.priority import PriorityWeights

def test_priority_ranking_scoring_and_ordering(db_session):
    result = evaluate_priority_ranking(db_session)
    assert len(result.ranking) > 0

    # Ensure ranking is sorted descending by priority_score
    scores = [r.priority_score for r in result.ranking]
    assert scores == sorted(scores, reverse=True)

    top_rank = result.ranking[0]
    assert top_rank.rank == 1
    assert "Ranked #1" in top_rank.why_ranked_here
    assert len(top_rank.factor_breakdown) == 5

    # Check sum of factor contributions equals priority score (within rounding)
    contrib_sum = sum(f.contribution for f in top_rank.factor_breakdown)
    assert abs(contrib_sum - top_rank.priority_score) < 0.5

def test_priority_ranking_custom_weights(db_session):
    # Weight only road blockage
    weights = PriorityWeights(
        weight_flood_risk=0.0,
        weight_population_exposure=0.0,
        weight_road_blockage=1.0,
        weight_shelter_gap=0.0,
        weight_river_rise_rate=0.0
    )
    result = evaluate_priority_ranking(db_session, custom_weights=weights)
    # The top ranked must be a location with BLOCKED road
    assert result.ranking[0].road_accessibility_status == "BLOCKED"
