"""
API package for the Devr.AI backend.

This package contains all API-related components:
- router: Main API router with all endpoints
- v1: Version 1 API endpoints
"""

def __getattr__(name):
    if name == "api_router":
        from .router import api_router
        return api_router
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")

__all__ = ["api_router"]

