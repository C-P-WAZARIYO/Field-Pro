import React, { useState } from "react";
import { Edit3, Trash2, Eye, Plus } from "lucide-react";
import { Link } from "react-router-dom";

import "../styles/MyBlog.css";

const dummyMyBlogs = [
  {
    id: "1",
    title: "My First Professional Blog",
    status: "PUBLISHED",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Learning DevOps: A Journey",
    status: "DRAFT",
    updatedAt: new Date().toISOString(),
  },
];

const emptyQuotes = [
  "Silence is fine. But your ideas deserve a voice.",
  "This workspace is empty. That’s temporary.",
  "Drafts don’t write themselves. You do.",
  "No blogs yet. Even legends start with zero.",
];

const MyBlogs = () => {
  const [myBlogs] = useState(dummyMyBlogs);
  const randomQuote =
    emptyQuotes[Math.floor(Math.random() * emptyQuotes.length)];

  return (
    <div className="myblogs-page">
     

      <main className="myblogs-container">
        <header className="myblogs-header">
          <div>
            <h1>My Workspace</h1>
            <p>
              Your words. Your drafts. Your control.
              <span className="signature"> — Built by you.</span>
            </p>
          </div>

          <Link to="/editor" className="new-blog-btn">
            <Plus size={18} /> New Blog
          </Link>
        </header>

        <section className="myblogs-content">
          {Array.isArray(myBlogs) && myBlogs.length > 0 ? (
            myBlogs.map((blog) => (
              <article key={blog.id} className="myblog-row">
                <div className="myblog-info">
                  <h3>{blog.title}</h3>
                  <div className="meta">
                    <span
                      className={`status ${
                        blog.status === "PUBLISHED"
                          ? "published"
                          : "draft"
                      }`}
                    >
                      {blog.status}
                    </span>
                    <span className="dot">•</span>
                    <time>
                      Updated{" "}
                      {new Date(blog.updatedAt).toLocaleDateString()}
                    </time>
                  </div>
                </div>

                <div className="actions">
                  <button title="Preview">
                    <Eye size={18} />
                  </button>
                  <button title="Edit">
                    <Edit3 size={18} />
                  </button>
                  <button title="Delete" className="danger">
                    <Trash2 size={18} />
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state">
              <h2>Nothing here… yet.</h2>
              <p>{randomQuote}</p>
              <Link to="/editor" className="new-blog-btn large">
                Write your first blog
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default MyBlogs;
