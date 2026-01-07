import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import TextChatView from "./components/figma/TextChatView";
import VoiceChatView from "./components/figma/VoiceChatView";
import CameraChatView from "./components/figma/CameraChatView";
import TransitionOverlay from "./components/figma/TransitionOverlay";
import {
  RightSideBackgroundImage,
  TimeBackgroundImageAndText,
} from "./components/figma/SharedAssets";
import "../styles/fonts.css";

type ViewState = "text" | "voice" | "camera";

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>("text");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [pendingView, setPendingView] = useState<ViewState | null>(null);

  const variants = {
    enter: {
      opacity: 0,
      scale: 0.95,
      filter: "blur(10px)",
    },
    center: {
      zIndex: 1,
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
    },
    exit: {
      zIndex: 0,
      opacity: 0,
      scale: 1.05,
      filter: "blur(10px)",
    },
  };

  const [[page, direction], setPage] = useState([0, 0]);

  // Standard pagination (if needed without transition)
  const paginate = (newDirection: number, newView: ViewState) => {
    setPage([page + newDirection, newDirection]);
    setCurrentView(newView);
  };

  // Trigger the Cinematic Transition
  const triggerCinematicSwitch = (newView: ViewState, newDirection: number) => {
    if (isTransitioning) return; // Prevent double clicks
    
    setPendingView(newView);
    // Direction is less relevant for the warp transition, but we keep state consistent
    setPage([page + newDirection, newDirection]); 
    setIsTransitioning(true);
  };

  const handleSwitchToVoice = () => {
    // Only use cinematic transition if coming from Text view
    if (currentView === "text") {
      triggerCinematicSwitch("voice", 1);
    } else {
      paginate(1, "voice");
    }
  };

  const handleSwitchToCamera = () => paginate(1, "camera"); // Camera always uses standard transition

  const handleSwitchToText = () => {
    // Only use cinematic transition if coming from Voice view
    if (currentView === "voice") {
      triggerCinematicSwitch("text", -1);
    } else {
      paginate(-1, "text");
    }
  };

  return (
    <div className="w-full h-[100dvh] bg-gray-100 flex items-center justify-center font-sans overflow-hidden">
      <div className="relative w-full h-full md:max-w-[440px] md:h-[95vh] md:max-h-[956px] md:aspect-[440/956] bg-black md:rounded-[40px] md:shadow-2xl overflow-hidden md:ring-8 md:ring-gray-900/5">
        
        {/* Cinematic Transition Layer */}
        <TransitionOverlay 
          isActive={isTransitioning}
          onTransitionMiddle={() => {
            if (pendingView) {
                setCurrentView(pendingView);
                setPendingView(null);
            }
          }}
          onTransitionEnd={() => {
            setIsTransitioning(false);
          }}
        />

        {/* Persistent Status Bar */}
        <div className="absolute h-[44px] left-0 overflow-clip top-0 w-full z-50 pointer-events-none">
          <RightSideBackgroundImage />
          <div className="absolute contents left-[24px] top-[12px]">
            <TimeBackgroundImageAndText text="9:41" />
          </div>
        </div>

        <AnimatePresence initial={false} mode="popLayout">
          {currentView === "text" && (
            <motion.div
              key="text"
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                duration: 0.4,
                ease: [0.4, 0, 0.2, 1], // Ease-out-quad or similar smooth curve
              }}
              className="absolute inset-0 size-full"
            >
              <TextChatView
                onSwitchToVoice={handleSwitchToVoice}
                onSwitchToCamera={handleSwitchToCamera}
               />
            </motion.div>
          )}

          {currentView === "voice" && (
            <motion.div
              key="voice"
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                duration: 0.4,
                ease: [0.4, 0, 0.2, 1],
              }}
              className="absolute inset-0 size-full"
            >
              <VoiceChatView 
                onSwitchToText={handleSwitchToText} 
                onSwitchToCamera={handleSwitchToCamera}
              />
            </motion.div>
          )}

          {currentView === "camera" && (
            <motion.div
              key="camera"
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                duration: 0.4,
                ease: [0.4, 0, 0.2, 1],
              }}
              className="absolute inset-0 size-full"
            >
              <CameraChatView onSwitchToText={handleSwitchToText} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
