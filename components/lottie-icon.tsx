"use client";

import UseAnimations from "react-useanimations";
import checkmark from "react-useanimations/lib/checkmark";
import calendarIcon from "react-useanimations/lib/calendar";
import activityIcon from "react-useanimations/lib/activity";
import starIcon from "react-useanimations/lib/star";

const animations = {
  checkmark,
  calendar: calendarIcon,
  activity: activityIcon,
  star: starIcon,
};

export function LottieIcon({
  type,
  size = 22,
  color = "currentColor",
}: {
  type: keyof typeof animations;
  size?: number;
  color?: string;
}) {
  return (
    <UseAnimations
      animation={animations[type]}
      size={size}
      strokeColor={color}
    />
  );
}
