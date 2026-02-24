import React, { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim"; // Loads the engine core
import { loadHeartShape } from "@tsparticles/shape-heart"; // Specifically for Valentine hearts

const Valentine = () => {
  const [init, setInit] = useState(false);

  // This runs once when the component mounts
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      // loadSlim loads the basic features (move, opacity, etc.)
      await loadSlim(engine);
      // loadHeartShape adds the actual heart geometry
      await loadHeartShape(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const particlesLoaded = (container) => {
    console.log("Hearts are ready!", container);
  };

  const options = {
    fpsLimit: 120,
    interactivity: {
      events: {
        onClick: { enable: true, mode: "push" }, // Add more hearts on click!
        resize: true,
      },
    },
    particles: {
      color: {
        value: ["#ff0000", "#ff69b4", "#ff1493", "#800080"], // Red, Pink, Deep Pink, Purple
      },
      move: {
        direction: "random", // Hearts float upward
        enable: true,
        outModes: {
          default: "out",
        },
        random: true,
        speed: { min: 1, max: 4 },
        straight: false,
      },
      number: {
        density: {
          enable: true,
          area: 800,
        },
        value: 20, // Adjust this for more or fewer hearts
      },
      opacity: {
        value: { min: 0.3, max: 0.7 },
      },
      shape: {
        type: "heart", // This is enabled by loadHeartShape
      },
      size: {
        value: { min: 10, max: 14 },
      },
    },
    detectRetina: true,
  };

  if (init) {
    return (
      <Particles
        id="tsparticles"
        particlesLoaded={particlesLoaded}
        options={options}
      />
    );
  }

  return <div style={{ color: 'white', textAlign: 'center', marginTop: '20px' }}>Loading Romance...</div>;
};

export default Valentine;