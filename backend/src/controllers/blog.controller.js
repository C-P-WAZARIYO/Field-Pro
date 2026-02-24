/**
 * Blog Controller
 * Handles blog CRUD operations, likes, and comments
 */

const blogService = require('../services/blog.service');

/**
 * Create a new blog post
 * POST /api/blogs
 */
const createPost = async (req, res) => {
  try {
    const { title, content, status } = req.body;
    const authorId = req.user.id;

    const post = await blogService.createPost({
      title,
      content,
      status: status || 'DRAFT',
      authorId,
    });

    res.status(201).json({
      success: true,
      message: 'Blog post created successfully',
      data: post,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get all published posts
 * GET /api/blogs/published
 */
const getPublishedPosts = async (req, res) => {
  try {
    const { limit, offset } = req.query;

    const result = await blogService.getPublishedPosts(
      limit ? parseInt(limit) : 20,
      offset ? parseInt(offset) : 0
    );

    res.status(200).json({
      success: true,
      data: result.posts,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get user's own posts
 * GET /api/blogs/my-posts
 */
const getUserPosts = async (req, res) => {
  try {
    const authorId = req.user.id;
    const posts = await blogService.getUserPosts(authorId);

    res.status(200).json({
      success: true,
      data: posts,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get single post by ID
 * GET /api/blogs/:postId
 */
const getPostById = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await blogService.getPostById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update post
 * PUT /api/blogs/:postId
 */
const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { title, content, status } = req.body;

    const post = await blogService.updatePost(postId, {
      title,
      content,
      status,
    });

    res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      data: post,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete post
 * DELETE /api/blogs/:postId
 */
const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    await blogService.deletePost(postId);

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Like/Unlike a post
 * POST /api/blogs/:postId/like
 */
const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const result = await blogService.likePost(postId, userId);

    res.status(200).json({
      success: true,
      message: result.liked ? 'Post liked' : 'Post unliked',
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get who liked a post
 * GET /api/blogs/:postId/likes
 */
const getPostLikes = async (req, res) => {
  try {
    const { postId } = req.params;
    const likes = await blogService.getPostLikes(postId);

    res.status(200).json({
      success: true,
      data: likes,
      total: likes.length,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Add comment to post
 * POST /api/blogs/:postId/comments
 */
const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const authorId = req.user.id;

    const comment = await blogService.addComment(postId, authorId, content);

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: comment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get comments on a post
 * GET /api/blogs/:postId/comments
 */
const getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await blogService.getPostComments(postId);

    res.status(200).json({
      success: true,
      data: comments,
      total: comments.length,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete comment
 * DELETE /api/blogs/comments/:commentId
 */
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    await blogService.deleteComment(commentId);

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Search posts
 * GET /api/blogs/search
 */
const searchPosts = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const posts = await blogService.searchPosts(q);

    res.status(200).json({
      success: true,
      data: posts,
      total: posts.length,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createPost,
  getPublishedPosts,
  getUserPosts,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  getPostLikes,
  addComment,
  getPostComments,
  deleteComment,
  searchPosts,
};
