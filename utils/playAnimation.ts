import { defaultAnimationsConfig } from "@/utils/animationsStorage";
import { AutodartsToolsConfig } from "@/utils/storage";

export async function playAnimation(configKey: string) {
  try {
    const isAnimationsEnabled = (await AutodartsToolsConfig.getValue()).animations.enabled;
    if (isAnimationsEnabled) {
      let animations = (await defaultAnimationsConfig)[configKey];
      var startDelay = (Number((await defaultAnimationsConfig).startDelay)) * 1000;
      var endDelay = (Number((await defaultAnimationsConfig).endDelay)) * 1000;
      var url = animations[getRandomInt(animations.length)].info;

      var animationContainer = document.createElement('div');
      animationContainer.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 9998;';
      
      var animation = document.createElement('img');
      animation.id = 'gif-animation';
      animation.src = url;
      animation.style.cssText = 'border: 2px solid white; width: 80%; height: 50%; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0; animation: fadeIn 0.3s forwards;';
      
      animationContainer.appendChild(animation);
      
      setTimeout(function() {
        document.body.appendChild(animationContainer);
      }, startDelay);
      
      setTimeout(function() {
        animation.style.animation = 'fadeOut 0.3s forwards';

        setTimeout(function() {
          if (animationContainer.parentNode) {
            animationContainer.parentNode.removeChild(animationContainer);
          }
        }, 300);
      }, (startDelay + endDelay));
    }
  } catch (e) {
    console.error("Autodarts Tools: Play animation - Error: ", e);
  }
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}