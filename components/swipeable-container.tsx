"use client";

import { useState, useRef } from "react";
import { motion, PanInfo } from "motion/react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

interface SwipeableContainerProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  showSwipeIndicators?: boolean;
  currentView: 'reading' | 'chat';
}

export function SwipeableContainer({ 
  children, 
  onSwipeLeft, 
  onSwipeRight, 
  showSwipeIndicators = true,
  currentView 
}: SwipeableContainerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDragEnd = (event: any, info: PanInfo) => {
    setIsDragging(false);
    
    const threshold = 100; // Minimum distance to trigger swipe
    
    if (info.offset.x > threshold && onSwipeRight) {
      onSwipeRight();
    } else if (info.offset.x < -threshold && onSwipeLeft) {
      onSwipeLeft();
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden" ref={containerRef}>
      <motion.div
        className="w-full h-full"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>

      {/* Swipe Indicators */}
      {showSwipeIndicators && (
        <>
          {/* Left indicator (for going back to reading) */}
          {currentView === 'chat' && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <div className="bg-black/50 text-white rounded-full p-2 backdrop-blur-sm">
                <ChevronLeftIcon className="h-4 w-4" />
              </div>
              <p className="text-xs text-white mt-1 text-center">Swipe to read</p>
            </div>
          )}

          {/* Right indicator (for going to chat) */}
          {currentView === 'reading' && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <div className="bg-blue-600 text-white rounded-full p-2 backdrop-blur-sm">
                <ChevronRightIcon className="h-4 w-4" />
              </div>
              <p className="text-xs text-white mt-1 text-center">Swipe to chat</p>
            </div>
          )}
        </>
      )}
    </div>
  );
} 