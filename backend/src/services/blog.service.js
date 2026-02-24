/**
 * Blog Service
 * Handles blog posts, likes, and comments
 */

const prisma = require('../config/database');

/**
 * Create a new blog post
 */
const createPost = async (postData) => {
  try {
    const post = await prisma.post.create({
      data: {
        title: postData.title,
        content: postData.content,
        status: postData.status || 'DRAFT',
        authorId: postData.authorId,
      },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
    return post;
  } catch (error) {
    throw new Error(`Failed to create post: ${error.message}`);
  }
};

/**
 * Get all published posts
 */
const getPublishedPosts = async (limit = 20, offset = 0) => {
  try {
    const posts = await prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true },
        },
        likes: true,
        comments: {
          include: {
            author: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.post.count({ where: { status: 'PUBLISHED' } });

    return {
      posts: posts.map((post) => ({
        ...post,
        likesCount: post.likes.length,
        commentsCount: post.comments.length,
      })),
      total,
      limit,
      offset,
    };
  } catch (error) {
    throw new Error(`Failed to fetch posts: ${error.message}`);
  }
};

/**
 * Get user's own posts (draft + published)
 */
const getUserPosts = async (authorId) => {
  try {
    const posts = await prisma.post.findMany({
      where: { authorId },
      include: {
        likes: true,
        comments: {
          include: {
            author: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return posts.map((post) => ({
      ...post,
      likesCount: post.likes.length,
      commentsCount: post.comments.length,
    }));
  } catch (error) {
    throw new Error(`Failed to fetch user posts: ${error.message}`);
  }
};

/**
 * Get single post by ID
 */
const getPostById = async (postId) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        likes: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
        comments: {
          include: {
            author: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (post) {
      return {
        ...post,
        likesCount: post.likes.length,
        commentsCount: post.comments.length,
      };
    }

    return post;
  } catch (error) {
    throw new Error(`Failed to fetch post: ${error.message}`);
  }
};

/**
 * Update post
 */
const updatePost = async (postId, updateData) => {
  try {
    const post = await prisma.post.update({
      where: { id: postId },
      data: {
        title: updateData.title,
        content: updateData.content,
        status: updateData.status,
      },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
    return post;
  } catch (error) {
    throw new Error(`Failed to update post: ${error.message}`);
  }
};

/**
 * Delete post
 */
const deletePost = async (postId) => {
  try {
    await prisma.post.delete({
      where: { id: postId },
    });
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to delete post: ${error.message}`);
  }
};

/**
 * Like a post
 */
const likePost = async (postId, userId) => {
  try {
    // Check if already liked
    const existingLike = await prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.postLike.delete({
        where: { id: existingLike.id },
      });
      return { liked: false };
    } else {
      // Like
      await prisma.postLike.create({
        data: {
          postId,
          userId,
        },
      });
      return { liked: true };
    }
  } catch (error) {
    throw new Error(`Failed to like post: ${error.message}`);
  }
};

/**
 * Get who liked a post
 */
const getPostLikes = async (postId) => {
  try {
    const likes = await prisma.postLike.findMany({
      where: { postId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
    return likes;
  } catch (error) {
    throw new Error(`Failed to fetch likes: ${error.message}`);
  }
};

/**
 * Add comment to post
 */
const addComment = async (postId, authorId, content) => {
  try {
    const comment = await prisma.postComment.create({
      data: {
        postId,
        authorId,
        content,
      },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
    return comment;
  } catch (error) {
    throw new Error(`Failed to add comment: ${error.message}`);
  }
};

/**
 * Get comments on a post
 */
const getPostComments = async (postId) => {
  try {
    const comments = await prisma.postComment.findMany({
      where: { postId },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return comments;
  } catch (error) {
    throw new Error(`Failed to fetch comments: ${error.message}`);
  }
};

/**
 * Delete comment
 */
const deleteComment = async (commentId) => {
  try {
    await prisma.postComment.delete({
      where: { id: commentId },
    });
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to delete comment: ${error.message}`);
  }
};

/**
 * Search posts by title/content
 */
const searchPosts = async (query) => {
  try {
    const posts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [{ title: { contains: query, mode: 'insensitive' } }, { content: { contains: query, mode: 'insensitive' } }],
      },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true },
        },
        likes: true,
        comments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return posts.map((post) => ({
      ...post,
      likesCount: post.likes.length,
      commentsCount: post.comments.length,
    }));
  } catch (error) {
    throw new Error(`Failed to search posts: ${error.message}`);
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
