/**
 * Blog Routes
 */

const express = require('express');
const blogController = require('../controllers/blog.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * Public Routes (No Authentication)
 */

// Get all published posts
router.get('/published', blogController.getPublishedPosts);

// Get single post
router.get('/:postId', blogController.getPostById);

// Search posts
router.get('/search', blogController.searchPosts);

// Get post likes
router.get('/:postId/likes', blogController.getPostLikes);

// Get post comments
router.get('/:postId/comments', blogController.getPostComments);

/**
 * Authenticated Routes
 */

// All routes below require authentication
router.use(authenticate);

// Create a new post
router.post('/', blogController.createPost);

// Get user's own posts
router.get('/my-posts', blogController.getUserPosts);

// Update post
router.put('/:postId', blogController.updatePost);

// Delete post
router.delete('/:postId', blogController.deletePost);

// Like/Unlike a post
router.post('/:postId/like', blogController.likePost);

// Add comment to post
router.post('/:postId/comments', blogController.addComment);

// Delete comment
router.delete('/comments/:commentId', blogController.deleteComment);

module.exports = router;
