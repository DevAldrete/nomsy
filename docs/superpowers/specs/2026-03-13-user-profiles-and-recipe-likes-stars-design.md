# User Profiles and Recipe Likes/Stars Design

Date: 2026-03-13

## Overview

This design covers two related features:

1. **User Profiles** - Custom user profiles that are discoverable by owning published recipes
2. **Recipe Likes/Stars** - Ability to like and star recipes, with popularity-based discovery

---

## 1. User Profiles

### Data Model

Extend the User model with additional profile fields:

```typescript
interface UserProfile {
  // Required
  displayName: string;
  avatar: string; // URL to image

  // Optional
  bio?: string;
  username?: string; // for public profile URL (e.g., /@johndoe)
}
```

**User Schema (updated):**

- `displayName` (required, string)
- `avatar` (required, string - URL)
- `bio` (optional, string)
- `username` (optional, string, unique)

### API Endpoints

#### Public Endpoints

**GET /api/users/:username**

- Returns: `{ id, displayName, avatar, bio, username, createdAt, recipeCount }`
- Returns 404 if user not found or has no published recipes
- Only returns profile if user has at least one published recipe

**GET /api/users/:username/recipes**

- Query params: `page`, `limit`, `tag`, `sort` (recent, mostLiked, highestRated)
- Returns: `{ recipes: Recipe[], total, page, limit }`
- Only includes published recipes

#### Private Endpoints (authenticated)

**GET /api/profile**

- Returns full profile including private fields
- Body: `{ id, email, displayName, avatar, bio, username }`

**PUT /api/profile**

- Body: `{ displayName?, avatar?, bio?, username? }`
- Validates username uniqueness
- Validates required fields

**GET /api/profile/drafts**

- Returns user's draft recipes (recipes without publishedAt)
- Query params: `page`, `limit`

**GET /api/profile/favorites**

- Returns user's favorited recipes
- Reuses existing favorites system
- Query params: `page`, `limit`

### Frontend Routes

- `/@:username` - Public profile page showing published recipes
- `/profile` - Private profile page (redirects to login if not authenticated)
  - Tabs: Overview, Drafts, Favorites, Settings

### UX Considerations

- Public profile only visible if user has published recipes
- Username must be unique (validated on creation/update)
- Avatar can be a URL (no upload for MVP)

---

## 2. Recipe Likes & Stars

### Data Model

#### Recipe Model Updates

Add computed fields to Recipe:

- `likesCount` (number, default 0)
- `starsSum` (number, default 0) - sum of all star ratings
- `starsCount` (number, default 0) - count of star ratings

**Computed (not stored):**

- `averageStars` = starsCount > 0 ? starsSum / starsCount : null

#### New Collections

**RecipeLike:**

```typescript
{
  userId: ObjectId, // ref: User
  recipeId: ObjectId, // ref: Recipe
  createdAt: Date
}
```

- Unique index on (userId, recipeId)

**RecipeStar:**

```typescript
{
  userId: ObjectId, // ref: User
  recipeId: ObjectId, // ref: Recipe
  rating: number, // 1-5
  createdAt: Date
}
```

- Unique index on (userId, recipeId)

### API Endpoints

#### Likes

**POST /api/recipes/:id/like**

- Auth required
- Creates or returns existing like
- Returns 404 if recipe not found

**DELETE /api/recipes/:id/like**

- Auth required
- Removes like if exists

**GET /api/recipes/:id/like**

- Auth required
- Returns: `{ liked: boolean }`

#### Stars

**POST /api/recipes/:id/stars**

- Auth required
- Body: `{ rating: number }` (1-5)
- Creates or updates star rating

**DELETE /api/recipes/:id/stars**

- Auth required
- Removes star rating

**GET /api/recipes/:id/stars**

- Auth required
- Returns: `{ rating: number | null }`

#### Recipe Response Enhancement

All recipe endpoints include:

```typescript
{
  // ... existing fields
  likesCount: number,
  averageStars: number | null,
  starsCount: number,
  userHasLiked: boolean, // current user (if authenticated)
  userStarRating: number | null // current user (if authenticated)
}
```

### Discovery Page Enhancement

Add sort options to `/discover`:

- `recent` (default) - most recently published
- `mostLiked` - highest likesCount
- `highestRated` - highest averageStars

---

## Implementation Notes

1. **Database**: Run migrations to add new fields to User and Recipe schemas
2. **Caching**: Consider caching averageStars calculation for performance
3. **Validation**: Validate star rating is 1-5, username format (alphanumeric + underscores)
4. **Race conditions**: Use atomic updates for like/star counts to avoid race conditions
