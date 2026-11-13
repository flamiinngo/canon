import { Composition } from "remotion";
import { CanonFilm, FILM_FRAMES } from "./Film";

export const Root: React.FC = () => (
  <>
    <Composition id="CanonFilm" component={CanonFilm} durationInFrames={FILM_FRAMES} fps={30} width={1920} height={1080} />
  </>
);
