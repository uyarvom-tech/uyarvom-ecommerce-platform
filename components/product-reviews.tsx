'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, StarIcon, User, CheckCircle, Edit, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface Review {
  id: string
  rating: number
  title?: string
  comment?: string
  isVerified: boolean
  createdAt: string
  user: {
    id: string
    fullName: string
    email: string
  }
}

interface ReviewStats {
  averageRating: number
  totalReviews: number
  distribution: Array<{
    rating: number
    count: number
    percentage: number
  }>
}

interface ProductReviewsProps {
  productSlug: string
  currentUserId?: string
}

export function ProductReviews({ productSlug, currentUserId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [sortBy, setSortBy] = useState('newest')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  // Review form state
  const [formData, setFormData] = useState({
    rating: 5,
    title: '',
    comment: ''
  })

  const fetchReviews = async (pageNum = 1, sort = sortBy, reset = false) => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/products/${productSlug}/reviews?page=${pageNum}&limit=5&sortBy=${sort}`
      )
      
      if (!response.ok) throw new Error('Failed to fetch reviews')
      
      const data = await response.json()
      
      if (reset || pageNum === 1) {
        setReviews(data.reviews)
      } else {
        setReviews(prev => [...prev, ...data.reviews])
      }
      
      setStats(data.stats)
      setHasMore(data.pagination.page < data.pagination.pages)
      setPage(pageNum)
    } catch (error) {
      console.error('Error fetching reviews:', error)
      toast.error('Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews(1, sortBy, true)
  }, [productSlug, sortBy])

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentUserId) {
      toast.error('Please sign in to write a review')
      return
    }

    try {
      const url = editingReview ? `/api/reviews/${editingReview.id}` : '/api/reviews'
      const method = editingReview ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userId: currentUserId,
          productSlug: productSlug
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit review')
      }

      toast.success(editingReview ? 'Review updated!' : 'Review submitted!')
      setShowReviewForm(false)
      setEditingReview(null)
      setFormData({ rating: 5, title: '', comment: '' })
      fetchReviews(1, sortBy, true)
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return

    try {
      const response = await fetch(`/api/reviews/${reviewId}?userId=${currentUserId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete review')
      }

      toast.success('Review deleted!')
      fetchReviews(1, sortBy, true)
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onRatingChange?.(star)}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
            disabled={!interactive}
          >
            <Star
              className={`h-5 w-5 ${
                star <= rating
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    )
  }

  const userHasReviewed = reviews.some(review => review.user.id === currentUserId)

  return (
    <div className="space-y-6">
      {/* Review Stats */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StarIcon className="h-5 w-5 text-amber-400" />
              Customer Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Overall Rating */}
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">
                  {stats.averageRating.toFixed(1)}
                </div>
                <div className="flex justify-center mb-2">
                  {renderStars(Math.round(stats.averageRating))}
                </div>
                <p className="text-muted-foreground">
                  Based on {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-2">
                {stats.distribution.map(({ rating, count, percentage }) => (
                  <div key={rating} className="flex items-center gap-2 text-sm">
                    <span className="w-8">{rating}★</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-amber-400 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-12 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Write Review Button */}
      {currentUserId && !userHasReviewed && !showReviewForm && (
        <Button onClick={() => setShowReviewForm(true)} className="w-full">
          Write a Review
        </Button>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingReview ? 'Edit Your Review' : 'Write a Review'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <Label>Rating</Label>
                <div className="mt-2">
                  {renderStars(formData.rating, true, (rating) =>
                    setFormData(prev => ({ ...prev, rating }))
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="title">Review Title (Optional)</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Summarize your experience"
                />
              </div>

              <div>
                <Label htmlFor="comment">Your Review (Optional)</Label>
                <Textarea
                  id="comment"
                  value={formData.comment}
                  onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Share your thoughts about this product..."
                  rows={4}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingReview ? 'Update Review' : 'Submit Review'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowReviewForm(false)
                    setEditingReview(null)
                    setFormData({ rating: 5, title: '', comment: '' })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Reviews ({stats?.totalReviews || 0})
          </h3>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="highest">Highest Rated</SelectItem>
              <SelectItem value="lowest">Lowest Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{review.user.fullName}</p>
                      {review.isVerified && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified Purchase
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {currentUserId === review.user.id && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingReview(review)
                        setFormData({
                          rating: review.rating,
                          title: review.title || '',
                          comment: review.comment || ''
                        })
                        setShowReviewForm(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteReview(review.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="mb-3">
                {renderStars(review.rating)}
              </div>

              {review.title && (
                <h4 className="font-semibold mb-2">{review.title}</h4>
              )}

              {review.comment && (
                <p className="text-muted-foreground leading-relaxed">
                  {review.comment}
                </p>
              )}
            </CardContent>
          </Card>
        ))}

        {hasMore && (
          <Button
            variant="outline"
            onClick={() => fetchReviews(page + 1, sortBy)}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Loading...' : 'Load More Reviews'}
          </Button>
        )}

        {reviews.length === 0 && !loading && (
          <Card>
            <CardContent className="p-8 text-center">
              <StarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                No reviews yet. Be the first to review this product!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
