from pydantic import BaseModel, Field, EmailStr
from uuid import UUID
from typing import Optional, Dict, Any, List
from datetime import datetime


class ProfileUpdateRequest(BaseModel):
    """
    Schema for updating user profile.
    All fields are optional for partial updates.
    """
    display_name: Optional[str] = None
    name: Optional[str] = None  # alias for display_name
    email: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    avatar_url: Optional[str] = None
    company: Optional[str] = None
    website: Optional[str] = None
    github: Optional[str] = None
    twitter: Optional[str] = None
    role: Optional[str] = None
    social_links: Optional[Dict[str, Any]] = None


class ProfileResponse(BaseModel):
    """
    Schema for user profile response.
    """
    id: UUID
    display_name: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    avatar_url: Optional[str] = None
    company: Optional[str] = None
    website: Optional[str] = None
    github: Optional[str] = None
    twitter: Optional[str] = None
    role: Optional[str] = None
    social_links: Optional[Dict[str, Any]] = None
    is_verified: bool = False
    skills: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
