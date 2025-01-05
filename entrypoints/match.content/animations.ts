import { AutodartsToolsMatchStatus } from "@/utils/storage";
import { playAnimation } from "@/utils/playAnimation";

export async function animations() {
  const matchStatus = await AutodartsToolsMatchStatus.getValue();
  const { turnPoints, throws } = matchStatus;
  const curThrowPointsName = throws.slice(-1)[0];

  const buttons = Array.from(document.querySelectorAll(".chakra-button"));
  const isLegWinner = buttons.some(button => (button as HTMLElement).innerText === "Next Leg");

  if (isLegWinner) {
    playAnimation("winner");
    return;
  }

  switch (turnPoints) {
    case "BUST":
      playAnimation("bust");
      return;
    case "180":
      playAnimation("oneEighty");
      return;
  }

  switch (curThrowPointsName) {
    case "BULL":
      playAnimation("bull");
      break;
    default:
      if (curThrowPointsName.startsWith("M")) {
        playAnimation("miss");
      }
      break;
  }
}