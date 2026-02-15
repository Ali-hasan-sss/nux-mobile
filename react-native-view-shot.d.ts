declare module "react-native-view-shot" {
  import { Component } from "react";
  import { ViewProps } from "react-native";

  export interface ViewShotOptions {
    format?: "png" | "jpg" | "webm";
    quality?: number;
    result?: "tmpfile" | "base64" | "data-uri";
    width?: number;
    height?: number;
  }

  export interface ViewShotProps extends ViewProps {
    options?: ViewShotOptions;
    captureMode?: "mount" | "continuous" | "update" | "none";
    onCapture?: (uri: string) => void;
    onCaptureFailure?: (error: Error) => void;
  }

  export default class ViewShot extends Component<ViewShotProps> {
    capture(options?: ViewShotOptions): Promise<string>;
  }

  export function captureRef(
    view: unknown,
    options?: ViewShotOptions
  ): Promise<string>;
}
