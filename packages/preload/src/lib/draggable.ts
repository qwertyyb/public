import { ipcRenderer } from "electron";
import { isFocusable } from "@public/utils/render";

export const createDraggable = () => {
  let drag = false;
  const distance = { x: 0, y: 0 };
  const pointerDownHandler = (e: PointerEvent) => {
    if (e.button !== 0) return;
    const dragArea = e.clientY < 48;
    const canFocus = isFocusable(e.target as Element);
    drag = dragArea && !canFocus;
    if (drag) {
      distance.x = e.clientX;
      distance.y = e.clientY;
    }
  };

  const pointerUpHandler = (e: PointerEvent) => {
    if (e.button === 0) {
      drag = false;
    }
  };

  const pointerMoveHandler = (e: PointerEvent) => {
    if (!drag) return;
    const options = {
      screenX: e.screenX,
      screenY: e.screenY,
      clientX: distance.x,
      clientY: distance.y,
    };
    ipcRenderer.send("moveWindow", options);
  };
  window.addEventListener("pointerdown", pointerDownHandler, true);
  window.addEventListener("pointerup", pointerUpHandler, true);
  window.addEventListener("pointermove", pointerMoveHandler, true);
  window.addEventListener("pointercancel", pointerUpHandler, true);
};
