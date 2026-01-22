import * as React from "react";
    import type { OrbiciaIconProps } from "../types";
    import HomeFill from "./variants/HomeFill";
import HomeOutline from "./variants/HomeOutline";
  
    export default function HomeIcon({
        type = "outline",
        size = 24,
        ...props
    }: OrbiciaIconProps) {
      const Comp = type === "fill" ? HomeFill : HomeOutline;

        return (
            <Comp 
                width={size} 
                height={size} 
                style={{ color: "black", ...props.style }} 
                {...props} 
            />
        );
    }
    