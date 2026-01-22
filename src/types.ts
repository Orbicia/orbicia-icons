import * as React from "react";
    
    export type IconType = "fill" | "outline";
    
    /**
     * Props communes à toutes les icônes Orbicia.
     * - size -> map sur width/height
     * - type -> choisit fill/outline (si dispo)
     * - style={{ color }} fonctionne si tes SVG utilisent currentColor
     */
    export type OrbiciaIconProps = Omit<React.SVGProps<SVGSVGElement>, "type"> & {
        size?: number | string;
        type?: IconType;
    };