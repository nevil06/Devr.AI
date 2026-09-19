import logging
from fastapi import APIRouter, HTTPException, Depends, status
from uuid import UUID

from app.models.profile import ProfileUpdateRequest, ProfileResponse
from app.services.profile_service import ProfileService
from app.core.dependencies import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()
profile_service = ProfileService()


@router.get("", response_model=ProfileResponse)
@router.get("/", response_model=ProfileResponse)
async def get_profile(user_id: UUID = Depends(get_current_user)):
    """
    Get the authenticated user's profile.
    """
    try:
        return await profile_service.get_profile(user_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_profile route: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve profile",
        ) from e


@router.patch("", response_model=ProfileResponse)
@router.patch("/", response_model=ProfileResponse)
@router.put("", response_model=ProfileResponse)
@router.put("/", response_model=ProfileResponse)
async def update_profile(
    request: ProfileUpdateRequest,
    user_id: UUID = Depends(get_current_user),
):
    """
    Update the authenticated user's profile.
    """
    try:
        return await profile_service.update_profile(user_id, request)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in update_profile route: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile",
        ) from e
