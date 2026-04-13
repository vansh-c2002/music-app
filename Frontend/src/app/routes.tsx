import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/landing-page";
import { UploadPage } from "./pages/upload-page";
import { EditorPage } from "./pages/editor-page";
import { NotFoundPage } from "./pages/not-found";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/upload",
    Component: UploadPage,
  },
  {
    path: "/editor",
    Component: EditorPage,
  },
  {
    path: "*",
    Component: NotFoundPage,
  },
]);