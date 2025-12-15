export const GithubLink = () => {
  return (
    <a
      href="https://github.com/GithubAnant/plane"
      target="_blank"
      rel="noopener noreferrer"
      className="github-link"
      aria-label="View source on GitHub"
    >
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
      </svg>
      <style jsx>{`
        .github-link {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2d333b 0%, #1c2128 100%);
          color: #ffffff;
          text-decoration: none;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }

        .github-link::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            45deg,
            transparent 30%,
            rgba(255, 255, 255, 0.3) 50%,
            transparent 70%
          );
          transform: translateX(-100%) translateY(-100%) rotate(45deg);
          transition: transform 0.6s ease;
        }

        .github-link:hover {
          transform: scale(1.15);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
          background: linear-gradient(135deg, #24292e 0%, #0d1117 100%);
        }

        .github-link:hover::before {
          transform: translateX(100%) translateY(100%) rotate(45deg);
        }

        .github-link:active {
          transform: scale(1.05);
        }

        .github-link svg {
          position: relative;
          z-index: 1;
          transition: transform 0.3s ease;
        }

        .github-link:hover svg {
          transform: rotate(360deg);
        }

        @media (max-width: 768px) {
          .github-link {
            bottom: 15px;
            right: 15px;
            width: 45px;
            height: 45px;
          }

          .github-link svg {
            width: 35px;
            height: 35px;
          }
        }
      `}</style>
    </a>
  );
};
