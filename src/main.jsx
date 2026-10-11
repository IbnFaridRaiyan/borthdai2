import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const driveImage = (id) => `https://drive.google.com/thumbnail?id=${id}&sz=w1600`;
const readSessionScore = () => {
  const scoreCookie = document.cookie.split("; ").find((cookie) => cookie.startsWith("hasib-birthday-score="));
  return Number(scoreCookie?.split("=")[1]) || 0;
};
const gameLevels = [
  { bricks: 10, columns: 5, speed: 2.8 },
  { bricks: 20, columns: 5, speed: 3.3 },
  { bricks: 30, columns: 6, speed: 3.9 },
  { bricks: 40, columns: 8, speed: 4.5 },
  { bricks: 50, columns: 10, speed: 5.2 },
  { bricks: 60, columns: 10, speed: 6 },
];

const memories = [
  {
    image: "1Ytwuby-7Ff-JtbE98SDlwoo5wdWz0Q7R",
    title: "The legendary Slap",
    description:
      "Bro can slap the hell out of the situations whatever difficulty comes in his way. Never seen someone so bold, just amazing, until bro slaps the hell out of me after seeing this :v",
    note: "Exhibit A · the origin story",
  },
  {
    image: "1Y1P_xOlXYneEdCLBCvdpum5bpFpC3DaH",
    title: "Even the cat started running from the BroSlap",
    description: "",
    note: "No further explanation needed",
  },
  {
    image: "1I95yKRgSrRuCHwqHrDMrJWS_QvAfeDOd",
    title: "Apologies in advance",
    description:
      "whatever happens happens, bro has a good heart, I know I can get away with these today, thanks B) gotta share some real memories now get ready",
    note: "Please accept this formal warning",
  },
  {
    image: "1Ofh4yoNuua-j7MBsnwdsDfrKtjF14Xpe",
    title: "The ‘Ki Tulsos Hala’ phase",
    description:
      "Bro doesnt complain much about pictures tbh, as much as bro complains about the life decisions I make for myself. Respect and love for bro for caring a lot. Thanks bro :3",
    note: "A certified classic",
  },
  {
    image: "1ZqMcl6vByq_9vOlAvBgHMf_Or8gnvJRg",
    title: "Realized something",
    description:
      "Where's our* single pictures bro? Couldnt find one, dont forget about it today.",
    note: "A request for the next photo dump",
  },
  {
    image: "1V2bnvDxeTMPLdxBWxsRrbqLjM1stFaH0",
    title: "Bro has some aura",
    description:
      "the aura that never fades, sometimes i feel like bro doesnt have any aura but aura has bro. ifykwim.",
    note: "Aura report: still immeasurable",
  },
  {
    image: "1s1iqgB-WCrN7IEfe4Y0_aZUX-62ntdmm",
    title: "ThE AsToN MaRtiN",
    description:
      "I know bro would buy me this car one day, even if you dont atleast buy this soon for yourself so that i can ride and race, directly into the Ilkley highway, would love to jump across the bridges. Look at the image, the way bro looked at it, shows complete ambition of getting it for me :3",
    note: "I'll take delivery whenever you're ready",
  },
];

function useReveal() {
  useEffect(() => {
    const elements = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);
}

function useScrollProgress() {
  useEffect(() => {
    let frame = 0;
    const updateProgress = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const scrollableHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        const progress =
          scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
        document.documentElement.style.setProperty(
          "--scroll-progress",
          String(Math.min(1, Math.max(0, progress))),
        );
      });
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
      if (frame) cancelAnimationFrame(frame);
      document.documentElement.style.removeProperty("--scroll-progress");
    };
  }, []);
}

function PhotoCard({ memory, index }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <article
      className={`memory-card reveal ${index % 2 ? "memory-card-reverse" : ""}`}
      style={{ "--card-delay": `${(index % 3) * 100}ms` }}
    >
      <div className={`memory-image-wrap ${loaded ? "image-loaded" : ""}`}>
        {!failed ? (
          <img
            src={driveImage(memory.image)}
            alt={memory.title}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="image-fallback">
            <span aria-hidden="true">✦</span>
            <p>One for the memory book</p>
          </div>
        )}
        <span className="image-index">{String(index + 1).padStart(2, "0")}</span>
      </div>
      <div className="memory-copy">
        <span className="eyebrow">{memory.note}</span>
        <h3>{memory.title}</h3>
        {memory.description && <p>{memory.description}</p>}
        <span className="memory-sparkle" aria-hidden="true">✳</span>
      </div>
    </article>
  );
}

function BreakoutGame() {
  const canvasRef = useRef(null);
  const paddleX = useRef(285);
  const scoreRef = useRef(0);
  const hitCountRef = useRef(0);
  const [score, setScore] = useState(0);
  const [lastScore, setLastScore] = useState(readSessionScore);
  const [level, setLevel] = useState(1);
  const [status, setStatus] = useState("ready");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext("2d");
    const width = 760;
    const height = 500;
    const paddleWidth = 190;
    const paddleHeight = 144;
    const paddleY = 458;
    const ballRadius = 8;
    const currentLevel = gameLevels[level - 1];
    const ballSpeed = currentLevel.speed;
    const columns = currentLevel.columns;
    const rows = currentLevel.bricks / columns;
    const brickGap = 8;
    const brickWidth = (width - 72 - brickGap * (columns - 1)) / columns;
    const bricks = [];

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        bricks.push({
          x: 36 + column * (brickWidth + brickGap),
          y: 55 + row * 34,
          width: brickWidth,
          height: 23,
          alive: true,
          color: ["#c59b58", "#9e9a79", "#77836e", "#87979a"][row % 4],
        });
      }
    }

    hitCountRef.current = 0;
    let ball = { x: width / 2, y: height - 86, dx: ballSpeed * 0.7, dy: -ballSpeed };
    let animationFrame;
    const paddleImage = new Image();
    paddleImage.src = "/dxball-bro.png";

    const roundedRect = (x, y, rectWidth, rectHeight, radius) => {
      context.beginPath();
      context.roundRect(x, y, rectWidth, rectHeight, radius);
      context.fill();
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      context.fillStyle = "#1e241f";
      context.fillRect(0, 0, width, height);

      context.fillStyle = "rgba(255,255,255,.08)";
      for (let i = 0; i < 24; i += 1) {
        const x = (i * 131 + 35) % width;
        const y = (i * 71 + 19) % height;
        context.beginPath();
        context.arc(x, y, i % 3 === 0 ? 1.6 : 1, 0, Math.PI * 2);
        context.fill();
      }

      bricks.forEach((brick) => {
        if (!brick.alive) return;
        context.fillStyle = brick.color;
        roundedRect(brick.x, brick.y, brick.width, brick.height, 6);
        context.fillStyle = "rgba(255,255,255,.3)";
        context.fillRect(brick.x + 7, brick.y + 4, Math.max(12, brick.width * 0.35), 2);
      });

      const currentPaddleX = Math.max(10, Math.min(width - paddleWidth - 10, paddleX.current));
      context.fillStyle = "rgba(197,155,88,.22)";
      roundedRect(currentPaddleX - 6, paddleY - 7, paddleWidth + 12, 19, 9);
      if (paddleImage.complete && paddleImage.naturalWidth) {
        context.drawImage(paddleImage, currentPaddleX, paddleY - paddleHeight, paddleWidth, paddleHeight);
      } else {
        context.fillStyle = "#c59b58";
        roundedRect(currentPaddleX, paddleY - 3, paddleWidth, 14, 6);
      }

      const glow = context.createRadialGradient(ball.x, ball.y, 1, ball.x, ball.y, 17);
      glow.addColorStop(0, "rgba(208,173,109,.34)");
      glow.addColorStop(1, "rgba(255,227,164,0)");
      context.fillStyle = glow;
      context.beginPath();
      context.arc(ball.x, ball.y, 17, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#e7dfc9";
      context.beginPath();
      context.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
      context.fill();

      if (status !== "playing") return;

      const movementScale = 1040 / Math.max(1, canvas.getBoundingClientRect().width);
      const steps = Math.ceil((Math.hypot(ball.dx, ball.dy) * movementScale) / 5);
      let hitBrick = false;

      for (let step = 0; step < steps; step += 1) {
        ball.x += (ball.dx * movementScale) / steps;
        ball.y += (ball.dy * movementScale) / steps;
        if (ball.x - ballRadius <= 0 || ball.x + ballRadius >= width) ball.dx *= -1;
        if (ball.y - ballRadius <= 0) ball.dy = Math.abs(ball.dy);

        const boundedPaddleX = Math.max(10, Math.min(width - paddleWidth - 10, paddleX.current));
        if (
          ball.dy > 0 &&
          ball.y + ballRadius >= paddleY - 3 &&
          ball.y + ballRadius <= paddleY + 13 &&
          ball.x >= boundedPaddleX - ballRadius &&
          ball.x <= boundedPaddleX + paddleWidth + ballRadius
        ) {
          const hitPosition = (ball.x - (boundedPaddleX + paddleWidth / 2)) / (paddleWidth / 2);
          ball.dx = hitPosition * ballSpeed * 0.9;
          ball.dy = -Math.sqrt(Math.max(1, ballSpeed ** 2 - ball.dx ** 2));
        }

        for (const brick of bricks) {
          if (
            brick.alive &&
            ball.x + ballRadius > brick.x &&
            ball.x - ballRadius < brick.x + brick.width &&
            ball.y + ballRadius > brick.y &&
            ball.y - ballRadius < brick.y + brick.height
          ) {
            brick.alive = false;
            ball.dy *= -1;
            hitCountRef.current += 1;
            scoreRef.current += 10;
            setScore(scoreRef.current);
            setLastScore(scoreRef.current);
            document.cookie = `hasib-birthday-score=${scoreRef.current}; Path=/; SameSite=Lax`;
            if (hitCountRef.current === currentLevel.bricks) {
              if (level === gameLevels.length) setStatus("won");
              else setLevel((previousLevel) => previousLevel + 1);
            }
            hitBrick = true;
            break;
          }
        }
        if (hitBrick) break;
        if (ball.y - ballRadius > height) {
          setStatus("lost");
          return;
        }
      }
      animationFrame = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationFrame);
  }, [level, status]);

  useEffect(() => {
    const movePaddle = (event) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") event.preventDefault();
      if (event.key === "ArrowLeft") paddleX.current -= 38;
      if (event.key === "ArrowRight") paddleX.current += 38;
      if (event.key === " " && status !== "playing") setStatus("playing");
    };
    window.addEventListener("keydown", movePaddle);
    return () => window.removeEventListener("keydown", movePaddle);
  }, [status]);

  const moveByPointer = (event) => {
    const bounds = canvasRef.current.getBoundingClientRect();
    paddleX.current = ((event.clientX - bounds.left) / bounds.width) * 760 - 95;
  };

  const restart = () => {
    scoreRef.current = 0;
    setScore(0);
    setLevel(1);
    setStatus("playing");
  };

  const startGame = () => {
    if (status === "won" || status === "lost") restart();
    else setStatus("playing");
  };

  return (
    <section className="game-section" id="game">
      <div className="game-heading reveal">
        <span className="eyebrow">THE BIRTHDAY BONUS ROUND</span>
        <h2>Bro vs. the bricks.</h2>
        <p>Six levels. One legendary paddle. You know what to do.</p>
      </div>
      <div className="game-shell reveal">
        <div className="game-topbar">
          <div className="game-stat"><span>SCORE</span><strong>{score}</strong></div>
          <div className="game-level">LEVEL <strong>{level}</strong><span className="level-dots">{gameLevels.map((gameLevel, index) => <i key={gameLevel.bricks} className={level > index ? "active" : ""} />)}</span></div>
          <div className="game-stat game-best"><span>LAST SCORE</span><strong>{lastScore}</strong></div>
        </div>
        <div className="canvas-wrap">
          <canvas
            ref={canvasRef}
            width="760"
            height="500"
            aria-label="Breakout game. Move the paddle with the arrow keys or touch."
            onPointerMove={moveByPointer}
            onPointerDown={moveByPointer}
          />
          {status !== "playing" && (
            <div className="game-overlay">
              <span className="overlay-icon" aria-hidden="true">
                {status === "won" ? "✦" : status === "lost" ? "♡" : "✳"}
              </span>
              <h3>{status === "won" ? "Absolute legend!" : status === "lost" ? "One more round?" : "Ready, bro?"}</h3>
              <p>
                {status === "won"
                  ? "All 210 bricks. That's a birthday-worthy score."
                  : status === "lost"
                    ? "The bricks got lucky. Your best is saved for this visit."
                    : "Use ← → or slide your finger to move the paddle."}
              </p>
              <button className="play-button" onClick={startGame}>
                {status === "ready" ? "LET'S PLAY" : "PLAY AGAIN"} <span aria-hidden="true">↗</span>
              </button>
            </div>
          )}
        </div>
        <div className="game-footnote">
          <span>← → KEYBOARD</span><span>TOUCH & DRAG</span><span>LEVEL 6 = FASTEST</span>
        </div>
      </div>
    </section>
  );
}

function App() {
  useReveal();
  useScrollProgress();
  return (
    <main>
      <div className="page-grain" aria-hidden="true" />
      <div className="scroll-progress" aria-hidden="true" />
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Back to top">for bro<span>✳</span></a>
        <a className="header-link" href="#memories">THE MEMORY LANE <span>↓</span></a>
      </header>

      <section className="hero" id="top">
        <div className="hero-orbit orbit-one" aria-hidden="true" />
        <div className="hero-orbit orbit-two" aria-hidden="true" />
        <span className="hero-sticker sticker-one" aria-hidden="true">✳</span>
        <span className="hero-sticker sticker-two" aria-hidden="true">♡</span>
        <div className="hero-copy">
          <span className="eyebrow hero-eyebrow"><span /> A LITTLE SOMETHING FOR YOU <span /></span>
          <h1><span className="title-line">This is your</span><span className="title-highlight">birthday, bro!</span></h1>
          <div className="hero-photo">
            <div className="hero-photo-frame">
              <img src={driveImage("1QvF-S9TK2c5W--YmsQMCCNdRjRCAG1IL")} alt="Birthday surprise for Hasib Bro" />
              <div className="photo-caption"><span>THE BIRTHDAY BOY</span><span>↗</span></div>
            </div>
          </div>
          <div className="hero-rule"><span /></div>
          <p className="hero-happy">Happy Birthday<span>!</span></p>
          <p className="hero-message">
            Bro is always overconfident, the most amazing thing I found on you, I used to be like the same before UK showed me.. but bro never stopped being it, love that. Thanks for being the family to me, still remember my first appearance with you, and you never forget to tell that story to anyone new you find in front of me, with that same excitement over and over again lmao. Love the energy and the straightforwardness that you contain. Gonna blabber a lot about you today, some might make you mad, especially the pictures, but still not gonna stop xD scroll down to find out more…
          </p>
          <a className="scroll-cue" href="#memories"><span className="scroll-cue-icon">↓</span> SCROLL FOR THE GOOD STUFF</a>
        </div>
        <div className="hero-bottom"><span>HASIB BRO · AURA FARM MASTER</span><span>SCROLL A LITTLE ↓</span></div>
      </section>

      <section className="intro-strip reveal">
        <span className="intro-asterisk" aria-hidden="true">✳</span>
        <p>A few memories, some roasting and some messy coding*</p>
        <span className="intro-signature">— your not-so-little bro</span>
      </section>

      <section className="memories-section" id="memories">
        <div className="section-heading reveal">
          <div><span className="eyebrow">THE PHOTO EVIDENCE</span><h2>Our kind of<br /><em>memories.</em></h2></div>
          <p>Proceed with caution.<br />And maybe a little forgiveness.</p>
        </div>
        <div className="memory-list">
          {memories.map((memory, index) => <PhotoCard key={`${memory.title}-${index}`} memory={memory} index={index} />)}
        </div>
      </section>

      <BreakoutGame />

      <footer className="site-footer">
        <div className="footer-sparkle" aria-hidden="true">✳</div>
        <span className="eyebrow">AND THAT'S A WRAP</span>
        <h2>The end<span>.</span></h2>
        <p>
          Once again happy birthday, have a wonderful life ahead, many many prayers for you and your family, nvm the photoblast, could do with the best of your photos but.. Just didnt feel like it soo.. :v pardon (jk, sometimes good photos doesnt make the best memories, here's some deep sh*t for you now crack it). thanks a lot for being a part of my family. See you soon bro :D
        </p>
        <p className="footer-note">knew you would say you have predicted the surprrise xD</p>
        <div className="footer-signoff"><span>BIRTHDAY WISHES, A LITTLE CHAOS & MANY MEMORIES</span><span>HAPPY BIRTHDAY, HASIB BRO <b>♡</b></span></div>
        <div className="footer-credit">© Raiyan Ibn Farid 2026</div>
      </footer>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
