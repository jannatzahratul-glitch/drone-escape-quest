import { createFileRoute } from "@tanstack/react-router";
import { MazeEscapeGame } from "@/components/game/MazeEscapeGame";

export const Route = createFileRoute("/")({
  // WebGL canvas must never render on the server
  ssr: false,
  head: () => ({
    meta: [
      { title: "Maze Escape — The One Way Out" },
      {
        name: "description",
        content:
          "Maze Escape is a 3D drone-view maze game. Explore a stone labyrinth, dodge fake gates and find the only real exit.",
      },
      { property: "og:title", content: "Maze Escape — The One Way Out" },
      {
        property: "og:description",
        content: "Navigate a cinematic 3D stone labyrinth and find the one gate that opens.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MazeEscapeGame,
});
