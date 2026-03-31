import { useEffect, useState } from "react";
import { MainView } from "./components/MainView";
import { Overlay } from "./components/Overlay";

function App() {
  const [isOverlay, setIsOverlay] = useState(false);

  useEffect(() => {
    // Check if we're in overlay mode
    const hash = window.location.hash;
    setIsOverlay(hash === "#overlay");
  }, []);

  if (isOverlay) {
    return <Overlay />;
  }

  return <MainView />;
}

export default App;
