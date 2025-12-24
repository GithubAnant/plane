import { Canvas } from "@react-three/fiber";
import { MobileData } from "./Ui/MobileData";
import { MobileController } from "./Ui/mobile/MobileController";
import { Experience } from "./Experience";
import { usePartyKitConnection } from "./hooks";
import { GithubLink } from "./Ui/GithubLink";
import { GameOver } from "./Ui/GameOver";
import { ScoreDisplay } from "./Ui/ScoreDisplay";
import { Analytics } from "@vercel/analytics/react"

function App() {
console.log(`%c
        __|__
   ----o-(_)-o----
          |

     Hi there!
`, 'color: #4A90E2; font-family: monospace;');
  const deviceType = new URLSearchParams(window.location.search).get("room")
    ? "mobile"
    : "desktop";

  usePartyKitConnection(deviceType);
  if (deviceType === "mobile") {
    return <MobileController />;
  }
  return (
    <div className="canvas-container">
      <MobileData />
      <Analytics/>
      <GithubLink />
      <ScoreDisplay />
      <GameOver />
      <Canvas>
        <Experience />
      </Canvas>
    </div>
  );
}

export default App;
