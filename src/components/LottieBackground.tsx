import React from "react";
import Lottie from "lottie-react";

interface LottieBackgroundProps {
  animationData: any;
  className?: string;
}

const LottieBackground: React.FC<LottieBackgroundProps> = ({
  animationData,
  className = "",
}) => {
  return (
    <div
      className={`fixed inset-0 flex justify-center items-center pointer-events-none z-0 ${className}`}
    >
      <Lottie
        animationData={animationData}
        loop={true}
        autoplay={true}
        style={{
          width: "50%",
          height: "80vh",
          opacity: 0.05, // Subtle background effect
        }}
      />
    </div>
  );
};

export default LottieBackground;
