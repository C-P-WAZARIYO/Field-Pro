import "../styles/Allocate.css";
import React, { useState } from "react";
import API from "../api/axios";

const Allocate = () => {
  const [files, setFiles] = useState({ work: null, mapping: null });
  const [config, setConfig] = useState({
    mode: "update",
    bank: "",
    bkt: "",
    product: "",
  });
  const [loading, setLoading] = useState(false);

  const handleProcess = async () => {
    if (!files.work) return alert("Please upload the Primary Work File");

    setLoading(true);
    const formData = new FormData();
    formData.append("workFile", files.work);
    if (files.mapping) formData.append("mappingFile", files.mapping);

    Object.keys(config).forEach((key) =>
      formData.append(key, config[key])
    );

    try {
      const res = await API.post("/allocation/process", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert(`Process Complete: ${res.data.message}`);
    } catch (err) {
      console.error("Allocation Error:", err);
      alert(err.response?.data?.message || "Processing failed");
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="allocate-root">
    <div className="allocate-card">

      <header className="allocate-header">
        <h1>Data Allocation Engine</h1>
        <p>Upload, map, and sync large datasets with precision filters.</p>
      </header>

      <div className="allocate-grid">

        {/* LEFT */}
        <div className="space-y-8">

          <section className="allocate-section1 space-y-5">
            <div className="allocate-label">1. Processing Mode</div>
            <div className="mode-grid">
              {["update", "re-enter", "remove"].map((m) => (
                <button
                  key={m}
                  onClick={() => setConfig({ ...config, mode: m })}
                  className={`mode-btn ${
                    config.mode === m ? "active" : ""
                  }`}
                >
                  {m.replace("-", " ")}
                </button>
              ))}
            </div>
          </section>

          <section className="allocate-section space-y-5">
            <div className="allocate-label">2. Target Filters</div>

            <div>
              <label className="text-xs text-slate-400 font-bold">Bank</label>
              <input
                className="allocate-input"
                value={config.bank}
                onChange={(e) =>
                  setConfig({ ...config, bank: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                className="allocate-input"
                placeholder="BKT"
                value={config.bkt}
                onChange={(e) =>
                  setConfig({ ...config, bkt: e.target.value })
                }
              />
              <input
                className="allocate-input"
                placeholder="Product"
                value={config.product}
                onChange={(e) =>
                  setConfig({ ...config, product: e.target.value })
                }
              />
            </div>
          </section>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">

          <section className="allocate-section space-y-6">
            <div className="allocate-label">3. Upload Files</div>

            <label className="upload-box">
              <input type="file" hidden onChange={(e) =>
                setFiles({ ...files, work: e.target.files[0] })
              } />
              <div className="upload-icon">📂</div>
              <strong>{files.work?.name || "Primary Work File"}</strong>
            </label>

            <label className="upload-box">
              <input type="file" hidden onChange={(e) =>
                setFiles({ ...files, mapping: e.target.files[0] })
              } />
              <div className="upload-icon">🗺️</div>
              <strong>{files.mapping?.name || "Mapping File (Optional)"}</strong>
            </label>
          </section>

          <button
            className="execute-btn"
            onClick={handleProcess}
            disabled={loading}
          >
            {loading ? "PROCESSING..." : "EXECUTE ALLOCATION"}
          </button>
        </div>
      </div>
    </div>
  </div>
);

};

export default Allocate;
