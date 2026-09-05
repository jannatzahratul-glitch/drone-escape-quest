import { createRoot } from "react-dom/client";
import { MazeEscapeGame } from "@/components/game/MazeEscapeGame";
import "./styles.css";

createRoot(document.getElementById("root")!).render(<MazeEscapeGame />);
