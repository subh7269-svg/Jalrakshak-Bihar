import pytest
from app.core.security import create_access_token

def test_health_check_endpoint(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "HEALTHY"
    assert "DEMO" in data["mode"]

def test_locations_endpoint(client):
    res = client.get("/api/locations")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 5
    assert any(loc["district"] == "Supaul" for loc in data)

def test_risk_why_at_risk_endpoint(client):
    loc_res = client.get("/api/locations")
    loc_id = loc_res.json()[0]["id"]

    res = client.get(f"/api/risk/{loc_id}/why-at-risk")
    assert res.status_code == 200
    data = res.json()
    assert "raw_inputs" in data
    assert "population_exposure" in data
    assert data["population_exposure"]["is_model_estimate"] is True

def test_priority_ranking_endpoint(client):
    res = client.get("/api/priority-ranking")
    assert res.status_code == 200
    data = res.json()
    assert len(data["ranking"]) > 0
    assert data["ranking"][0]["rank"] == 1

def test_resources_and_auth_protection(client):
    # Public get
    res = client.get("/api/resources")
    assert res.status_code == 200
    res_list = res.json()
    target_res = res_list[0]

    # Unauthorized post without token
    unauth_res = client.post("/api/resources/update", json={
        "resource_id": target_res["id"],
        "available_quantity": 99,
        "deployed_quantity": 1
    })
    assert unauth_res.status_code in [401, 403]

    # Authorized post with DISTRICT_OFFICIAL token
    token = create_access_token(subject="dm_supaul", role="DISTRICT_OFFICIAL", district="Supaul")
    headers = {"Authorization": f"Bearer {token}"}
    auth_res = client.post("/api/resources/update", json={
        "resource_id": target_res["id"],
        "available_quantity": 40,
        "deployed_quantity": 10
    }, headers=headers)
    assert auth_res.status_code == 200
    assert auth_res.json()["available_quantity"] == 40

def test_audit_log_endpoint(client):
    res = client.get("/api/audit-log")
    assert res.status_code == 200
    logs = res.json()
    assert len(logs) > 0

def test_data_sources_transparency_endpoint(client):
    res = client.get("/api/data-sources")
    assert res.status_code == 200
    data = res.json()
    assert len(data["catalog"]) >= 6
    assert any(item["category"] == "Precipitation Telemetry" for item in data["catalog"])
