import React, { useEffect, useState } from "react";
import API from "../api/axios";
import "../styles/BlogFeed.css";
import { Link } from "react-router-dom";

const demoBlogs = [
  {
    id: "1",
    title: "Why Every Developer Should Write",
    content:
      "Writing forces clarity. If you can explain your idea in words, you probably understand it well enough to build it.",
    author: { id: "a1", firstName: "System", lastName: "Admin" },
    createdAt: new Date("2024-01-10").toISOString(),
  },
  {
    id: "2",
    title: "Debugging Is a Skill, Not Luck",
    content:
      "Good debugging comes from patience, structured thinking, and knowing where to look — not from guessing.",
    author: { id: "a2", firstName: "Alex", lastName: "Morgan" },
    createdAt: new Date("2024-01-14").toISOString(),
  },
  {
    id: "3",
    title: "Clean Code Is Mostly About Empathy",
    content:
      "You are not writing code for machines. You are writing it for the next developer — often your future self.",
    author: { id: "a3", firstName: "Jordan", lastName: "Lee" },
    createdAt: new Date("2024-01-18").toISOString(),
  },
  {
    id: "4",
    title: "Stop Overengineering Early Projects",
    content:
      "Most projects fail because they never ship. Simplicity beats architectural perfection at the beginning.",
    author: { id: "a4", firstName: "Nina", lastName: "Patel" },
    createdAt: new Date("2024-01-22").toISOString(),
  },
  {
    id: "5",
    title: "Your First Version Will Be Bad — Ship It Anyway",
    content:
      "Waiting for perfection delays learning. Feedback comes from real users, not from polishing endlessly.",
    author: { id: "a5", firstName: "Chris", lastName: "Walker" },
    createdAt: new Date("2024-01-25").toISOString(),
  },
  {
    id: "6",
    title: "Learning One Stack Deeply Beats Knowing Ten Shallowly",
    content:
      "Depth builds confidence. Once fundamentals are strong, switching stacks becomes much easier.",
    author: { id: "a2", firstName: "Alex", lastName: "Morgan" },
    createdAt: new Date("2024-02-01").toISOString(),
  },
  {
    id: "7",
    title: "Why Side Projects Matter More Than Certificates",
    content:
      "Projects reveal how you think, how you fail, and how you solve problems under uncertainty.",
    author: { id: "a6", firstName: "Ravi", lastName: "Sharma" },
    createdAt: new Date("2024-02-05").toISOString(),
  },
  {
    id: "8",
    title: "The Myth of Overnight Success in Tech",
    content:
      "What looks like overnight success is usually years of silent practice and consistent effort.",
    author: { id: "a7", firstName: "Elena", lastName: "Kovacs" },
    createdAt: new Date("2024-02-09").toISOString(),
  },
  {
    id: "9",
    title: "Read Error Messages Carefully",
    content:
      "Most bugs tell you exactly what went wrong. We just panic and stop reading halfway.",
    author: { id: "a3", firstName: "Jordan", lastName: "Lee" },
    createdAt: new Date("2024-02-13").toISOString(),
  },
  {
    id: "10",
    title: "Why Consistency Beats Motivation",
    content:
      "Motivation fades. Systems and habits keep you moving when enthusiasm disappears.",
    author: { id: "a8", firstName: "Maya", lastName: "Singh" },
    createdAt: new Date("2024-02-18").toISOString(),
  },
  {
    id: "11",
    title: "Build Before You Feel Ready",
    content:
      "Feeling ready is not a prerequisite. Growth happens while building, not before it.",
    author: { id: "a4", firstName: "Nina", lastName: "Patel" },
    createdAt: new Date("2024-02-22").toISOString(),
  },
  {
    id: "12",
    title: "Your Git History Tells a Story",
    content:
      "Small, meaningful commits show discipline and thoughtfulness more than massive changes.",
    author: { id: "a9", firstName: "Daniel", lastName: "Reed" },
    createdAt: new Date("2024-02-27").toISOString(),
  },
  {
    id: "13",
    title: "Why Developers Burn Out",
    content:
      "Burnout often comes from unclear goals, constant pressure, and no sense of progress.",
    author: { id: "a8", firstName: "Maya", lastName: "Singh" },
    createdAt: new Date("2024-03-03").toISOString(),
  },
  {
    id: "14",
    title: "Code Reviews Are Not Personal Attacks",
    content:
      "Feedback is about the code, not the person. Strong teams normalize constructive criticism.",
    author: { id: "a10", firstName: "Oliver", lastName: "Brown" },
    createdAt: new Date("2024-03-07").toISOString(),
  },
  {
    id: "15",
    title: "Focus on Fundamentals Before Frameworks",
    content:
      "Frameworks change. Fundamentals compound. Learn the core concepts deeply.",
    author: { id: "a1", firstName: "System", lastName: "Admin" },
    createdAt: new Date("2024-03-12").toISOString(),
  },
  {
    id: "16",
    title: "Why Most To-Do Lists Fail",
    content:
      "Too many tasks create anxiety. Fewer priorities create momentum.",
    author: { id: "a6", firstName: "Ravi", lastName: "Sharma" },
    createdAt: new Date("2024-03-17").toISOString(),
  },
  {
    id: "17",
    title: "You Don’t Need to Know Everything",
    content:
      "Good developers know how to find answers quickly, not how to memorize everything.",
    author: { id: "a9", firstName: "Daniel", lastName: "Reed" },
    createdAt: new Date("2024-03-22").toISOString(),
  },
  {
    id: "18",
    title: "Why Small Wins Matter",
    content:
      "Progress feels invisible until you acknowledge small improvements along the way.",
    author: { id: "a7", firstName: "Elena", lastName: "Kovacs" },
    createdAt: new Date("2024-03-27").toISOString(),
  },
  {
    id: "19",
    title: "Writing Code Is Thinking Out Loud",
    content:
      "Code is just a formal way of expressing logic. Messy code often reflects messy thinking.",
    author: { id: "a10", firstName: "Oliver", lastName: "Brown" },
    createdAt: new Date("2024-04-01").toISOString(),
  },
  {
    id: "20",
    title: "Progress Is Quiet",
    content:
      "Most growth happens silently. Keep going even when no one is watching.",
    author: { id: "a5", firstName: "Chris", lastName: "Walker" },
    createdAt: new Date("2024-04-06").toISOString(),
  },
];


const BlogFeed = () => {
  const [blogs, setBlogs] = useState([]);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState([]);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await API.get('/blogs/published');
        const posts = res.data?.data;
        if (Array.isArray(posts) && posts.length) {
          setBlogs(posts);
          setIsDemo(false);
        } else {
          setBlogs(demoBlogs);
          setIsDemo(true);
        }
      } catch {
        setBlogs(demoBlogs);
        setIsDemo(true);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  const toggleFollow = (authorId) => {
    setFollowing((prev) =>
      prev.includes(authorId)
        ? prev.filter((id) => id !== authorId)
        : [...prev, authorId]
    );
  };

  if (loading) {
    return <div className="blog-loading">Loading words that matter…</div>;
  }

  return (
    <div className="blog-page">
      <header className="blog-header">
        <div>
          <h1>The Feed</h1>
          <p>Thoughts written with intention. No noise.</p>
          {isDemo && <span className="demo-badge">Offline demo</span>}
        </div>

        <div className="blog-actions">
<Link to="/blog/my-blogs" className="ghost-btn">
  My Blogs
</Link>          <button className="ghost-btn">Following</button>
          <button className="primary-btn">Write</button>
        </div>
      </header>

      <section className="blog-list">
        {blogs.map((blog) => {
          const authorId = blog.author?.id;
          const isFollowing = following.includes(authorId);

          return (
            <article key={blog.id} className="blog-card">
              <h2>{blog.title}</h2>

              <div className="blog-meta">
                <span className="author">
                  {blog.author?.firstName} {blog.author?.lastName}
                </span>
                <span>•</span>
                <time>
                  {new Date(blog.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </time>

                <button
                  className={`follow-btn ${
                    isFollowing ? "following" : ""
                  }`}
                  onClick={() => toggleFollow(authorId)}
                >
                  {isFollowing ? "Following ✓" : "Follow"}
                </button>
              </div>

              <p>{blog.content}</p>

              <button className="read-more">
                Read →
              </button>
            </article>
          );
        })}
      </section>
    </div>
  );
};

export default BlogFeed;
