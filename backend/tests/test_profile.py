import os
import sys
from uuid import uuid4, UUID
from unittest.mock import AsyncMock, MagicMock
import pytest
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport

# Set required dummy env vars for test environment
os.environ["SUPABASE_URL"] = "https://example.supabase.co"
os.environ["SUPABASE_KEY"] = "dummy-key"

from uuid import uuid4, UUID
import pytest
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport

from app.models.profile import ProfileUpdateRequest, ProfileResponse
from app.services.profile_service import ProfileService
from app.api.v1.profile import router as profile_router
from app.core.dependencies import get_current_user


class MockExecuteResponse:
    def __init__(self, data):
        self.data = data


class MockTableQuery:
    def __init__(self, execute_data):
        self._execute_data = execute_data
        self.last_update_data = None

    def select(self, *args, **kwargs):
        return self

    def update(self, update_data, *args, **kwargs):
        self.last_update_data = update_data
        return self

    def eq(self, *args, **kwargs):
        return self

    def limit(self, *args, **kwargs):
        return self

    async def execute(self):
        return MockExecuteResponse(self._execute_data)


@pytest.fixture
def mock_supabase():
    mock = MagicMock()
    return mock


@pytest.mark.asyncio
async def test_get_profile_success():
    user_id = uuid4()
    mock_user = {
        "id": str(user_id),
        "display_name": "Sarah Chen",
        "email": "sarah@example.com",
        "bio": "Open source developer",
        "location": "San Francisco, CA",
        "avatar_url": "https://avatar.url/sarah.png",
        "github_username": "sarahchen",
        "skills": {
            "company": "TechCorp",
            "website": "https://sarahchen.dev",
            "twitter": "@sarahchen_dev",
            "role": "Core Maintainer",
        },
        "is_verified": True,
    }

    service = ProfileService()
    query = MockTableQuery([mock_user])
    service.supabase.table = MagicMock(return_value=query)

    profile = await service.get_profile(user_id)

    assert profile.id == user_id
    assert profile.display_name == "Sarah Chen"
    assert profile.name == "Sarah Chen"
    assert profile.email == "sarah@example.com"
    assert profile.company == "TechCorp"
    assert profile.website == "https://sarahchen.dev"
    assert profile.github == "@sarahchen"
    assert profile.twitter == "@sarahchen_dev"
    assert profile.role == "Core Maintainer"
    assert profile.is_verified is True


@pytest.mark.asyncio
async def test_update_profile_persistence():
    user_id = uuid4()
    existing_user = {
        "id": str(user_id),
        "display_name": "Old Name",
        "email": "old@example.com",
        "bio": "Old Bio",
        "skills": {"company": "Old Corp"},
    }

    updated_user = {
        "id": str(user_id),
        "display_name": "New Name",
        "email": "new@example.com",
        "bio": "Updated Bio",
        "github_username": "newgithub",
        "skills": {
            "company": "New Corp",
            "website": "https://new.dev",
            "twitter": "@new_twitter",
        },
    }

    service = ProfileService()
    # Mock first select query (checks user exists) and then update query
    select_query = MockTableQuery([existing_user])
    update_query = MockTableQuery([updated_user])

    service.supabase.table = MagicMock(side_effect=[select_query, update_query])

    update_payload = ProfileUpdateRequest(
        display_name="New Name",
        email="new@example.com",
        bio="Updated Bio",
        company="New Corp",
        website="https://new.dev",
        twitter="@new_twitter",
        github="@newgithub",
    )

    result = await service.update_profile(user_id, update_payload)

    assert result.display_name == "New Name"
    assert result.company == "New Corp"
    assert result.website == "https://new.dev"
    assert result.twitter == "@new_twitter"
    assert result.github == "@newgithub"
    assert update_query.last_update_data is not None
    assert update_query.last_update_data["display_name"] == "New Name"
    assert update_query.last_update_data["github_username"] == "newgithub"
    assert update_query.last_update_data["skills"]["company"] == "New Corp"
    assert "updated_at" in update_query.last_update_data


@pytest.mark.asyncio
async def test_api_endpoints_roundtrip():
    test_user_id = uuid4()

    mock_user_db = {
        "id": str(test_user_id),
        "display_name": "Test User",
        "email": "test@example.com",
        "bio": "Testing endpoints",
        "skills": {"company": "Test Co", "website": "https://test.co"},
    }

    app = FastAPI()
    app.include_router(profile_router, prefix="/v1/profile")

    app.dependency_overrides[get_current_user] = lambda: test_user_id

    from app.api.v1.profile import profile_service
    profile_service.supabase.table = MagicMock(
        return_value=MockTableQuery([mock_user_db])
    )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Test GET /v1/profile
        get_res = await client.get("/v1/profile")
        assert get_res.status_code == 200
        get_json = get_res.json()
        assert get_json["id"] == str(test_user_id)
        assert get_json["display_name"] == "Test User"
        assert get_json["company"] == "Test Co"

        # 2. Test PATCH /v1/profile
        patch_res = await client.patch(
            "/v1/profile",
            json={
                "display_name": "Updated Test User",
                "bio": "New Bio",
                "company": "Updated Co",
            },
        )
        assert patch_res.status_code == 200
        patch_json = patch_res.json()
        assert patch_json["id"] == str(test_user_id)
