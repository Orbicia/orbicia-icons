import fs from "node:fs";
import path from "node:path";
import { transform } from "@svgr/core";

const SRC_DIR = path.resolve("src/svg");
const OUT_DIR = path.resolve("src/icons");
const VARIANTS_DIR = path.resolve("src/icons/variants");
const INDEX_FILE = path.resolve("src/index.ts");
const TYPES_FILE = path.resolve("src/types.ts");

const pascal = (name) =>
    name
      .replace(/(^\w|[-_]\w)/g, (m) => m.replace(/[-_]/g, "").toUpperCase())
      .replace(/[^a-zA-Z0-9]/g, "");

const isSvg = (f) => f.toLowerCase().endsWith(".svg");

function parseFileName(file) {
    const base = path.basename(file, ".svg");

    const m = base.match(/^(.*)_(fill|outline)$/i);
    if (m) {
        return { key: m[1], variant: m[2].toLowerCase() };
    }
    return { key: base, variant: "single" };
}

function ensureDir(dir) {
    fs.mkdirSync(dir, { recursive: true });
}

function writeFile(filePath, content) {
    fs.writeFileSync(filePath, content, "utf8");
}

function readSvg(filePath) {
    return fs.readFileSync(filePath, "utf8");
}

function svgrOptionsForVariant(variant) {
    const replaceAttrValues = {
        "#000": "currentColor",
        "#000000": "currentColor",
        "rgb(0,0,0)": "currentColor",
        "rgb(0, 0, 0)": "currentColor",
        "black": "currentColor"
    };
  
    const base = {
        typescript: true,
        icon: true,
        expandProps: "end",
        prettier: false,
        exportType: "default",
        plugins: ["@svgr/plugin-svgo", "@svgr/plugin-jsx"],
        replaceAttrValues,
        svgoConfig: {
            plugins: [
                {
                    name: "preset-default",
                    params: {
                        overrides: {
                            removeViewBox: false
                        }
                    }
                },
                { name: "removeDimensions", active: true }
            ]
        }
    };
  
    if (variant === "outline") {
        return {
            ...base,
            svgProps: {
            stroke: "currentColor",
            fill: "none",
            "aria-hidden": "true",
            focusable: "false"
            }
        };
    }
  
    return {
        ...base,
        svgProps: {
            fill: "currentColor",
            "aria-hidden": "true",
            focusable: "false"
        }
    };
}

function wrapperSource({iconName, baseName, hasFill, hasOutline, hasSingle}) {
    const imports = [];
    if (hasFill) imports.push(`import ${baseName}Fill from "./variants/${baseName}Fill";`);
    if (hasOutline) imports.push(`import ${baseName}Outline from "./variants/${baseName}Outline";`);
    if (hasSingle) imports.push(`import ${baseName}Single from "./variants/${baseName}Single";`);
  
    const defaultVariant = hasOutline ? "outline" : hasFill ? "fill" : "single";
  
    let pickLogic = "";
    if (hasSingle && !hasFill && !hasOutline) {
        pickLogic = `  const Comp = ${baseName}Single;\n`;
    } else {
        const fillExpr = hasFill
            ? `${baseName}Fill`
            : hasOutline
            ? `${baseName}Outline`
            : `${baseName}Single`;
        const outlineExpr = hasOutline
            ? `${baseName}Outline`
            : hasFill
            ? `${baseName}Fill`
            : `${baseName}Single`;
    
        pickLogic = `  const Comp = type === "fill" ? ${fillExpr} : ${outlineExpr};\n`;
    }
  
    return `import * as React from "react";
    import type { OrbiciaIconProps } from "../types";
    ${imports.join("\n")}
  
    export default function ${iconName}({
        type = "${defaultVariant === "single" ? "outline" : defaultVariant}",
        size = 24,
        ...props
    }: OrbiciaIconProps) {
    ${pickLogic}
        return (
            <Comp 
                width={size} 
                height={size} 
                style={{ color: "black", ...props.style }} 
                {...props} 
            />
        );
    }
    `;
}

const files = fs.existsSync(SRC_DIR) ? fs.readdirSync(SRC_DIR).filter(isSvg) : [];

ensureDir(OUT_DIR);
ensureDir(VARIANTS_DIR);

/** @type {Record<string, { fill?: string, outline?: string, single?: string }>} */
const groups = {};

for (const file of files) {
    const { key, variant } = parseFileName(file);
    groups[key] ??= {};
    groups[key][variant] = file;
}

writeFile(
    TYPES_FILE,
    `import * as React from "react";
    
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
    };`
);

const exports = [];
let generatedVariantsCount = 0;
let generatedWrappersCount = 0;

for (const [key, variants] of Object.entries(groups)) {
    const baseName = pascal(key);
  
    const makeVariant = async (variantKey, suffix, svgrVariant) => {
        const file = variants[variantKey];
        if (!file) return false;
    
        const svgPath = path.join(SRC_DIR, file);
        const svgCode = readSvg(svgPath);
    
        const componentName = `${baseName}${suffix}`;
    
        const tsx = await transform(
            svgCode,
            svgrOptionsForVariant(svgrVariant),
            { componentName }
        );
  
        writeFile(path.join(VARIANTS_DIR, `${componentName}.tsx`), tsx);
        generatedVariantsCount++;
        return true;
    };
  
    const hasFill = await makeVariant("fill", "Fill", "fill");
    const hasOutline = await makeVariant("outline", "Outline", "outline");
  
    const hasSingle = await makeVariant("single", "Single", "fill");
  
    const iconName = `${baseName}Icon`;
    const wrapperTsx = wrapperSource({
        iconName,
        baseName,
        hasFill,
        hasOutline,
        hasSingle
    });
  
    writeFile(path.join(OUT_DIR, `${iconName}.tsx`), wrapperTsx);
    exports.push(`export { default as ${iconName} } from "./icons/${iconName}";`);
    generatedWrappersCount++;
}

exports.unshift(`export type { IconType, OrbiciaIconProps } from "./types";`);

writeFile(INDEX_FILE, exports.join("\n") + "\n");

console.log(
    `✅ Generated: ${generatedWrappersCount} icon wrappers, ${generatedVariantsCount} variant components.`
);